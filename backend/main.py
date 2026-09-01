from fastapi import FastAPI, HTTPException, Query, Depends, Header, BackgroundTasks, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from contextlib import asynccontextmanager
import logging
import secrets
import os
import json
import tempfile
import shutil
import pandas as pd
import threading
import httpx

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from database import query_database, get_country_profile_data
from forecasting import train_and_predict, calculate_core_trajectory
from auth import create_access_token, verify_token, verify_password

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Security Check on Startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Running security checks on startup...")
    
    # Fail-fast if secrets are default or missing
    if settings.JWT_SECRET_KEY == "super-secret-default-key-for-dev" or len(settings.JWT_SECRET_KEY) < 32:
        raise RuntimeError("FATAL: JWT_SECRET_KEY is missing, left as default, or too short. Halting execution.")
        
    if settings.ADMIN_PASSWORD_HASH == "$2b$12$fNnTwqfq8OPbiWQK80zW0u1ubmVSnwFvpO59tEOazMlTYMMqHWI9K":
        raise RuntimeError("FATAL: ADMIN_PASSWORD_HASH is left as default. Please change it. Halting execution.")
        
    yield
    # Shutdown logic if any

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI App
app = FastAPI(
    title="SDG Trajectory - Global Outcome Forecaster",
    description="Backend API for SDG Trajectory Prediction and Policy Simulation",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Setup CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sdg-trajectory-v2.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Admin Config
CONFIG_FILE = "admin_config.json"

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
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)

class ConfigRequest(BaseModel):
    contamination: float = Field(..., ge=0.01, le=0.5)

@app.post("/api/admin/login")
@limiter.limit("5/minute")
def admin_login(request: Request, req: LoginRequest):
    if req.username == settings.ADMIN_USERNAME and verify_password(req.password, settings.ADMIN_PASSWORD_HASH):
        token = create_access_token(data={"sub": req.username})
        return {"token": token}
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

sync_lock = threading.Lock()

def run_sync_task():
    import subprocess
    try:
        logger.info("Executing background sync pipeline...")
        subprocess.run(["python", "incremental_sync.py"], check=True)
        logger.info("Background sync pipeline completed successfully.")
    except Exception as e:
        logger.error(f"Background sync task failed: {e}")
    finally:
        sync_lock.release()

@app.post("/api/admin/sync")
def trigger_sync(background_tasks: BackgroundTasks, token: str = Depends(verify_token)):
    if not sync_lock.acquire(blocking=False):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Data sync is already in progress.")
    
    background_tasks.add_task(run_sync_task)
    return {"message": "Data sync started in background"}

@app.post("/api/admin/config")
def update_config(req: ConfigRequest, token: str = Depends(verify_token)):
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

class CopilotMessage(BaseModel):
    role: str
    content: str

class CopilotRequest(BaseModel):
    messages: List[CopilotMessage]

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
@limiter.limit("100/minute")
async def get_country_profile(request: Request, countryCode: str):
    logger.info(f"API Request: /api/country/{countryCode}/profile")
    
    df = await get_country_profile_data(countryCode)
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
@limiter.limit("100/minute")
async def predict_trajectory(
    request: Request,
    country_code: str = Query(..., description="Human-readable country code (e.g., 'IND', 'USA')"),
    sdg_target: str = Query(..., description="Target or Goal (e.g., 'Goal1', '13.2')")
):
    """
    Standard GET endpoint to fetch historical data and generate standard 2030 forecasts.
    """
    logger.info(f"API Request: /api/predict | Country: {country_code}, Target: {sdg_target}")
    
    # Query database
    df = await query_database(country_code, sdg_target)
    
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
@limiter.limit("100/minute")
async def simulate_policy(
    request: Request,
    country_code: str = Query(..., description="Human-readable country code (e.g., 'IND', 'USA')"),
    sdg_target: str = Query(..., description="Target or Goal (e.g., 'Goal1', '13.2')"),
    policy_impact_multiplier: float = Query(1.0, description="Multiplier for rate of change (e.g. 1.2 for 20% faster growth)")
):
    """
    GET endpoint that accepts a policy impact multiplier to simulate alternate 2030 projections.
    """
    logger.info(f"API Request: /api/simulate | Country: {country_code}, Target: {sdg_target}, Multiplier: {policy_impact_multiplier}")
    
    df = await query_database(country_code, sdg_target)
    
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
@limiter.limit("100/minute")
def get_globe_markers(request: Request):
    """
    Returns the location coordinates and user metrics for rendering the 3D globe.
    """
    try:
        with open("country_coords.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

@app.post("/api/copilot/chat")
@limiter.limit("20/minute")
async def copilot_chat(request: Request, body: CopilotRequest):
    """
    Proxy endpoint for SDG Policy Copilot to securely contact OpenRouter without exposing the API key on the client.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("OPENROUTER_API_KEY is not set in backend environment variables.")
        raise HTTPException(status_code=500, detail="API key is missing on the server.")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173", # Keep same for rate limiting safety
                    "X-Title": "SDG Trajectory Forecaster"
                },
                json={
                    "model": "google/gemma-4-26b-a4b-it:free",
                    "models": [
                        "google/gemma-4-26b-a4b-it:free",
                        "poolside/laguna-s-2.1:free",
                        "inclusionai/ling-3.0-flash-fin:free"
                    ],
                    "messages": [msg.dict() for msg in body.messages]
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]
    except httpx.HTTPStatusError as e:
        logger.error(f"OpenRouter HTTP Error: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"AI Service Error: {e.response.text}")
    except Exception as e:
        logger.error(f"OpenRouter Request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
