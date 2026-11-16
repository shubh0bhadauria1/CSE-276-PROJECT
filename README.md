# Urban Heat Mitigation and Cooling Strategy Decision Tool (SIH 2026)

**Course:** CSE 276 | **Course Outcomes:** CO3, CO4, CO5 | **Problem Statement ID:** SIH 2026

## 1. Project Overview
The **Urban Heat Mitigation and Cooling Strategy Decision Tool** is an end-to-end Machine Learning, Explainable AI (XAI), and interactive decision-support web application designed to help urban planners evaluate cooling interventions against the Urban Heat Island (UHI) effect.

- **Geospatial Feature Engineering & Data Quality Validation (CO3):** Automated acceptance checks across 4,000 urban, suburban, and green-zone observations.
- **Supervised Regression & SHAP Explainability (CO4):** Comparative benchmarking of Ridge Regression, Random Forest, XGBoost, and LightGBM, paired with TreeSHAP feature attribution.
- **Interactive Cooling Simulator & Uncertainty Quantification (CO5):** Real-time what-if simulator enabling policymakers to test tree canopy expansion, impervious surface reduction, cool-roof adoption, and water-body proximity with 95% confidence intervals (±0.98°C).

## 2. Dataset Details & Preprocessing
- **Dataset Directory:** `Data/`
- **Sample Size:** 4,000 spatial observations (`0.0%` missing values)
- **Target Variable:** `LST` — Land Surface Temperature (32°C to 46°C; baseline mean: 35.36°C)
- **Engineered Features:** `NDVI`, `Impervious_Surface_Pct`, `Albedo`, `Building_Density`, `Distance_to_Water_m`, and `Ambient_Temp_C`
- **Acceptance Criteria Verified:**
  - R² > 0.85 (**PASS:** `0.9823`)
  - RMSE < 1.5°C (**PASS:** `0.502°C`)
  - Missing Values = 0% (**PASS:** `0.0%`)
  - Sample Count ≥ 3,500 (**PASS:** `4,000`)

## 3. Model Comparison & Top SHAP Drivers
Four regression models were evaluated using an 80/20 train-test split and 5-fold cross-validation:

| Model | Role | R² Score | RMSE (°C) | Explainability |
| :--- | :--- | :---: | :---: | :--- |
| **LightGBM (Selected Best)** | Primary Production Model | **0.9823** | **0.502** | `shap.TreeExplainer` |
| **XGBoost Regressor** | Gradient Boosted Benchmark | ~0.98 | ~0.52 | `shap.TreeExplainer` |
| **Random Forest Regressor** | Bagging Ensemble Benchmark | ~0.97 | ~0.61 | `shap.TreeExplainer` |
| **Ridge Regression** | Linear Baseline | ~0.91 | ~1.12 | `shap.LinearExplainer` |

**Top Global SHAP Drivers (`mean |SHAP|`):** `Impervious_Surface_Pct` (1.898), `Ambient_Temp_C` (1.602), and `NDVI` (0.645).

## 4. Prerequisites
- **Python:** 3.10+
- **Node.js:** 18.0+ (with `npm`)

## 5. Installation & Execution Instructions

### Step A: Run the ML Training & SHAP Pipeline
```bash
pip install -r requirements.txt
python ml_pipeline/train_models.py