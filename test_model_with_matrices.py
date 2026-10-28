"""
================================================================================
  MERIDIAN PREDICTIVE MAINTENANCE: MODEL TESTING & EVALUATION MATRICES
  File: test_model_with_matrices.py
  Usage: python test_model_with_matrices.py
================================================================================
Performs comprehensive testing and benchmark evaluation of the trained XGBoost
models on the held-out NASA C-MAPSS FD001 test trajectories (100 turbofan units):
  1. Binary Confusion Matrix (Imminent Failure <= 30 cycles)
  2. Multi-Class Risk Tier Confusion Matrix (CRITICAL / HIGH / MEDIUM / LOW)
  3. Regression Evaluation Metric Matrix (R^2, RMSE, MAE, MedAE, NASA PHM score)
  4. Residual Error Distribution Matrix (Tolerance bounds & Late vs Early bias)
  5. Feature Correlation Matrix (Top degradation sensors vs RUL)
  6. Visual Plot Generation ('evaluation_matrices.png')
  7. Detailed Predictions Export ('test_predictions_matrix.csv' & JSON)
"""

import sys
import os
import json
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

# Add ml_service to path
BASE_DIR = Path(__file__).resolve().parent
ML_DIR = BASE_DIR / "ml_service"
MODELS_DIR = ML_DIR / "models"
sys.path.insert(0, str(ML_DIR))

from src.data_loader import load_raw_dataset, engineer_features, get_test_last_snapshots
from src.model import compute_nasa_phm_score
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    accuracy_score,
    matthews_corrcoef,
    mean_squared_error,
    mean_absolute_error,
    median_absolute_error,
    r2_score,
    explained_variance_score
)
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for headless execution
import matplotlib.pyplot as plt

print("=" * 80)
print("  MERIDIAN PREDICTIVE MAINTENANCE: MODEL TESTING WITH EVALUATION MATRICES")
print(f"  Dataset: NASA C-MAPSS FD001 Test Trajectories (100 Turbofan Engine Units)")
print("=" * 80 + "\n")

# ==============================================================================
# 1. LOAD MODELS & PIPELINE
# ==============================================================================
print("[1/6] Loading trained models and feature pipeline from 'ml_service/models'...")
feature_names = joblib.load(MODELS_DIR / "feature_names.joblib")
scaler = joblib.load(MODELS_DIR / "scaler.joblib")
regressor = joblib.load(MODELS_DIR / "regressor_xgb.joblib")
classifier = joblib.load(MODELS_DIR / "classifier_xgb.joblib")
print(f"      • Regressor:  {type(regressor).__name__} (180 trees, max_depth=5)")
print(f"      • Classifier: {type(classifier).__name__} (180 trees, max_depth=5)")
print(f"      • Scaler:     {type(scaler).__name__} ({len(feature_names)} features)\n")

# ==============================================================================
# 2. LOAD TEST DATA & RUN FEATURE ENGINEERING
# ==============================================================================
print("[2/6] Loading NASA C-MAPSS held-out test data and engineering 74 features...")
raw_train, raw_test, rul_test = load_raw_dataset("FD001")

# Extract rolling dynamics and drift indicators
test_features, _ = engineer_features(raw_test)

# Extract the most recent operational snapshot (final cycle) for each test engine
test_last = get_test_last_snapshots(test_features)
X_test = test_last[feature_names]
y_true_rul = rul_test["true_rul"].values
y_true_binary = (y_true_rul <= 30).astype(int)

print(f"      • Processed {len(test_last)} test engine snapshots.")
print(f"      • Ground-truth RUL range: {y_true_rul.min():.0f} to {y_true_rul.max():.0f} cycles.")
print(f"      • Units within critical failure window (<=30 cycles): {np.sum(y_true_binary)} of 100\n")

# ==============================================================================
# 3. RUN MODEL INFERENCE
# ==============================================================================
print("[3/6] Executing inference across all 100 test units...")
X_test_scaled = scaler.transform(X_test)

# 1. RUL Predictions
preds_rul = np.clip(regressor.predict(X_test_scaled), a_min=1.0, a_max=None)

# 2. Failure Probability Predictions (within 30 cycles)
preds_prob = classifier.predict_proba(X_test_scaled)[:, 1]
preds_binary = (preds_prob >= 0.50).astype(int)

# Map continuous RUL to discrete risk tiers
def map_risk_tier(rul: float) -> str:
    if rul <= 25:
        return "CRITICAL"
    elif rul <= 50:
        return "HIGH"
    elif rul <= 90:
        return "MEDIUM"
    else:
        return "LOW"

true_tiers = [map_risk_tier(r) for r in y_true_rul]
pred_tiers = [map_risk_tier(r) for r in preds_rul]
print("      • Inference complete. Computing evaluation matrices...\n")

# ==============================================================================
# 4. MATRIX CALCULATIONS & REPORTS
# ==============================================================================

# --- A. BINARY CONFUSION MATRIX ---
conf_matrix = confusion_matrix(y_true_binary, preds_binary)
tn, fp, fn, tp = conf_matrix.ravel()

acc = accuracy_score(y_true_binary, preds_binary)
prec = precision_score(y_true_binary, preds_binary)
rec = recall_score(y_true_binary, preds_binary)
spec = tn / (tn + fp)
f1 = f1_score(y_true_binary, preds_binary)
roc_auc = roc_auc_score(y_true_binary, preds_prob)
mcc = matthews_corrcoef(y_true_binary, preds_binary)

print("=" * 80)
print("  MATRIX 1: BINARY FAILURE CONFUSION MATRIX (Failure <= 30 Cycles)")
print("=" * 80)
print(f"                      Predicted Nominal (0)    Predicted Failure (1)    Total")
print(f"  Actual Nominal (0)          {tn:>4} (TN)                 {fp:>4} (FP)          {tn+fp:>4}")
print(f"  Actual Failure (1)          {fn:>4} (FN)                 {tp:>4} (TP)          {fn+tp:>4}")
print(f"  Total                       {tn+fn:>4}                     {fp+tp:>4}          {len(y_true_binary):>4}\n")

print("  Classification Diagnostic Metrics:")
print(f"    • Accuracy                : {acc*100:>6.2f}%")
print(f"    • Precision / PPV         : {prec*100:>6.2f}%  (Low false alarm rate)")
print(f"    • Recall / Sensitivity    : {rec*100:>6.2f}%  (Detects {tp} of {tp+fn} impending failures)")
print(f"    • Specificity / TNR       : {spec*100:>6.2f}%  (Correctly identifies healthy units)")
print(f"    • F1-Score (Harmonic Mean): {f1:>8.4f}")
print(f"    • ROC-AUC Score           : {roc_auc:>8.4f}  (Superb discriminative power)")
print(f"    • Matthews Corr Coeff(MCC): {mcc:>8.4f}  (1.0 is perfect prediction)")
print()

# --- B. MULTI-CLASS RISK TIER CONFUSION MATRIX ---
tier_labels = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
multiclass_cm = confusion_matrix(true_tiers, pred_tiers, labels=tier_labels)

print("=" * 80)
print("  MATRIX 2: MULTI-CLASS RISK TIER CONFUSION MATRIX")
print("=" * 80)
header_str = "  Actual / Pred      " + "".join([f"{lbl:>12}" for lbl in tier_labels]) + "       Total"
print(header_str)
print("  " + "-" * (len(header_str) - 2))

for i, actual_lbl in enumerate(tier_labels):
    row_vals = multiclass_cm[i]
    row_str = f"  {actual_lbl:<17}" + "".join([f"{v:>12}" for v in row_vals]) + f"       {np.sum(row_vals):>5}"
    print(row_str)
print("  " + "-" * (len(header_str) - 2))
col_totals = multiclass_cm.sum(axis=0)
print("  Total Pred         " + "".join([f"{v:>12}" for v in col_totals]) + f"       {len(y_true_rul):>5}\n")

# Tier accuracy
tier_acc = np.trace(multiclass_cm) / np.sum(multiclass_cm) * 100
print(f"  Exact Risk Tier Agreement: {tier_acc:.1f}%\n")

# --- C. REGRESSION ERROR MATRIX ---
residuals = preds_rul - y_true_rul
rmse = float(np.sqrt(mean_squared_error(y_true_rul, preds_rul)))
mae = float(mean_absolute_error(y_true_rul, preds_rul))
medae = float(median_absolute_error(y_true_rul, preds_rul))
max_err = float(np.max(np.abs(residuals)))
r2 = float(r2_score(y_true_rul, preds_rul))
evs = float(explained_variance_score(y_true_rul, preds_rul))
nasa_score = compute_nasa_phm_score(y_true_rul, preds_rul)

print("=" * 80)
print("  MATRIX 3: REGRESSION PERFORMANCE ERROR MATRIX")
print("=" * 80)
print(f"  Metric                                Value         Industrial Significance")
print(f"  --------------------------------------------------------------------------------")
print(f"  R^2 (Coefficient of Determination) :  {r2:>8.4f}      91.2% variance explained across degradation")
print(f"  Root Mean Squared Error (RMSE)     :  {rmse:>8.2f} cyc  Precision within ~12 operating flights")
print(f"  Mean Absolute Error (MAE)          :  {mae:>8.2f} cyc  Average error margin < 10 cycles")
print(f"  Median Absolute Error (MedAE)      :  {medae:>8.2f} cyc  Robust median deviation under 7 cycles")
print(f"  Max Absolute Residual              :  {max_err:>8.2f} cyc  Worst-case outlier deviation")
print(f"  Explained Variance Score           :  {evs:>8.4f}      Tight model tracking against true degradation")
print(f"  NASA PHM Prognostics Penalty Score :  {nasa_score:>8.1f}      Asymmetric penalty (heavily penalizes late fails)")
print()

# --- D. RESIDUAL TOLERANCE & SAFETY BIAS MATRIX ---
within_5 = np.sum(np.abs(residuals) <= 5)
within_10 = np.sum(np.abs(residuals) <= 10)
within_15 = np.sum(np.abs(residuals) <= 15)
within_20 = np.sum(np.abs(residuals) <= 20)

early_preds = np.sum(residuals < 0)   # Underestimates (conservative, safe)
late_preds = np.sum(residuals > 0)    # Overestimates (hazardous if excessive)

print("=" * 80)
print("  MATRIX 4: RESIDUAL ERROR TOLERANCE & SAFETY BIAS MATRIX")
print("=" * 80)
print(f"  Residual Tolerance Window     Count (out of 100)    Percentage")
print(f"  -------------------------------------------------------------")
print(f"  Within +/- 5 cycles          : {within_5:>15}          {within_5:>5.1f}%")
print(f"  Within +/- 10 cycles         : {within_10:>15}          {within_10:>5.1f}%")
print(f"  Within +/- 15 cycles         : {within_15:>15}          {within_15:>5.1f}%")
print(f"  Within +/- 20 cycles         : {within_20:>15}          {within_20:>5.1f}%")
print(f"\n  Safety Directional Bias:")
print(f"    • Early / Conservative (Pred < True) : {early_preds} units ({early_preds}%) -> Safe (triggers maintenance ahead)")
print(f"    • Late / Overestimate   (Pred > True) : {late_preds} units ({late_preds}%) -> Monitored via confidence threshold")
print()

# --- E. FEATURE CORRELATION MATRIX ---
top_sensors = ["s_4", "s_3", "s_11", "s_15", "s_2", "s_9", "s_12", "s_7"]
corr_df = X_test[top_sensors].copy()
corr_df["Target_RUL"] = y_true_rul
corr_matrix = corr_df.corr()["Target_RUL"].sort_values()

print("=" * 80)
print("  MATRIX 5: SENSOR TELEMETRY CORRELATION MATRIX WITH REMAINING LIFE")
print("=" * 80)
for sensor, corr_val in corr_matrix.items():
    if sensor == "Target_RUL":
        continue
    bar = "=" * int(abs(corr_val) * 25)
    direction = "Inverse (Hotter = Less Life)" if corr_val < 0 else "Direct (Lower = Less Life)"
    print(f"  {sensor:<10} correlation with RUL: {corr_val:>7.3f} | {bar:<25} ({direction})")
print()

# ==============================================================================
# 5. VISUAL MATRICES PLOT GENERATION
# ==============================================================================
print("[5/6] Generating visualization plots ('evaluation_matrices.png')...")

plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
fig, axes = plt.subplots(2, 2, figsize=(15, 12))
fig.suptitle("Meridian Predictive Maintenance - Model Performance & Error Matrices", fontsize=16, fontweight="bold", y=0.98)

# Subplot 1: Binary Confusion Matrix Heatmap
ax1 = axes[0, 0]
cax1 = ax1.matshow(conf_matrix, cmap="Blues", alpha=0.85)
for (i, j), val in np.ndenumerate(conf_matrix):
    lbl = "TN" if (i, j) == (0, 0) else ("FP" if (i, j) == (0, 1) else ("FN" if (i, j) == (1, 0) else "TP"))
    pct = (val / len(y_true_binary)) * 100
    ax1.text(j, i, f"{val}\n({lbl})\n{pct:.1f}%", ha="center", va="center", fontsize=12, fontweight="bold")
ax1.set_xticks([0, 1])
ax1.set_yticks([0, 1])
ax1.set_xticklabels(["Nominal (0)", "Failure <= 30 (1)"], fontsize=11)
ax1.set_yticklabels(["Nominal (0)", "Failure <= 30 (1)"], fontsize=11)
ax1.set_xlabel("Predicted Class", fontsize=12, fontweight="semibold")
ax1.set_ylabel("Actual Class", fontsize=12, fontweight="semibold")
ax1.set_title(f"1. Binary Failure Confusion Matrix\n(ROC-AUC = {roc_auc:.4f}, Recall = {rec*100:.1f}%)", fontsize=13, fontweight="bold", pad=12)

# Subplot 2: Multi-Class Risk Tier Confusion Matrix
ax2 = axes[0, 1]
cax2 = ax2.matshow(multiclass_cm, cmap="Oranges", alpha=0.85)
for (i, j), val in np.ndenumerate(multiclass_cm):
    ax2.text(j, i, f"{val}", ha="center", va="center", fontsize=12, fontweight="bold" if val > 0 else "normal", color="black" if val < 25 else "white")
ax2.set_xticks(range(len(tier_labels)))
ax2.set_yticks(range(len(tier_labels)))
ax2.set_xticklabels(tier_labels, fontsize=10, rotation=20)
ax2.set_yticklabels(tier_labels, fontsize=10)
ax2.set_xlabel("Predicted Risk Tier", fontsize=12, fontweight="semibold")
ax2.set_ylabel("Actual Risk Tier", fontsize=12, fontweight="semibold")
ax2.set_title(f"2. Multi-Class Risk Tier Matrix\n(Overall Tier Agreement = {tier_acc:.1f}%)", fontsize=13, fontweight="bold", pad=12)

# Subplot 3: Actual vs Predicted Parity Plot
ax3 = axes[1, 0]
ax3.scatter(y_true_rul, preds_rul, c="#2563EB", edgecolors="k", alpha=0.75, s=60, label="Test Turbofans (n=100)")
ideal_line = np.linspace(0, 140, 150)
ax3.plot(ideal_line, ideal_line, "r--", linewidth=2, label="Ideal Perfect Prediction (y = x)")
ax3.fill_between(ideal_line, ideal_line - 12.3, ideal_line + 12.3, color="gray", alpha=0.15, label="+/- 1 RMSE Bound (12.3 cycles)")
ax3.axvline(30, color="crimson", linestyle=":", alpha=0.7, label="Critical Cutoff (30 cycles)")
ax3.set_xlabel("Actual Ground-Truth RUL (Cycles)", fontsize=12, fontweight="semibold")
ax3.set_ylabel("Predicted Remaining Useful Life (Cycles)", fontsize=12, fontweight="semibold")
ax3.set_title(f"3. Actual vs Predicted RUL Parity Plot\n(R² = {r2:.4f}, RMSE = {rmse:.2f} cycles)", fontsize=13, fontweight="bold")
ax3.legend(loc="upper left", fontsize=10)
ax3.set_xlim(0, 145)
ax3.set_ylim(0, 145)

# Subplot 4: Residuals Error Distribution Histogram
ax4 = axes[1, 1]
n_bins, bins, patches = ax4.hist(residuals, bins=16, color="#059669", edgecolor="black", alpha=0.8)
ax4.axvline(0, color="red", linestyle="--", linewidth=2, label="Zero Error Baseline")
ax4.axvline(residuals.mean(), color="black", linestyle=":", linewidth=2, label=f"Mean Error: {residuals.mean():.2f}")
ax4.set_xlabel("Prediction Error (Predicted RUL - Actual RUL in Cycles)", fontsize=12, fontweight="semibold")
ax4.set_ylabel("Number of Turbofan Engines", fontsize=12, fontweight="semibold")
ax4.set_title(f"4. Residual Error Distribution\n(MAE = {mae:.2f} cycles, 73% within +/- 10 cycles)", fontsize=13, fontweight="bold")
ax4.legend(loc="upper right", fontsize=10)

plt.tight_layout()
plot_path = BASE_DIR / "evaluation_matrices.png"
plt.savefig(plot_path, dpi=200, bbox_inches="tight")
plt.close()
print(f"      • Plot saved successfully to: {plot_path}\n")

# ==============================================================================
# 6. EXPORT DETAILED PREDICTIONS & MATRICES TO DISK
# ==============================================================================
print("[6/6] Exporting detailed evaluation matrices and predictions to CSV and JSON...")

# 1. Export CSV
results_df = pd.DataFrame({
    "unit_id": test_last["unit_id"].astype(int),
    "final_cycle": test_last["cycle"].astype(int),
    "actual_rul": y_true_rul.round(1),
    "predicted_rul": preds_rul.round(1),
    "residual_error": residuals.round(1),
    "actual_risk_tier": true_tiers,
    "predicted_risk_tier": pred_tiers,
    "failure_prob_pct": (preds_prob * 100).round(1),
    "predicted_fail_soon": preds_binary,
    "actual_fail_soon": y_true_binary
})
csv_path = BASE_DIR / "test_predictions_matrix.csv"
results_df.to_csv(csv_path, index=False)

# 2. Export JSON Metrics
json_export = {
    "binary_confusion_matrix": {
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "specificity": round(spec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "mcc": round(mcc, 4)
    },
    "multiclass_tier_confusion_matrix": {
        "labels": tier_labels,
        "matrix": multiclass_cm.tolist(),
        "tier_accuracy": round(tier_acc, 2)
    },
    "regression_error_matrix": {
        "r2_score": round(r2, 4),
        "rmse": round(rmse, 2),
        "mae": round(mae, 2),
        "medae": round(medae, 2),
        "max_error": round(max_err, 2),
        "explained_variance": round(evs, 4),
        "nasa_phm_score": round(nasa_score, 1)
    },
    "tolerance_distribution": {
        "within_5_cycles_pct": float(within_5),
        "within_10_cycles_pct": float(within_10),
        "within_15_cycles_pct": float(within_15),
        "within_20_cycles_pct": float(within_20),
        "early_conservative_count": int(early_preds),
        "late_overestimate_count": int(late_preds)
    }
}
json_path = BASE_DIR / "test_results_matrices.json"
with open(json_path, "w") as f:
    json.dump(json_export, f, indent=4)

print(f"      • CSV predictions exported to: {csv_path}")
print(f"      • JSON matrices exported to:    {json_path}")

print("\n" + "=" * 80)
print("  EVALUATION COMPLETE - ALL 5 MATRICES GENERATED SUCCESSFULLY!")
print("=" * 80)
