from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import logging

from database import query_database
from models import train_and_predict

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

# Pydantic Schemas
class PredictionResponse(BaseModel):
    country_code: str
    sdg_target: str
    historical_data: List[Dict[str, Any]]
    predictions: List[Dict[str, Any]]
    status: str
    policy_simulated_projection: Optional[float] = None
    ai_narrative: str


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
        historical_data = df.to_dict(orient='records')
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
        historical_data = df.to_dict(orient='records')
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
