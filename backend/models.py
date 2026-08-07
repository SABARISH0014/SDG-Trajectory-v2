import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
import logging
import os
import httpx

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)

def filter_outliers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Uses IsolationForest to detect and remove anomalous data points.
    Safety feature: Ensures the most recent chronological data point is never removed
    so we don't skew the endpoint of the trajectory.
    Skips if real data points < 4.
    """
    real_mask = ~df.get('is_imputed', pd.Series(False, index=df.index)).astype(bool)
    real_df = df[real_mask].copy()

    if len(real_df) < 4:
        return df
        
    try:
        # Sort chronologically
        real_df = real_df.sort_values(by='Year')
        
        # Read dynamic contamination config
        import json
        contamination_val = 0.1
        if os.path.exists("admin_config.json"):
            with open("admin_config.json", "r") as f:
                config = json.load(f)
                contamination_val = config.get("contamination", 0.1)
                
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

async def generate_narrative(stats: dict) -> str:
    """
    Uses OpenRouter API asynchronously to generate a 2-sentence summary of the trajectory.
    Does NOT block the ASGI event loop, preventing FastAPI from hanging.
    """
    status = stats.get('status', 'Unknown')
    baseline = stats.get('baseline_value', 'N/A')
    projection = stats.get('projected_value_2030', 'N/A')
    
    if status == 'Insufficient Data':
        return "Not enough historical data available to generate a 2030 trajectory. Enhanced data collection is required."
        
    fallback_narrative = f"The trajectory is currently classified as {status}, moving from a baseline of {baseline:.2f} to a projected {projection:.2f} by 2030. Strategic interventions may be necessary to ensure optimal target achievement."
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.warning("OPENROUTER_API_KEY not found. Using fallback narrative.")
        return fallback_narrative
        
    try:
        # ASYNC HTTP call to prevent server blocking
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "google/gemma-4-26b-a4b-it:free",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a professional data analyst. Provide a brief, insightful, 2-sentence summary of the provided SDG indicator trajectory statistics."
                        },
                        {
                            "role": "user",
                            "content": f"The SDG target trajectory is currently '{status}'. It moves from a baseline value of {baseline:.2f} to a projected 2030 value of {projection:.2f}."
                        }
                    ]
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except httpx.ReadTimeout:
        logger.error("OpenRouter API call timed out. Falling back.")
        return fallback_narrative
    except Exception as e:
        logger.error(f"OpenRouter API call failed: {e}")
        return fallback_narrative

def classify_status(baseline_value: float, projected_value: float, sdg_target: str) -> str:
    """
    Classifies the progress status based on baseline vs projection and target polarity.
    """
    # Negative polarity targets (lower value is better, e.g. Mortality, CO2 emissions)
    NEGATIVE_POLARITY_TARGETS = ['1.1', '1.2', '2.1', '3.1', '3.2', '13.2']
    
    if str(sdg_target) in NEGATIVE_POLARITY_TARGETS:
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

def calculate_core_trajectory(df: pd.DataFrame, sdg_target: str, policy_multiplier: float = 1.0) -> dict:
    """
    Core mathematical logic for SDG trajectory regression.
    Synchronous and reusable to prevent double implementation.
    """
    df = df.dropna(subset=['IndicatorValue', 'Year']).copy()
    
    if 'is_imputed' not in df.columns:
        df['is_imputed'] = False
        
    # Safe Anomaly Detection
    clean_df = filter_outliers(df)
    
    # Extract ONLY real data for training
    real_df = clean_df[~clean_df['is_imputed'].astype(bool)]
    
    # Sparse Data Bypass (CRITICAL)
    if len(real_df) < 3:
        logger.warning(f"Insufficient real data ({len(real_df)} points). Triggering sparse data bypass.")
        return {
            "predictions": [],
            "status": "Insufficient Data",
            "baseline_value": None,
            "projected_value_2030": None
        }
        
    # Low Variance Check (Check if all real values are nearly identical)
    y_train = real_df['IndicatorValue'].values
    if np.var(y_train) < 1e-8:
        # If variance is practically zero, the trend is flat
        baseline_val = float(y_train[0])
        projection_2030 = baseline_val
        status = classify_status(baseline_val, projection_2030, sdg_target)
        predictions = [{"Year": year, "PredictedValue": projection_2030} for year in range(2026, 2031)]
        return {
            "predictions": predictions,
            "status": status,
            "baseline_value": baseline_val,
            "projected_value_2030": projection_2030,
            "policy_simulated_projection": projection_2030 if policy_multiplier != 1.0 else None
        }
    
    X_train = real_df[['Year']].values
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    original_coef = model.coef_[0]
    modified_coef = original_coef * policy_multiplier
    
    predictions = []
    for year in range(2026, 2031):
        if policy_multiplier != 1.0:
            last_year = X_train[-1][0]
            last_value = model.predict([[last_year]])[0]
            pred_val = last_value + modified_coef * (year - last_year)
        else:
            pred_val = model.predict([[year]])[0]
            
        # Mathematical constraint: Floor prediction at 0
        pred_val = max(0.0, float(pred_val))
            
        predictions.append({
            "Year": year,
            "PredictedValue": pred_val
        })
        
    baseline_val = float(y_train[0])
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
    Trains a LinearRegression model to predict values for 2026-2030.
    Applies sparse data bypass if data is insufficient.
    NOTE: Wraps calculate_core_trajectory with an async LLM narrative call.
    """
    stats = calculate_core_trajectory(df, sdg_target, policy_multiplier)
    
    if stats.get("status") == "Insufficient Data":
        return {
            "predictions": [],
            "status": "Insufficient Data",
            "ai_narrative": "Not enough historical data available to generate a reliable 2030 trajectory."
        }
    
    # Await the async API call
    narrative = await generate_narrative(stats)
    
    stats["ai_narrative"] = narrative
    return stats
