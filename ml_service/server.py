"""
FastAPI Microservice for Predictive Maintenance ML Models
Exposes endpoints for failure risk prediction, remaining useful life (RUL) regression,
model benchmark metrics, and fleet diagnostics.
"""
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure current directory is on path
CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR))

from predictor import predictor

app = FastAPI(
    title="Predictive Maintenance ML Microservice",
    description="FastAPI service serving XGBoost RUL Regressor and Failure Classifier models",
    version="1.0.0"
)

# Enable CORS for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    machine_id: Optional[str] = Field(default=None, alias="machineId")
    sensors: Dict[str, Any] = Field(default_factory=dict)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

    class Config:
        populate_by_name = True

@app.get("/")
def get_service_info():
    """
    Root endpoint queried by Express mlService.checkHealth()
    """
    return {
        "status": "online",
        "service": "predictive-maintenance-ml-microservice",
        "version": "1.0.0",
        "modelName": "XGBoost RUL Regressor & 30-Cycle Failure Classifier",
        "dataset": "NASA Turbofan Degradation (C-MAPSS FD001) & Industrial Telemetry",
        "featuresCount": len(predictor.feature_names),
        "benchmarkMetrics": predictor.metrics,
        "fleetSummary": predictor.summary_stats
    }

@app.get("/health")
def healthcheck():
    """
    Healthcheck endpoint confirming model is loaded and ready
    """
    return {
        "status": "healthy",
        "modelLoaded": predictor.is_loaded,
        "featuresCount": len(predictor.feature_names),
        "models": {
            "regressor": "regressor_xgb.joblib",
            "classifier": "classifier_xgb.joblib",
            "scaler": "scaler.joblib"
        }
    }

@app.get("/metrics")
def get_metrics():
    """
    Returns official benchmark evaluation metrics (R2, RMSE, MAE, NASA PHM score, ROC-AUC)
    """
    return {
        "success": True,
        "dataset": "NASA C-MAPSS FD001 Benchmark Set",
        "metrics": predictor.metrics
    }

@app.get("/feature-importance")
def get_feature_importance():
    """
    Returns feature importance ranking of the trained XGBoost model
    """
    return {
        "success": True,
        "features": predictor.feature_importance
    }

@app.get("/fleet-predictions")
def get_fleet_predictions(
    risk_tier: Optional[str] = Query(None, description="Filter by risk tier: CRITICAL, HIGH, MEDIUM, LOW"),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Returns precomputed fleet risk profiles and component diagnoses
    """
    all_units = list(predictor.fleet_predictions.values())
    if risk_tier:
        all_units = [u for u in all_units if u.get("risk_tier", "").upper() == risk_tier.upper()]

    return {
        "success": True,
        "count": len(all_units[:limit]),
        "total": len(all_units),
        "data": all_units[:limit]
    }

@app.post("/predict")
def predict(payload: PredictRequest):
    """
    Predicts machine failure risk, remaining useful life, health score, and component diagnostics.
    """
    machine_id = payload.machine_id or "MCH-GENERIC"
    sensors = payload.sensors or {}
    metadata = payload.metadata or {}

    try:
        result = predictor.predict(machine_id, sensors, metadata)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction evaluation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("[ML Service] Starting FastAPI microservice on http://127.0.0.1:8000...")
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=False, log_level="info")
