"""
Meridian Predictive Maintenance ML Predictor
Loads trained XGBoost Regressor and Classifier models (NASA C-MAPSS & Industrial telemetry).
Computes Remaining Useful Life (RUL), 30-cycle failure probability, risk tiers,
failing component diagnostics, and recommended maintenance actions.
"""
import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
import joblib

CURRENT_DIR = Path(__file__).resolve().parent
MODELS_DIR = CURRENT_DIR / "models"

class MLPredictor:
    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = Path(models_dir)
        self.is_loaded = False
        self.load_models()

    def load_models(self):
        try:
            self.regressor = joblib.load(self.models_dir / "regressor_xgb.joblib")
            self.classifier = joblib.load(self.models_dir / "classifier_xgb.joblib")
            self.scaler = joblib.load(self.models_dir / "scaler.joblib")
            self.feature_names = joblib.load(self.models_dir / "feature_names.joblib")

            # Load metadata artifacts if available
            self.metrics = {}
            if (self.models_dir / "metrics.json").exists():
                with open(self.models_dir / "metrics.json", "r") as f:
                    self.metrics = json.load(f)

            self.feature_importance = []
            if (self.models_dir / "feature_importance.json").exists():
                with open(self.models_dir / "feature_importance.json", "r") as f:
                    self.feature_importance = json.load(f)

            self.summary_stats = {}
            if (self.models_dir / "summary_stats.json").exists():
                with open(self.models_dir / "summary_stats.json", "r") as f:
                    self.summary_stats = json.load(f)

            self.fleet_predictions = {}
            if (self.models_dir / "fleet_predictions.json").exists():
                with open(self.models_dir / "fleet_predictions.json", "r") as f:
                    fleet_list = json.load(f)
                    for item in fleet_list:
                        self.fleet_predictions[item.get("unit_id")] = item

            self.baseline_features = pd.Series(self.scaler.mean_, index=self.feature_names)
            self.is_loaded = True
            print(f"[MLPredictor] Loaded XGBoost models successfully from {self.models_dir}")
        except Exception as e:
            print(f"[MLPredictor Error] Failed to load models: {e}")
            raise e

    def build_feature_dataframe(self, sensors: Dict[str, Any]) -> pd.DataFrame:
        """
        Constructs a 1-row DataFrame matching the 74 feature names expected by the model.
        Supports both direct C-MAPSS feature names and industrial machine sensor mappings.
        """
        row = self.baseline_features.copy()

        # Direct C-MAPSS features (if provided)
        for feat in self.feature_names:
            if feat in sensors and sensors[feat] is not None:
                try:
                    row[feat] = float(sensors[feat])
                except (ValueError, TypeError):
                    pass

        # Check for industrial sensor telemetry keys and map to model degradation features
        air_temp = sensors.get("airTemperature") or sensors.get("airTempKelvin")
        proc_temp = sensors.get("processTemperature") or sensors.get("processTempKelvin")
        speed = sensors.get("rotationalSpeed") or sensors.get("rotationalSpeedRpm")
        torque = sensors.get("torque") or sensors.get("torqueNm")
        tool_wear = sensors.get("toolWear") or sensors.get("toolWearMinutes")
        vibration = sensors.get("vibration") or sensors.get("vibrationMmS")
        pressure = sensors.get("pressureBar")
        cycle = sensors.get("cycle")

        if cycle is not None:
            try:
                row["cycle"] = float(cycle)
            except (ValueError, TypeError):
                pass

        # If industrial telemetry is provided, synthesize the degradation features
        if any(v is not None for v in [air_temp, proc_temp, speed, torque, tool_wear, vibration, pressure]):
            tool_wear_val = float(tool_wear or 0.0)
            vibration_val = float(vibration or 2.0)
            torque_val = float(torque or 40.0)
            speed_val = float(speed or 1500.0)
            air_temp_val = float(air_temp or 300.0)
            proc_temp_val = float(proc_temp or 310.0)
            temp_diff = proc_temp_val - air_temp_val

            # Wear progression maps directly to operating cycle and thermal/pressure drift
            wear_ratio = min(1.3, max(0.0, tool_wear_val / 220.0))
            vib_ratio = min(2.0, max(0.0, vibration_val / 4.5))
            temp_stress = min(2.0, max(0.0, (temp_diff - 8.6) / 10.0))
            power_watts = torque_val * (speed_val * (2.0 * np.pi / 60.0))
            power_stress = 1.0 if (power_watts < 3500 or power_watts > 9000) else 0.0

            # Scale primary degradation indicators
            row["cycle"] = max(row["cycle"], 50.0 + wear_ratio * 160.0)

            # Thermal exhaust elevation
            row["s_4"] += (temp_stress * 18.0) + (wear_ratio * 15.0)
            row["s_4_roll_mean_5"] = row["s_4"]
            row["s_4_roll_mean_15"] = row["s_4"]
            row["s_4_drift"] = (temp_stress * 10.0) + (wear_ratio * 12.0)

            # Core compressor temp
            row["s_3"] += (wear_ratio * 14.0) + (temp_stress * 8.0)
            row["s_3_roll_mean_5"] = row["s_3"]
            row["s_3_roll_mean_15"] = row["s_3"]
            row["s_3_drift"] = wear_ratio * 10.0

            # Static pressure & flutter
            row["s_11"] += (wear_ratio * 0.35) + (power_stress * 0.25)
            row["s_11_roll_mean_5"] = row["s_11"]
            row["s_11_roll_mean_15"] = row["s_11"]
            row["s_11_drift"] = wear_ratio * 0.40

            # Vibration flutter
            if vib_ratio > 1.0:
                row["s_4_roll_std_10"] = max(row["s_4_roll_std_10"], (vib_ratio - 1.0) * 4.0)
                row["s_11_roll_std_10"] = max(row["s_11_roll_std_10"], (vib_ratio - 1.0) * 0.1)
                row["s_20"] += (vib_ratio - 1.0) * 1.5
                row["s_21"] += (vib_ratio - 1.0) * 1.2

        df = pd.DataFrame([row], columns=self.feature_names)
        return df

    def predict(self, machine_id: str, sensors: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Performs full inference using trained XGBoost Regressor and Classifier.
        Returns prediction dictionary formatted for Express portal consumption.
        """
        unit_match = None
        clean_id = str(machine_id).strip().upper()
        if clean_id.startswith("UNIT-"):
            try:
                u_num = int(clean_id.replace("UNIT-", ""))
                unit_match = self.fleet_predictions.get(u_num)
            except ValueError:
                pass
        elif clean_id.isdigit():
            unit_match = self.fleet_predictions.get(int(clean_id))

        if unit_match and len(sensors) <= 1:
            pred_rul = unit_match["predicted_rul"]
            risk_prob = unit_match["failure_probability"] / 100.0
            risk_level = unit_match["risk_tier"].lower()
            health_score = max(0, min(100, int(100 - unit_match["risk_score_pct"])))
            failure_mode = unit_match["primary_component"]
            recommendation = unit_match["recommended_action"]
            confidence = unit_match["component_confidence"] / 100.0
        else:
            # Build feature row and run inference live through XGBoost models
            df_features = self.build_feature_dataframe(sensors)
            X_scaled = self.scaler.transform(df_features)

            # RUL regression
            pred_rul_arr = self.regressor.predict(X_scaled)
            pred_rul = float(np.clip(pred_rul_arr[0], a_min=1.0, a_max=125.0))

            # Failure within 30 cycles classification probability
            pred_proba_arr = self.classifier.predict_proba(X_scaled)
            raw_prob = float(pred_proba_arr[0, 1])

            # Apply domain industrial failure triggers for multi-domain manufacturing telemetry
            air_temp = float(sensors.get("airTemperature") or sensors.get("airTempKelvin") or 300.0)
            proc_temp = float(sensors.get("processTemperature") or sensors.get("processTempKelvin") or 310.0)
            speed_val = float(sensors.get("rotationalSpeed") or sensors.get("rotationalSpeedRpm") or 1500.0)
            torque_val = float(sensors.get("torque") or sensors.get("torqueNm") or 40.0)
            tool_wear_val = float(sensors.get("toolWear") or sensors.get("toolWearMinutes") or 0.0)
            vibration_val = float(sensors.get("vibration") or sensors.get("vibrationMmS") or 1.8)
            temp_diff = proc_temp - air_temp
            power_watts = torque_val * (speed_val * (2.0 * np.pi / 60.0))

            physics_risk = 0.05
            if temp_diff < 8.6 and speed_val < 1380:
                physics_risk = max(physics_risk, 0.82)
            if power_watts < 3500 or power_watts > 9000:
                physics_risk = max(physics_risk, 0.88)
            if tool_wear_val >= 220:
                physics_risk = max(physics_risk, 0.95)
            elif tool_wear_val >= 180:
                physics_risk = max(physics_risk, 0.65)
            if tool_wear_val * torque_val > 11000:
                physics_risk = max(physics_risk, 0.90)
            if vibration_val > 4.5:
                physics_risk = max(physics_risk, 0.78)

            risk_prob = max(raw_prob, physics_risk)

            # Harmonize RUL with high risk if triggered
            if risk_prob >= 0.80:
                pred_rul = min(pred_rul, max(1.0, round(5.0 * (1.0 - risk_prob), 1)))
            elif risk_prob >= 0.50:
                pred_rul = min(pred_rul, round(14.0 * (1.0 - risk_prob) + 5.0, 1))

            risk_prob = round(float(np.clip(risk_prob, 0.01, 0.99)), 3)

            # Assign categorical risk level
            if risk_prob >= 0.80 or pred_rul <= 25:
                risk_level = "critical"
            elif risk_prob >= 0.50 or pred_rul <= 50:
                risk_level = "high"
            elif risk_prob >= 0.25 or pred_rul <= 85:
                risk_level = "medium"
            else:
                risk_level = "low"

            health_score = max(0, min(100, int((1.0 - risk_prob) * 100)))

            failure_mode, recommendation = self._diagnose_failure(sensors, pred_rul, risk_level)
            confidence = 0.94 if risk_level in ["critical", "high"] else 0.91

        return {
            "success": True,
            "machineId": clean_id,
            "predictionType": "failure_risk_classification",
            "modelVersion": "meridian-xgb-v1.0",
            "isMock": False,
            "executionSource": "ml_service_fastapi",
            "prediction": {
                "riskProbability": risk_prob,
                "riskLevel": risk_level,
                "healthScore": health_score,
                "estimatedRULDays": int(round(pred_rul)),
                "suspectedFailureMode": failure_mode,
                "recommendedAction": recommendation,
                "confidence": confidence
            }
        }

    def _diagnose_failure(self, sensors: Dict[str, Any], pred_rul: float, risk_level: str) -> tuple[str, str]:
        """
        Diagnoses primary failing component and root cause actionable advice.
        """
        air_temp = float(sensors.get("airTemperature") or sensors.get("airTempKelvin") or 300.0)
        proc_temp = float(sensors.get("processTemperature") or sensors.get("processTempKelvin") or 310.0)
        speed = float(sensors.get("rotationalSpeed") or sensors.get("rotationalSpeedRpm") or 1500.0)
        torque = float(sensors.get("torque") or sensors.get("torqueNm") or 40.0)
        tool_wear = float(sensors.get("toolWear") or sensors.get("toolWearMinutes") or 0.0)
        vibration = float(sensors.get("vibration") or sensors.get("vibrationMmS") or 1.8)

        temp_diff = proc_temp - air_temp
        power_watts = torque * (speed * (2 * np.pi / 60))

        if tool_wear >= 200 or torque * tool_wear > 11000:
            return (
                "Tool Wear & Mechanical Overstrain Failure (TWF/OSF)",
                "IMMEDIATE ACTION: Replace cutting insert and spindle toolholder; reduce feed torque."
            )
        elif vibration > 4.5:
            return (
                "Bearing Misalignment / Rotor Imbalance",
                "ACTION: Check dynamic rotor balancing, bearing raceway clearance, and vibration dampeners."
            )
        elif temp_diff < 8.6 and speed < 1380:
            return (
                "Heat Dissipation Failure (HDF)",
                "ACTION: Inspect cooling duct flow, coolant pressure, and heat exchanger fins."
            )
        elif power_watts < 3500 or power_watts > 9000:
            return (
                "Power Transmission Failure (PWF)",
                "ACTION: Inspect drive belt tension, electric motor windings, and power inverter."
            )
        elif risk_level == "critical":
            return (
                "High Pressure Compressor (HPC) Degradation",
                "Borescope inspection of stages 4-9; compressor wash; replace eroded blade sets."
            )
        elif risk_level == "high":
            return (
                "Turbine Section Thermal Wear",
                "Overhaul hot section; check nozzle guide vanes; replace high-temperature seals."
            )
        elif risk_level == "medium":
            return (
                "Elevated Telemetry Drift",
                "Schedule preventative inspection during upcoming planned maintenance window."
            )
        else:
            return (
                "None",
                "Machine operating within normal parameters. Routine monitoring scheduled."
            )

# Global singleton
predictor = MLPredictor()
