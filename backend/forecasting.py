import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
import logging
from database import get_system_config

from models import generate_narrative

logger = logging.getLogger(__name__)

def filter_outliers(df: pd.DataFrame, contamination_val: float = 0.1) -> pd.DataFrame:
    """
    Uses IsolationForest to detect and remove anomalous data points.
    Safety feature: Ensures the most recent chronological data point is never removed
    so we don't skew the endpoint of the trajectory.
    Skips if real data points < 4 or contamination_val <= 0.
    """
    if contamination_val <= 0.0:
        return df

    real_mask = ~df.get('is_imputed', pd.Series(False, index=df.index)).astype(bool)
    if 'is_regional_estimate' in df.columns:
        real_mask = real_mask & ~df['is_regional_estimate'].astype(bool)
    real_df = df[real_mask].copy()

    if len(real_df) < 4:
        return df
        
    try:
        # Sort chronologically
        real_df = real_df.sort_values(by='Year')
        
        # Reshape for sklearn
        X = real_df[['IndicatorValue']].values
        iso_forest = IsolationForest(contamination=contamination_val, random_state=42)
        preds = iso_forest.fit_predict(X)
        
        # Add prediction
        real_df['IsOutlier'] = (preds == -1)
        
        # CRITICAL SAFETY: Protect the most recent year from being dropped
        latest_year = real_df['Year'].max()
        real_df.loc[real_df['Year'] == latest_year, 'IsOutlier'] = False
        
        # Merge back to original df
        df = df.copy()
        df['IsOutlier'] = False
        df.loc[real_mask, 'IsOutlier'] = real_df['IsOutlier']
        
        # Keep only inliers
        filtered_df = df[~df['IsOutlier']].copy()
        
        logger.info(f"Anomaly detection removed {len(df) - len(filtered_df)} outliers.")
        return filtered_df.drop(columns=['IsOutlier'])
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        return df

def classify_status(baseline_value: float, projected_value: float, sdg_target: str) -> str:
    """
    Classifies the progress status based on baseline vs projection and target polarity.
    Handles zero and near-zero baselines safely.
    """
    if baseline_value is None or projected_value is None or np.isnan(baseline_value) or np.isnan(projected_value):
        return "Unknown"

    # Negative polarity targets (lower value is better)
    NEGATIVE_POLARITY_TARGETS = ['1.1', '1.2', '2.1', '3.1', '3.2', '3.4', '3.6', '8.5', '8.7', '13.2', '16.1']
    is_negative_polarity = str(sdg_target) in NEGATIVE_POLARITY_TARGETS

    # Handle near-zero baseline
    if abs(baseline_value) < 1e-6:
        if is_negative_polarity:
            return "On-track" if projected_value <= 1e-6 else "Off-track"
        else:
            return "On-track" if projected_value > 1e-6 else "Off-track"

    if is_negative_polarity:
        if projected_value < baseline_value * 0.95:
            return "On-track"
        elif baseline_value * 0.95 <= projected_value <= baseline_value * 1.05:
            return "At-risk"
        else:
            return "Off-track"
    else:
        if projected_value > baseline_value * 1.05:
            return "On-track"
        elif baseline_value * 0.95 <= projected_value <= baseline_value * 1.05:
            return "At-risk"
        else:
            return "Off-track"

from sdg_harmonizer import (
    PERCENTAGE_TARGETS, 
    INDEX_100_TARGETS, 
    INDEX_1_TARGETS, 
    harmonize_time_series, 
    clamp_indicator_value
)

def calculate_core_trajectory(df: pd.DataFrame, sdg_target: str, policy_multiplier: float = 1.0, contamination_val: float = 0.1) -> dict:
    """
    Core mathematical logic for SDG trajectory regression with strict domain bounds.
    """
    if df.empty:
        logger.warning("Empty dataframe received. Triggering sparse data bypass.")
        return {
            "predictions": [],
            "status": "Insufficient Data",
            "baseline_value": None,
            "projected_value_2030": None
        }

    # Step 1: Harmonize time series and purge mixed-scale artifacts
    df_clean = harmonize_time_series(df, sdg_target)

    # Sparse Data Bypass: if length is < 2
    if len(df_clean.dropna(subset=['IndicatorValue'])) < 2:
        logger.warning(f"Insufficient real data. Triggering sparse data bypass.")
        return {
            "predictions": [],
            "status": "Insufficient Data",
            "baseline_value": None,
            "projected_value_2030": None
        }

    if 'is_imputed' not in df_clean.columns:
        df_clean['is_imputed'] = False
    if 'is_regional_estimate' not in df_clean.columns:
        df_clean['is_regional_estimate'] = False
        
    # Safe Anomaly Detection
    clean_df = filter_outliers(df_clean, contamination_val)
    
    # Extract ONLY real data for training
    real_df = clean_df[~clean_df['is_imputed'].astype(bool)]
    if 'is_regional_estimate' in real_df.columns:
        real_df = real_df[~real_df['is_regional_estimate'].astype(bool)]
    
    # Sparse Data Bypass again after filtering
    if len(real_df) < 2:
        logger.warning(f"Insufficient real data after filtering ({len(real_df)} points). Triggering sparse data bypass.")
        return {
            "predictions": [],
            "status": "Insufficient Data",
            "baseline_value": None,
            "projected_value_2030": None
        }
        
    target_str = str(sdg_target).strip()
    is_pct = target_str in PERCENTAGE_TARGETS
    is_idx100 = target_str in INDEX_100_TARGETS
    is_idx1 = target_str in INDEX_1_TARGETS

    def clamp_val(val: float) -> float:
        val = float(val)
        if is_pct or is_idx100:
            return min(100.0, max(0.0, val))
        elif is_idx1:
            return min(1.0, max(0.0, val))
        elif target_str not in {'8.1', '8.2', '10.1', '17.2', '17.3', '17.13'}:
            return max(0.0, val)
        return val

    y_train = real_df['IndicatorValue'].values
    max_year = int(real_df['Year'].max())
    start_pred_year = max_year + 1
    
    if np.var(y_train) < 1e-8:
        # Flat trend
        baseline_val = clamp_val(float(y_train[0]))
        projection_2030 = baseline_val
        status = classify_status(baseline_val, projection_2030, sdg_target)
        
        predictions = []
        if start_pred_year <= 2030:
            predictions = [{"Year": year, "PredictedValue": clamp_val(projection_2030)} for year in range(start_pred_year, 2031)]
        else:
            predictions = [{"Year": 2030, "PredictedValue": clamp_val(projection_2030)}]
            
        return {
            "predictions": predictions,
            "status": status,
            "baseline_value": baseline_val,
            "projected_value_2030": clamp_val(projection_2030),
            "policy_simulated_projection": clamp_val(projection_2030) if policy_multiplier != 1.0 else None
        }
    
    X_train = real_df[['Year']].values
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    original_coef = model.coef_[0]
    modified_coef = original_coef * policy_multiplier
    
    predictions = []
    
    if start_pred_year <= 2030:
        for year in range(start_pred_year, 2031):
            if policy_multiplier != 1.0:
                last_year = X_train[-1][0]
                last_value = model.predict([[last_year]])[0]
                pred_val = last_value + modified_coef * (year - last_year)
            else:
                pred_val = model.predict([[year]])[0]
                
            pred_val = clamp_val(pred_val)
            predictions.append({
                "Year": year,
                "PredictedValue": pred_val
            })
    else:
        # If we already have data up to 2030 or beyond, project 2030 explicitly
        if policy_multiplier != 1.0:
            last_year = X_train[-1][0]
            last_value = model.predict([[last_year]])[0]
            pred_val = last_value + modified_coef * (2030 - last_year)
        else:
            pred_val = model.predict([[2030]])[0]
        
        pred_val = clamp_val(pred_val)
        predictions.append({
            "Year": 2030,
            "PredictedValue": pred_val
        })
        
    baseline_val = clamp_val(float(y_train[0]))
    projection_2030 = float(predictions[-1]['PredictedValue'])
    
    status = classify_status(baseline_val, projection_2030, sdg_target)
    
    return {
        "predictions": predictions,
        "status": status,
        "baseline_value": baseline_val,
        "projected_value_2030": projection_2030,
        "policy_simulated_projection": projection_2030 if policy_multiplier != 1.0 else None
    }


async def train_and_predict(df: pd.DataFrame, sdg_target: str, policy_multiplier: float = 1.0) -> dict:
    """
    Trains a LinearRegression model to predict values for future years.
    Applies sparse data bypass if data is insufficient.
    """
    contamination_val = await get_system_config("contamination", 0.1)
    stats = calculate_core_trajectory(df, sdg_target, policy_multiplier, contamination_val)
    
    if stats.get("status") == "Insufficient Data":
        return {
            "predictions": [],
            "status": "Insufficient Data",
            "ai_narrative": "Not enough historical data available to generate a reliable 2030 trajectory."
        }
    
    # Generate narrative using the decoupled function in models.py
    narrative = await generate_narrative(stats)
    
    stats["ai_narrative"] = narrative
    return stats
