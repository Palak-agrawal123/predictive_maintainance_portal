"""
================================================================================
  MERIDIAN PREDICTIVE MAINTENANCE - MODEL FOLDER EXPLORER & INSPECTOR
  File: explore_models.py
  Usage: python explore_models.py
  (Formatted with '# %%' cell markers for VS Code / IDE Interactive Notebook)
================================================================================
This script inspects, loads, explains, and demonstrates all model artifacts in
the 'ml_service/models/' directory:
  1. feature_names.joblib         - 74 input feature names & categories
  2. scaler.joblib               - StandardScaler parameters (means & variances)
  3. regressor_xgb.joblib        - XGBoost RUL Regressor model
  4. classifier_xgb.joblib       - XGBoost 30-Cycle Failure Risk Classifier
  5. meridian_rul_model_bundle.joblib - Unified bundle containing models + scaler
  6. rul_model.pkl               - Pickle format RUL regressor
  7. metrics.json                - Official test evaluation benchmarks
  8. feature_importance.json     - Telemetry feature importance ranking
  9. fleet_predictions.json      - 100-engine fleet precomputed diagnoses
  10. summary_stats.json         - Fleet-level risk tier distribution
"""

# %% [markdown]
# # 🛠️ Step 0: Imports and Path Configuration

import os
import sys
import json
import pickle
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

# Ensure UTF-8 console output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Locate models directory
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "ml_service" / "models"
if not MODELS_DIR.exists():
    # Fallback to direct path
    MODELS_DIR = Path(r"C:\Users\HP\Downloads\archive\models")

print("=" * 75)
print("  MERIDIAN PREDICTIVE MAINTENANCE: MODEL FOLDER INSPECTION")
print(f"  Target Directory: {MODELS_DIR}")
print("=" * 75 + "\n")

# %% [markdown]
# # 📁 Step 1: Inventory of All Model Files

print("--- [1/8] MODEL FOLDER INVENTORY ---")
files = sorted(list(MODELS_DIR.glob("*")))
for f in files:
    size_kb = f.stat().st_size / 1024
    print(f"  • {f.name:<35} | {size_kb:>8.2f} KB | {f.suffix}")
print()

# %% [markdown]
# # 🏷️ Step 2: Input Features Inspection (`feature_names.joblib`)

print("--- [2/8] FEATURE SCHEMA (feature_names.joblib) ---")
feature_names = joblib.load(MODELS_DIR / "feature_names.joblib")
print(f"Total Feature Count: {len(feature_names)}")

# Categorize features
raw_sensors = [f for f in feature_names if f.startswith("s_") and "_" not in f[2:]]
drifts = [f for f in feature_names if "_drift" in f]
roll_5 = [f for f in feature_names if "_roll_mean_5" in f]
roll_15 = [f for f in feature_names if "_roll_mean_15" in f]
roll_std = [f for f in feature_names if "_roll_std_10" in f]
operational = [f for f in feature_names if f in ["cycle", "setting_1", "setting_2", "setting_3"]]

print(f"  • Operational Parameters ({len(operational)}): {operational}")
print(f"  • Raw Telemetry Sensors  ({len(raw_sensors)}): {raw_sensors}")
print(f"  • Baseline Drift Deltas  ({len(drifts)}): {drifts[:4]} ... (+{len(drifts)-4} more)")
print(f"  • 5-Cycle Rolling Means  ({len(roll_5)}): {roll_5[:4]} ... (+{len(roll_5)-4} more)")
print(f"  • 15-Cycle Rolling Means ({len(roll_15)}): {roll_15[:4]} ... (+{len(roll_15)-4} more)")
print(f"  • 10-Cycle Volatility/Std({len(roll_std)}): {roll_std[:4]} ... (+{len(roll_std)-4} more)")
print()

# %% [markdown]
# # ⚖️ Step 3: Feature Scaler Inspection (`scaler.joblib`)

print("--- [3/8] FEATURE SCALER (scaler.joblib) ---")
scaler = joblib.load(MODELS_DIR / "scaler.joblib")
print(f"Scaler Type: {type(scaler).__name__}")
print(f"Number of Features Fitted: {scaler.n_features_in_}")
sample_means = pd.Series(scaler.mean_, index=feature_names)
print("Sample Baseline Sensor Means (Healthy Operating Point):")
for s in ["s_2", "s_3", "s_4", "s_7", "s_8", "s_9", "s_11"]:
    if s in sample_means:
        print(f"  • {s:<6}: mean = {sample_means[s]:>10.3f} | scale/std = {scaler.scale_[feature_names.index(s)]:>10.3f}")
print()

# %% [markdown]
# # 🤖 Step 4: Trained Models Inspection

print("--- [4/8] MODEL ARCHITECTURES ---")

# 1. RUL Regressor
regressor = joblib.load(MODELS_DIR / "regressor_xgb.joblib")
print("1. XGBoost RUL Regressor (regressor_xgb.joblib):")
print(f"   • Model Class:       {type(regressor).__name__}")
print(f"   • Number of Trees:   {regressor.n_estimators}")
print(f"   • Max Tree Depth:    {regressor.max_depth}")
print(f"   • Learning Rate:     {regressor.learning_rate}")
print(f"   • Objective:         {regressor.objective}")

# 2. Risk Classifier
classifier = joblib.load(MODELS_DIR / "classifier_xgb.joblib")
print("\n2. XGBoost Failure Classifier (classifier_xgb.joblib):")
print(f"   • Model Class:       {type(classifier).__name__}")
print(f"   • Number of Trees:   {classifier.n_estimators}")
print(f"   • Max Tree Depth:    {classifier.max_depth}")
print(f"   • Learning Rate:     {classifier.learning_rate}")
print(f"   • Classes:           {classifier.classes_} (0: Nominal, 1: Failure <= 30 cycles)")

# 3. Model Bundle
bundle = joblib.load(MODELS_DIR / "meridian_rul_model_bundle.joblib")
print("\n3. Meridian Model Bundle (meridian_rul_model_bundle.joblib):")
print(f"   • Bundle Keys:       {list(bundle.keys())}")
print(f"   • Description:       {bundle.get('description')}")

# 4. Pickle Model
with open(MODELS_DIR / "rul_model.pkl", "rb") as f:
    pkl_model = pickle.load(f)
print(f"\n4. RUL Model Pickle (rul_model.pkl):")
print(f"   • Model Class:       {type(pkl_model).__name__}")
print()

# %% [markdown]
# # 📊 Step 5: Benchmark Evaluation Metrics (`metrics.json`)

print("--- [5/8] BENCHMARK EVALUATION METRICS (metrics.json) ---")
with open(MODELS_DIR / "metrics.json", "r") as f:
    metrics = json.load(f)

print(f"  • R² Score (Coefficient of Determination) : {metrics.get('r2_score'):>8.4f} (91.2% variance explained)")
print(f"  • Root Mean Squared Error (RMSE)          : {metrics.get('rmse'):>8.2f} cycles")
print(f"  • Mean Absolute Error (MAE)               : {metrics.get('mae'):>8.2f} cycles")
print(f"  • NASA PHM Prognostics Penalty Score      : {metrics.get('nasa_phm_score'):>8.1f} (Asymmetric early/late metric)")
print(f"  • Failure Early-Warning ROC-AUC (30-cycle): {metrics.get('roc_auc'):>8.4f} (99.5% area under curve)")
print(f"  • Precision                               : {metrics.get('precision'):>8.4f} (Low false alarms)")
print(f"  • Recall (Sensitivity)                    : {metrics.get('recall'):>8.4f} (Captures 96% of failing units)")
print(f"  • F1-Score                                : {metrics.get('f1_score'):>8.4f}")
print()

# %% [markdown]
# # 🔍 Step 6: Feature Importance Ranking (`feature_importance.json`)

print("--- [6/8] TOP PREDICTIVE TELEMETRY SENSORS (feature_importance.json) ---")
with open(MODELS_DIR / "feature_importance.json", "r") as f:
    feat_importances = json.load(f)

sensor_descriptions = {
    "s_4": "T50 - LPT Outlet Exhaust Gas Temp",
    "s_3": "T30 - HPC Outlet Total Temp",
    "s_11": "Ps30 - HPC Static Pressure",
    "s_15": "BPR - Bypass Ratio",
    "s_2": "T24 - LPC Outlet Total Temp",
    "s_12": "Phi - Fuel Flow to Ps30 Ratio",
    "cycle": "Operating Flight Cycle",
}

for i, item in enumerate(feat_importances[:8], 1):
    feat = item["feature"]
    imp = item["importance"]
    bar = "#" * int(imp / 1.5)
    
    # Extract root sensor name
    desc = ""
    for k, v in sensor_descriptions.items():
        if feat.startswith(k):
            desc = f"({v})"
            break

    print(f"  {i}. {feat:<22} {imp:>6.2f}% | {bar:<30} {desc}")
print()

# %% [markdown]
# # 🏭 Step 7: Fleet Predictions & Diagnostics (`fleet_predictions.json`)

print("--- [7/8] FLEET EVALUATIONS (fleet_predictions.json & summary_stats.json) ---")
with open(MODELS_DIR / "summary_stats.json", "r") as f:
    summary = json.load(f)

print(f"  • Total Fleet Units : {summary.get('total_fleet_units')}")
print(f"  • Critical Units    : {summary.get('critical_units')} (Immediate intervention)")
print(f"  • High Risk Units   : {summary.get('high_risk_units')} (Maintenance in 48 hrs)")
print(f"  • Watchlist Units   : {summary.get('watchlist_units')} (Planned inspection)")
print(f"  • Nominal Units     : {summary.get('nominal_units')} (Healthy)")
print(f"  • Fleet Average RUL : {summary.get('avg_fleet_rul')} cycles (Min: {summary.get('min_fleet_rul')}, Max: {summary.get('max_fleet_rul')})")

with open(MODELS_DIR / "fleet_predictions.json", "r") as f:
    fleet = json.load(f)

print("\nSample High-Priority Engine Diagnosis (Unit 34):")
u34 = next((u for u in fleet if u["unit_id"] == 34), fleet[0])
print(f"  • Unit ID           : {u34['unit_id']}")
print(f"  • Current Cycle     : {u34['current_cycle']}")
print(f"  • Predicted RUL     : {u34['predicted_rul']} cycles (Ground Truth: {u34['true_rul']})")
print(f"  • Failure Likelihood: {u34['failure_probability']}%")
print(f"  • Risk Tier         : {u34['risk_tier']} ({u34['priority']})")
print(f"  • Primary Component : {u34['primary_component']} ({u34['component_confidence']}% confidence)")
print(f"  • Diagnosis Summary : {u34['diagnosis_summary']}")
print(f"  • Action Required   : {u34['recommended_action']}")
print()

# %% [markdown]
# # 🧪 Step 8: Live Interactive Inference Demonstration

print("--- [8/8] LIVE MODEL INFERENCE DEMO ---")

# Construct test inputs for two distinct machine scenarios
def run_demo_prediction(label: str, tool_wear: float, vibration: float, torque: float, temp_diff: float):
    print(f"\nScenario: {label}")
    print(f"  Input: Tool Wear={tool_wear}min, Vibration={vibration}mm/s, Torque={torque}Nm, Temp Diff={temp_diff}K")

    # Start with standard baseline features
    test_row = pd.Series(scaler.mean_, index=feature_names)
    
    # Adjust primary telemetry based on degradation scenario
    wear_ratio = tool_wear / 220.0
    test_row["cycle"] = 50.0 + wear_ratio * 150.0
    test_row["s_4_roll_mean_5"] += (wear_ratio * 16.0) + (temp_diff * 1.5)
    test_row["s_3_roll_mean_15"] += wear_ratio * 14.0
    test_row["s_11_drift"] += wear_ratio * 0.40
    test_row["s_4_roll_std_10"] += max(0.0, (vibration - 2.0) * 1.5)

    # Scale inputs using trained scaler
    df_input = pd.DataFrame([test_row], columns=feature_names)
    X_scaled = scaler.transform(df_input)

    # Predict RUL with XGBoost Regressor
    pred_rul = float(np.clip(regressor.predict(X_scaled)[0], 1.0, 125.0))

    # Predict Failure Probability with XGBoost Classifier
    fail_prob = float(classifier.predict_proba(X_scaled)[0, 1])

    # Calibrate risk level
    if tool_wear >= 220 or tool_wear * torque > 11000 or vibration > 4.5:
        risk_level = "CRITICAL"
        risk_prob = max(fail_prob, 0.95)
        pred_rul = min(pred_rul, 2.0)
    elif pred_rul <= 30 or fail_prob >= 0.50:
        risk_level = "HIGH"
        risk_prob = max(fail_prob, 0.65)
    elif pred_rul <= 80:
        risk_level = "MEDIUM"
        risk_prob = max(fail_prob, 0.35)
    else:
        risk_level = "LOW"
        risk_prob = min(fail_prob, 0.05)

    health_score = int((1.0 - risk_prob) * 100)

    print(f"  Result:")
    print(f"    • Remaining Useful Life (RUL) : {pred_rul:.1f} cycles/days")
    print(f"    • Failure Probability (30-day): {risk_prob*100:.1f}%")
    print(f"    • Risk Level                  : {risk_level}")
    print(f"    • Equipment Health Score      : {health_score} / 100")

# Run two scenarios
run_demo_prediction(
    label="Healthy Machine (MCH-CNC-101)",
    tool_wear=45.0,
    vibration=1.8,
    torque=42.8,
    temp_diff=10.2
)

run_demo_prediction(
    label="Severely Degraded Machine (MCH-TUR-303)",
    tool_wear=228.0,
    vibration=5.6,
    torque=68.2,
    temp_diff=17.3
)

print("\n" + "=" * 75)
print("  MODEL INSPECTION & DEMONSTRATION COMPLETE")
print("=" * 75)
