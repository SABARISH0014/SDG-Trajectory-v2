from fastapi import FastAPI, HTTPException, Query, Depends, Header, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import logging
import secrets
import os
import json
import tempfile
import shutil
import pandas as pd

from database import query_database, get_country_profile_data
from models import train_and_predict, calculate_core_trajectory
from data_pipeline import run_pipeline
from auth import create_access_token, verify_token, verify_password

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title="SDG Trajectory - Global Outcome Forecaster",
    description="Backend API for SDG Trajectory Prediction and Policy Simulation",
    version="1.0.0"
)

# Setup CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Admin Config & Auth
CONFIG_FILE = "admin_config.json"
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
# Default hash is pbkdf2_sha256 for "admin123"
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "$pbkdf2-sha256$29000$9B6jFCIEwHgvBeD8v7dWqg$foMVjew1Oi4CjF9IxhLSnzqvOBnKdw0SDyFHBIyPVrI")

def get_admin_config():
    if not os.path.exists(CONFIG_FILE):
        return {"contamination": 0.1}
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)

def set_admin_config(key, value):
    config = get_admin_config()
    config[key] = value
    
    # Atomic write to prevent corruption during concurrent sync
    fd, temp_path = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(CONFIG_FILE)))
    with os.fdopen(fd, 'w') as f:
        json.dump(config, f)
    os.replace(temp_path, CONFIG_FILE)

class LoginRequest(BaseModel):
    username: str
    password: str

class ConfigRequest(BaseModel):
    contamination: float

@app.post("/api/admin/login")
def admin_login(req: LoginRequest):
    if req.username == ADMIN_USERNAME and verify_password(req.password, ADMIN_PASSWORD_HASH):
        token = create_access_token(data={"sub": req.username})
        return {"token": token}
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

import threading

sync_lock = threading.Lock()

@app.post("/api/admin/sync")
def sync_data(background_tasks: BackgroundTasks, token: str = Depends(verify_token)):
    if not sync_lock.acquire(blocking=False):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A data sync is already in progress.")
    
    def run_pipeline_with_lock():
        try:
            run_pipeline()
        finally:
            sync_lock.release()
            
    background_tasks.add_task(run_pipeline_with_lock)
    return {"message": "Data sync started in background"}

@app.post("/api/admin/config")
def update_config(req: ConfigRequest, token: str = Depends(verify_token)):
    if not (0.01 <= req.contamination <= 0.5):
        raise HTTPException(status_code=400, detail="Contamination must be strictly between 0.01 and 0.5")
    set_admin_config("contamination", req.contamination)
    return {"message": "Configuration updated successfully"}

# Pydantic Schemas
class PredictionResponse(BaseModel):
    country_code: str
    sdg_target: str
    historical_data: List[Dict[str, Any]]
    predictions: List[Dict[str, Any]]
    status: str
    policy_simulated_projection: Optional[float] = None
    ai_narrative: str


class CountryProfileGoalResponse(BaseModel):
    goal: str
    name: str
    status: str
    current_value: Optional[float]
    projected_value: Optional[float]

class CountryProfileResponse(BaseModel):
    country_code: str
    goals: List[CountryProfileGoalResponse]

GOAL_NAMES = {
    1: "No Poverty",
    2: "Zero Hunger",
    3: "Good Health and Well-being",
    4: "Quality Education",
    5: "Gender Equality",
    6: "Clean Water and Sanitation",
    7: "Affordable and Clean Energy",
    8: "Decent Work and Economic Growth",
    9: "Industry, Innovation and Infrastructure",
    10: "Reduced Inequalities",
    11: "Sustainable Cities and Communities",
    12: "Responsible Consumption and Production",
    13: "Climate Action",
    14: "Life Below Water",
    15: "Life on Land",
    16: "Peace, Justice and Strong Institutions",
    17: "Partnerships for the Goals"
}

@app.get("/api/country/{countryCode}/profile", response_model=CountryProfileResponse)
def get_country_profile(countryCode: str):
    logger.info(f"API Request: /api/country/{countryCode}/profile")
    
    df = get_country_profile_data(countryCode)
    goals_data = []
    
    from database import TARGET_TRANSLATION_MAP
    
    for i in range(1, 18):
        goal_target = TARGET_TRANSLATION_MAP.get(f"Goal{i}", f"{i}.1")
        goal_name = GOAL_NAMES.get(i, f"Goal {i}")
        
        if df.empty:
            target_df = pd.DataFrame()
        else:
            target_df = df[df['SDG_Target'] == goal_target].copy()
            
        if target_df.empty:
            goals_data.append({
                "goal": str(i),
                "name": goal_name,
                "status": "No Data",
                "current_value": None,
                "projected_value": None
            })
            continue
            
        stats = calculate_core_trajectory(target_df, sdg_target=goal_target)
        
        goals_data.append({
            "goal": str(i),
            "name": goal_name,
            "status": stats.get("status", "Unknown"),
            "current_value": stats.get("baseline_value"),
            "projected_value": stats.get("projected_value_2030")
        })
        
    return CountryProfileResponse(
        country_code=countryCode,
        goals=goals_data
    )

@app.get("/api/predict", response_model=PredictionResponse)
async def predict_trajectory(
    country_code: str = Query(..., description="Human-readable country code (e.g., 'IND', 'USA')"),
    sdg_target: str = Query(..., description="Target or Goal (e.g., 'Goal1', '13.2')")
):
    """
    Standard GET endpoint to fetch historical data and generate standard 2030 forecasts.
    """
    logger.info(f"API Request: /api/predict | Country: {country_code}, Target: {sdg_target}")
    
    # Query database
    df = query_database(country_code, sdg_target)
    
    if not df.empty:
        df_clean = df.where(pd.notnull(df), None)
        historical_data = df_clean.to_dict(orient='records')
    else:
        historical_data = []
        
    # ML Prediction is now ASYNC so we await it
    ml_results = await train_and_predict(df, sdg_target=sdg_target)
    
    response = PredictionResponse(
        country_code=country_code,
        sdg_target=sdg_target,
        historical_data=historical_data,
        predictions=ml_results.get("predictions", []),
        status=ml_results.get("status", "Unknown"),
        policy_simulated_projection=None,
        ai_narrative=ml_results.get("ai_narrative", "")
    )
    
    return response


@app.get("/api/simulate", response_model=PredictionResponse)
async def simulate_policy(
    country_code: str = Query(..., description="Human-readable country code (e.g., 'IND', 'USA')"),
    sdg_target: str = Query(..., description="Target or Goal (e.g., 'Goal1', '13.2')"),
    policy_impact_multiplier: float = Query(1.0, description="Multiplier for rate of change (e.g. 1.2 for 20% faster growth)")
):
    """
    GET endpoint that accepts a policy impact multiplier to simulate alternate 2030 projections.
    """
    logger.info(f"API Request: /api/simulate | Country: {country_code}, Target: {sdg_target}, Multiplier: {policy_impact_multiplier}")
    
    df = query_database(country_code, sdg_target)
    
    if not df.empty:
        df_clean = df.where(pd.notnull(df), None)
        historical_data = df_clean.to_dict(orient='records')
    else:
        historical_data = []
        
    # ML Prediction with Policy Simulation is now ASYNC
    ml_results = await train_and_predict(df, sdg_target=sdg_target, policy_multiplier=policy_impact_multiplier)
    
    response = PredictionResponse(
        country_code=country_code,
        sdg_target=sdg_target,
        historical_data=historical_data,
        predictions=ml_results.get("predictions", []),
        status=ml_results.get("status", "Unknown"),
        policy_simulated_projection=ml_results.get("policy_simulated_projection"),
        ai_narrative=ml_results.get("ai_narrative", "")
    )
    
    return response

@app.get("/api/globe/markers")
def get_globe_markers():
    """
    Returns the location coordinates and user metrics for rendering the 3D globe.
    """
    try:
        with open("country_coords.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
