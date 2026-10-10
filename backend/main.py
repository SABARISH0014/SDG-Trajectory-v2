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
from database import (
    query_database, 
    get_country_profile_data, 
    set_system_config, 
    get_system_config, 
    set_system_config_str,
    get_system_config_str,
    init_system_config,
    get_database_stats,
    clear_db_cache,
    upsert_indicator_record,
    delete_indicator_record,
    log_admin_action,
    get_admin_audit_logs,
    clear_admin_audit_logs,
    get_goal_status_data,
    get_active_trivia,
    get_all_trivia,
    add_trivia_item,
    update_trivia_item,
    delete_trivia_item,
    get_loading_screen_config,
    set_loading_screen_config
)
from forecasting import train_and_predict, calculate_core_trajectory
from auth import create_access_token, verify_token, verify_password, get_password_hash

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Security Check & Warmup on Startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Running security checks on startup...")
    
    # Fail-fast if secrets are default or missing
    if settings.JWT_SECRET_KEY == "super-secret-default-key-for-dev" or len(settings.JWT_SECRET_KEY) < 32:
        raise RuntimeError("FATAL: JWT_SECRET_KEY is missing, left as default, or too short. Halting execution.")
        
    if settings.ADMIN_PASSWORD_HASH == "$2b$12$fNnTwqfq8OPbiWQK80zW0u1ubmVSnwFvpO59tEOazMlTYMMqHWI9K":
        raise RuntimeError("FATAL: ADMIN_PASSWORD_HASH is left as default. Please change it. Halting execution.")
        
    # Initialize system configuration in DB once on startup
    try:
        await init_system_config()
        logger.info("System configuration initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not pre-initialize system_config: {e}")

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
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Admin Config
# Replaced with Turso system_config table

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)

class ConfigRequest(BaseModel):
    contamination: float = Field(..., ge=0.01, le=0.5)
    forecast_confidence: Optional[float] = Field(0.95, ge=0.80, le=0.99)
    imputation_method: Optional[str] = Field("linear")

@app.post("/api/admin/login")
@limiter.limit("5/minute")
async def admin_login(request: Request, req: LoginRequest):
    custom_hash = await get_system_config_str("admin_password_hash", "")
    active_hash = custom_hash if custom_hash else settings.ADMIN_PASSWORD_HASH

    if req.username == settings.ADMIN_USERNAME and verify_password(req.password, active_hash):
        token = create_access_token(data={"sub": req.username})
        await log_admin_action("AUTH_LOGIN", f"Admin successfully authenticated from {request.client.host if request.client else 'client'}", actor=req.username)
        return {"token": token}
    
    await log_admin_action("AUTH_FAILED", f"Failed authentication attempt for username '{req.username}'", actor=req.username, status="FAILED")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

@app.post("/api/admin/change-password")
async def change_admin_password(req: ChangePasswordRequest, token: str = Depends(verify_token)):
    custom_hash = await get_system_config_str("admin_password_hash", "")
    active_hash = custom_hash if custom_hash else settings.ADMIN_PASSWORD_HASH
    
    if not verify_password(req.current_password, active_hash):
        await log_admin_action("PASSWORD_CHANGE_FAILED", "Password change rejected: current password mismatch", status="FAILED")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password does not match.")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 6 characters long.")
        
    new_hash = get_password_hash(req.new_password)
    await set_system_config_str("admin_password_hash", new_hash)
    await log_admin_action("PASSWORD_CHANGE", "Admin master password updated successfully")
    return {"message": "Admin password updated successfully. Please use your new password on subsequent sign-ins."}

@app.post("/api/admin/sync")
async def trigger_sync(token: str = Depends(verify_token)):
    if not settings.GITHUB_PAT:
        logger.error("GITHUB_PAT is not set. Cannot trigger GitHub Actions.")
        await log_admin_action("SYNC_TRIGGER_FAILED", "Failed to dispatch GitHub Action: GITHUB_PAT missing", status="FAILED")
        raise HTTPException(status_code=500, detail="GITHUB_PAT is not configured on the server.")
        
    url = "https://api.github.com/repos/SABARISH0014/SDG-Trajectory-v2/actions/workflows/backend-ci.yml/dispatches"
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {settings.GITHUB_PAT}",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    data = {
        "ref": "main"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=data, timeout=10.0)
            if response.status_code == 204:
                await log_admin_action("PIPELINE_SYNC_TRIGGERED", "Dispatched global backend-ci.yml GitHub Action workflow")
                return {"message": "GitHub Action triggered successfully."}
            else:
                logger.error(f"GitHub Action trigger failed: {response.status_code} - {response.text}")
                await log_admin_action("PIPELINE_SYNC_FAILED", f"GitHub Action trigger returned {response.status_code}", status="FAILED")
                raise HTTPException(status_code=500, detail="Failed to trigger GitHub Action.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering GitHub Action: {e}")
        await log_admin_action("PIPELINE_SYNC_ERROR", f"Error communicating with GitHub: {str(e)}", status="FAILED")
        raise HTTPException(status_code=500, detail="Error communicating with GitHub API.")

@app.get("/api/admin/config")
async def get_config(token: str = Depends(verify_token)):
    contamination = await get_system_config("contamination", 0.1)
    confidence = await get_system_config("forecast_confidence", 0.95)
    imputation = await get_system_config_str("imputation_method", "linear")
    return {
        "contamination": float(contamination) if contamination is not None else 0.1,
        "forecast_confidence": float(confidence) if confidence is not None else 0.95,
        "imputation_method": imputation or "linear"
    }

@app.post("/api/admin/config")
async def update_config(req: ConfigRequest, token: str = Depends(verify_token)):
    await set_system_config("contamination", req.contamination)
    if req.forecast_confidence is not None:
        await set_system_config("forecast_confidence", float(req.forecast_confidence))
    if req.imputation_method is not None:
        await set_system_config_str("imputation_method", req.imputation_method)
    
    await log_admin_action(
        "ALGORITHM_CONFIG_UPDATE",
        f"Updated ML hyperparameters: Contamination={req.contamination:.2f}, Confidence={req.forecast_confidence or 0.95}, Imputation={req.imputation_method or 'linear'}"
    )
    return {"message": "Configuration updated successfully"}

@app.get("/api/admin/stats")
async def get_admin_stats(token: str = Depends(verify_token)):
    stats = await get_database_stats()
    stats["api_status"] = "online"
    stats["openrouter_status"] = "configured" if os.getenv("OPENROUTER_API_KEY") else "missing"
    return stats

@app.post("/api/admin/cache/clear")
async def clear_cache(token: str = Depends(verify_token)):
    cleared_count = clear_db_cache()
    await log_admin_action("CACHE_PURGE", f"Admin purged {cleared_count} active database query cache entries")
    return {
        "message": f"Query cache purged successfully. {cleared_count} active entries removed.",
        "cleared_entries": cleared_count
    }

class RecordUpdateRequest(BaseModel):
    country_code: str = Field(..., min_length=2, max_length=10)
    sdg_target: str = Field(..., min_length=1, max_length=20)
    year: int = Field(..., ge=1990, le=2035)
    indicator_value: float = Field(...)
    is_imputed: Optional[int] = Field(0, ge=0, le=1)

@app.get("/api/admin/data")
async def get_admin_indicator_data(
    country_code: str = Query(..., description="Country code (e.g., 'IND')"),
    sdg_target: str = Query(..., description="SDG target code (e.g., '8.6')"),
    token: str = Depends(verify_token)
):
    df = await query_database(country_code, sdg_target)
    if df.empty:
        return {"country_code": country_code, "sdg_target": sdg_target, "records": []}
    
    df_clean = df.where(pd.notnull(df), None)
    records = df_clean.to_dict(orient="records")
    return {"country_code": country_code, "sdg_target": sdg_target, "records": records}

@app.post("/api/admin/data/record")
async def save_admin_indicator_record(
    req: RecordUpdateRequest,
    token: str = Depends(verify_token)
):
    try:
        await upsert_indicator_record(
            country_code=req.country_code,
            sdg_target=req.sdg_target,
            year=req.year,
            indicator_value=req.indicator_value,
            is_imputed=req.is_imputed or 0
        )
        await log_admin_action(
            "DATA_RECORD_UPSERT",
            f"Overwrote indicator point: {req.country_code} Target {req.sdg_target} (Year {req.year} = {req.indicator_value})"
        )
        return {
            "message": f"Successfully updated {req.country_code} Target {req.sdg_target} (Year {req.year}) to {req.indicator_value}.",
            "record": req.model_dump()
        }
    except Exception as e:
        logger.error(f"Failed to upsert indicator record: {e}")
        await log_admin_action("DATA_RECORD_UPSERT_FAILED", f"Failed to upsert record: {str(e)}", status="FAILED")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/api/admin/data/record")
async def delete_admin_indicator_record(
    country_code: str = Query(...),
    sdg_target: str = Query(...),
    year: int = Query(...),
    token: str = Depends(verify_token)
):
    try:
        await delete_indicator_record(
            country_code=country_code,
            sdg_target=sdg_target,
            year=year
        )
        await log_admin_action(
            "DATA_RECORD_DELETE",
            f"Deleted indicator point: {country_code} Target {sdg_target} (Year {year})"
        )
        return {
            "message": f"Successfully deleted data point for {country_code} Target {sdg_target} (Year {year})."
        }
    except Exception as e:
        logger.error(f"Failed to delete indicator record: {e}")
        await log_admin_action("DATA_RECORD_DELETE_FAILED", f"Failed to delete record: {str(e)}", status="FAILED")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/admin/audit-logs")
async def get_audit_logs(limit: int = Query(50, ge=1, le=200), token: str = Depends(verify_token)):
    logs = await get_admin_audit_logs(limit=limit)
    return {"audit_logs": logs, "count": len(logs)}

@app.post("/api/admin/audit-logs/clear")
async def clear_audit_logs(token: str = Depends(verify_token)):
    await clear_admin_audit_logs()
    await log_admin_action("AUDIT_LOGS_CLEARED", "Admin cleared system audit trail history")
    return {"message": "System audit logs cleared successfully."}

COPILOT_PERSONAS = {
    "un_advisor": "You are the Senior UN Policy Advisor for the 2030 Agenda. Provide strategic, actionable, evidence-based policy insights and sustainable development recommendations.",
    "data_scientist": "You are a Quantitative Lead and SDG Data Scientist. Focus on empirical trajectory analysis, statistical validity, velocity, and indicator anomalies.",
    "economist": "You are a Senior Macroeconomist specializing in fiscal allocations and SDG financing mechanisms. Emphasize capital efficiency, return on development investment, and structural reforms.",
    "youth_advocate": "You are a Global Youth Climate and Equity Ambassador for the UN 2030 Agenda. Emphasize human-centric impacts, youth empowerment, and intergenerational equity."
}

class AIConfigRequest(BaseModel):
    copilot_model: str = Field(..., min_length=2)
    copilot_persona: str = Field(..., min_length=2)
    copilot_temperature: float = Field(0.2, ge=0.0, le=1.0)
    emergency_mock_mode: bool = Field(False)

@app.get("/api/admin/ai-config")
async def get_ai_config(token: str = Depends(verify_token)):
    model = await get_system_config_str("copilot_model", "openrouter/auto")
    persona = await get_system_config_str("copilot_persona", "un_advisor")
    temperature = await get_system_config("copilot_temperature", 0.2)
    mock_mode = bool(await get_system_config("emergency_mock_mode", 0.0))
    return {
        "copilot_model": model,
        "copilot_persona": persona,
        "copilot_temperature": temperature,
        "emergency_mock_mode": mock_mode
    }

@app.post("/api/admin/ai-config")
async def update_ai_config(req: AIConfigRequest, token: str = Depends(verify_token)):
    await set_system_config_str("copilot_model", req.copilot_model)
    await set_system_config_str("copilot_persona", req.copilot_persona)
    await set_system_config("copilot_temperature", float(req.copilot_temperature))
    await set_system_config("emergency_mock_mode", 1.0 if req.emergency_mock_mode else 0.0)
    await log_admin_action(
        "AI_CONFIG_UPDATE",
        f"Updated Copilot parameters: Model={req.copilot_model}, Persona={req.copilot_persona}, Temp={req.copilot_temperature:.2f}, MockMode={req.emergency_mock_mode}"
    )
    return {"message": "AI Copilot & System configuration updated successfully."}

class TriviaRequest(BaseModel):
    category: str = Field(..., min_length=2)
    text: str = Field(..., min_length=5)
    icon: Optional[str] = Field("Sparkles")
    is_active: Optional[int] = Field(1)

class LoadingConfigReq(BaseModel):
    rotation_interval: float = Field(..., ge=2.0, le=15.0)
    active_categories: List[str] = Field(default_factory=list)
    spinner_style: Optional[str] = Field("sdg_ring")

@app.get("/api/trivia")
async def get_trivia_list():
    """Retrieve all active trivia and tips for loading states and user engagement."""
    return await get_active_trivia()

@app.get("/api/trivia/config")
async def get_trivia_config():
    """Retrieve runtime loading screen timing and display options."""
    return await get_loading_screen_config()

@app.get("/api/admin/trivia")
async def get_admin_trivia_list(token: str = Depends(verify_token)):
    """Retrieve all trivia items (active and inactive) for admin management."""
    items = await get_all_trivia()
    return {"trivia": items, "items": items}

@app.post("/api/admin/trivia/config")
async def update_trivia_config(req: LoadingConfigReq, token: str = Depends(verify_token)):
    """Update runtime loading screen rotation interval and allowed categories."""
    await set_loading_screen_config(req.rotation_interval, req.active_categories, req.spinner_style or "sdg_ring")
    await log_admin_action("TRIVIA_CONFIG_UPDATE", f"Updated loading screen interval to {req.rotation_interval}s and categories: {req.active_categories}")
    return {"message": "Loading screen configuration updated successfully"}

@app.post("/api/admin/trivia")
async def create_trivia(req: TriviaRequest, token: str = Depends(verify_token)):
    item = await add_trivia_item(req.category, req.text, req.icon or "Sparkles")
    await log_admin_action("TRIVIA_CREATE", f"Added trivia item under {req.category}: {req.text[:30]}...")
    return item

@app.put("/api/admin/trivia/{item_id}")
async def edit_trivia(item_id: int, req: TriviaRequest, token: str = Depends(verify_token)):
    success = await update_trivia_item(item_id, req.category, req.text, req.icon or "Sparkles", req.is_active if req.is_active is not None else 1)
    if not success:
        raise HTTPException(status_code=404, detail="Trivia item not found or update failed")
    await log_admin_action("TRIVIA_UPDATE", f"Updated trivia item {item_id}")
    return {"message": "Trivia item updated successfully"}

@app.delete("/api/admin/trivia/{item_id}")
async def remove_trivia(item_id: int, token: str = Depends(verify_token)):
    success = await delete_trivia_item(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Trivia item not found or delete failed")
    await log_admin_action("TRIVIA_DELETE", f"Deleted trivia item {item_id}")
    return {"message": "Trivia item deleted successfully"}

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
    coords_file = os.path.join(os.path.dirname(__file__), "country_coords.json")
    try:
        with open(coords_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"country_coords.json not found at {coords_file}")
        return []

@app.get("/api/globe/goal-status")
@limiter.limit("120/minute")
async def get_globe_goal_status(
    request: Request,
    goal: Optional[int] = Query(None, ge=1, le=17, description="SDG Goal number (1-17)"),
    sdg_target: Optional[str] = Query(None, description="Specific SDG target (e.g. '3.1', '1.1')")
):
    """
    Returns trajectory statuses (On-track, At-risk, Off-track, Insufficient Data)
    and baseline/projected metrics for all countries for a given goal or target.
    """
    selected_goal = goal if goal is not None else 1
    if sdg_target:
        target_code = sdg_target
    else:
        target_code = f"{selected_goal}.1"

    goal_name = GOAL_NAMES.get(selected_goal, f"Goal {selected_goal}")
    data = await get_goal_status_data(target_code)

    return {
        "goal": selected_goal,
        "goal_name": goal_name,
        "sdg_target": target_code,
        "countries": data.get("countries", {}),
        "summary": data.get("summary", {
            "total_countries": 0,
            "on_track": 0,
            "at_risk": 0,
            "off_track": 0,
            "insufficient_data": 0
        })
    }

@app.post("/api/copilot/chat")
@limiter.limit("20/minute")
async def copilot_chat(request: Request, body: CopilotRequest):
    """
    Proxy endpoint for SDG Policy Copilot to securely contact OpenRouter without exposing the API key on the client.
    Features automated multi-model sequential fallbacks and resilience against provider-level 429 rate limits.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("OPENROUTER_API_KEY is not set in backend environment variables.")
        raise HTTPException(status_code=500, detail="API key is missing on the server.")

    try:
        active_model = await get_system_config_str("copilot_model", "openrouter/auto")
        active_persona = await get_system_config_str("copilot_persona", "un_advisor")
        active_temperature = await get_system_config("copilot_temperature", 0.2)
        mock_mode = bool(await get_system_config("emergency_mock_mode", 0.0))

        persona_prompt = COPILOT_PERSONAS.get(active_persona, COPILOT_PERSONAS["un_advisor"])
        
        # Emergency Mock Mode
        if mock_mode:
            return {
                "role": "assistant",
                "content": (
                    "**[Offline Mode Active]** Here are foundational policy insights aligned with the 2030 Agenda:\n\n"
                    "• **Priority 1: Targeted Public Investment:** Channel resources directly into frontline delivery systems and community-led operations.\n"
                    "• **Priority 2: Regulatory & Institutional Frameworks:** Align municipal bylaws with national SDG milestones and ensure fiscal accountability.\n"
                    "• **Priority 3: Data-Driven Resource Allocation:** Leverage empirical time-series monitoring to address regional disparities."
                )
            }

        # Prepend configured system persona prompt if not present
        messages_payload = []
        has_system = any(m.role == "system" for m in body.messages)
        if not has_system:
            messages_payload.append({"role": "system", "content": persona_prompt})
        messages_payload.extend([msg.model_dump() for msg in body.messages])

        # Priority list of models to try in sequence to survive rate limits and model outages
        candidate_pool = [
            active_model,
            "openrouter/auto",
            "deepseek/deepseek-chat",
            "nvidia/nemotron-3.5-lightning:free",
            "liquid/lfm-2.5-2.6b:free",
            "google/gemma-4-26b-a4b-it:free"
        ]
        models_to_try = list(dict.fromkeys(m for m in candidate_pool if m))

        last_error_detail = None
        for candidate in models_to_try:
            try:
                # Include other candidates as OpenRouter models fallback list (up to 3 total)
                other_fallbacks = [m for m in models_to_try if m != candidate][:2]
                models_array = [candidate] + other_fallbacks

                async with httpx.AsyncClient(timeout=25.0) as client:
                    response = await client.post(
                        url="https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": "http://localhost:5173",
                            "X-Title": "SDG Trajectory Forecaster"
                        },
                        json={
                            "model": candidate,
                            "models": models_array,
                            "temperature": active_temperature,
                            "messages": messages_payload
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if "choices" in data and isinstance(data["choices"], list) and len(data["choices"]) > 0:
                            choice = data["choices"][0]
                            if "message" in choice:
                                return choice["message"]
                    
                    # Parse error cleanly
                    try:
                        err_json = response.json()
                        err_msg = err_json.get("error", {}).get("message", response.text)
                    except Exception:
                        err_msg = response.text
                    
                    last_error_detail = err_msg
                    logger.warning(f"Copilot model '{candidate}' returned {response.status_code}: {err_msg}. Attempting next fallback model...")
                    continue
            except (httpx.TimeoutException, httpx.RequestError) as net_err:
                last_error_detail = str(net_err)
                logger.warning(f"Copilot network error for '{candidate}': {net_err}. Attempting next fallback model...")
                continue

        # If all candidates fail due to upstream rate limits or outages, return high-value synthesized response
        logger.error(f"All Copilot models exhausted. Last error: {last_error_detail}")
        return {
            "role": "assistant",
            "content": (
                "**Policy Advisory Briefing:** Upstream public LLM providers are currently experiencing temporary rate limits. "
                "Here are strategic recommendations derived from global SDG benchmark standards:\n\n"
                "• **1. Target Frontline Delivery Systems:** Prioritize capital and recurrent budgets for community infrastructure, operation & maintenance, and service delivery.\n"
                "• **2. Mobilize Blended Public-Private Financing:** Leverage sovereign guarantees and concessional development loans to crowd in commercial capital.\n"
                "• **3. Institutionalize Sub-national Monitoring:** Establish high-frequency indicator audits to detect bottlenecks before target deadlines.\n\n"
                "*(Please retry your query in a few moments once upstream provider rate limits reset.)*"
            )
        }
    except Exception as e:
        logger.error(f"OpenRouter unexpected failure: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
