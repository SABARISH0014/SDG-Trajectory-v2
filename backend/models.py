import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
import logging

logger = logging.getLogger(__name__)

def filter_outliers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Uses IsolationForest to detect and remove anomalous data points.
    Safety check: If len(df) < 4, skip anomaly detection to prevent crashes.
    """
    if len(df) < 4:
        return df
        
    try:
        # Reshape for sklearn
        X = df[['IndicatorValue']].values
        iso_forest = IsolationForest(contamination=0.1, random_state=42)
        preds = iso_forest.fit_predict(X)
        
        # Keep only inliers (preds == 1)
        filtered_df = df[preds == 1].copy()
        logger.info(f"Anomaly detection removed {len(df) - len(filtered_df)} outliers.")
        return filtered_df
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        return df

import os
import requests
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def generate_narrative(stats: dict) -> str:
    """
    Uses OpenRouter API to generate a professional 2-sentence summary of the trajectory.
    Implements a fallback cascade: tries multiple free models before defaulting to a hardcoded string.
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

    # --- THE FALLBACK CASCADE ---
    # A list of highly reliable, free OpenRouter models to try in order
    free_models = [
        # 1. High Quality General Drafting
        "meta-llama/llama-3.3-70b-instruct:free",
        
        # 2. Strong Multilingual/Instruction
        "google/gemma-4-31b-it:free",
        
        # 3. Fast & Lightweight Reasoning
        "openai/gpt-oss-20b:free",
        
        # 4. OpenRouter Automatic Rotation (If all specific models fail)
        "openrouter/free"
    ]
        
    for model_name in free_models:
        try:
            logger.info(f"Attempting to generate narrative with model: {model_name}")
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_name, 
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
                },
                timeout=10
            )
            
            # If the request fails (like a 402 or 500 error), this will trigger the except block
            response.raise_for_status() 
            
            data = response.json()
            
            # If successful, return the narrative immediately and break the loop
            return data["choices"][0]["message"]["content"].strip()
            
        except Exception as e:
            # Log the specific model failure, but don't crash. The loop will continue to the next model.
            logger.warning(f"Model {model_name} failed: {e}. Trying next model in cascade...")
            continue

    # If the loop finishes and ALL models failed, rely on our rock-solid hardcoded text
    logger.error("All OpenRouter free models failed or timed out. Falling back to hardcoded text.")
    return fallback_narrative

def classify_status(baseline_value: float, projected_value: float) -> str:
    """
    Classifies the progress status based on baseline vs projection.
    This is a generalized logic (assuming higher is better for this placeholder).
    In a real-world scenario, the logic would vary per SDG target directionality.
    """
    # Assuming positive growth is on-track for simplicity
    if projected_value > baseline_value * 1.05:
        return "On-track"
    elif baseline_value * 0.95 <= projected_value <= baseline_value * 1.05:
        return "At-risk"
    else:
        return "Off-track"

def train_and_predict(df: pd.DataFrame, policy_multiplier: float = 1.0) -> dict:
    """
    Trains a LinearRegression model to predict values for 2026-2030.
    Applies sparse data bypass if data is insufficient.
    """
    # Sparse Data Bypass (CRITICAL)
    if df.empty or len(df.dropna()) < 2:
        logger.warning("Insufficient data. Triggering sparse data bypass.")
        return {
            "predictions": [],
            "status": "Insufficient Data",
            "ai_narrative": "Not enough historical data available to generate a 2030 trajectory."
        }
    
    # Pre-processing
    df = df.dropna(subset=['IndicatorValue', 'Year']).copy()
    
    # Anomaly Detection
    clean_df = filter_outliers(df)
    
    # Prepare features and target
    X_train = clean_df[['Year']].values
    y_train = clean_df['IndicatorValue'].values
    
    # Train Model
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Forecast 2026-2030
    future_years = np.array(range(2026, 2031)).reshape(-1, 1)
    
    # Apply policy impact multiplier to the slope (rate of change)
    original_coef = model.coef_[0]
    modified_coef = original_coef * policy_multiplier
    
    # Calculate predictions using the potentially modified slope
    # y = mx + c => c = y_mean - m * x_mean (from original model)
    intercept = model.intercept_
    
    predictions = []
    for year in range(2026, 2031):
        # We project from the last known point or mean, but mathematically standard is:
        # predicted = (year - train_mean_x) * modified_coef + train_mean_y
        # Which is equivalent to intercept + year * modified_coef if intercept is adjusted.
        # Let's adjust intercept for the new slope so it pivots around the last known point (2025).
        # But for simplicity and to match standard linear formula:
        if policy_multiplier != 1.0:
            last_year = X_train[-1][0]
            last_value = model.predict([[last_year]])[0]
            # y_new - y_last = m_new * (x_new - x_last)
            pred_val = last_value + modified_coef * (year - last_year)
        else:
            pred_val = model.predict([[year]])[0]
            
        predictions.append({
            "Year": year,
            "PredictedValue": float(pred_val)
        })
        
    baseline_val = float(y_train[0])
    projection_2030 = float(predictions[-1]['PredictedValue'])
    
    status = classify_status(baseline_val, projection_2030)
    
    stats = {
        "status": status,
        "baseline_value": baseline_val,
        "projected_value_2030": projection_2030
    }
    
    narrative = generate_narrative(stats)
    
    return {
        "predictions": predictions,
        "status": status,
        "ai_narrative": narrative,
        "policy_simulated_projection": projection_2030 if policy_multiplier != 1.0 else None
    }
