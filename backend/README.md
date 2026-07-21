# SDG Trajectory - Backend

This is the backend for the SDG Trajectory Prediction and Policy Simulation project. It serves as the central data processing, machine learning forecasting, and API serving layer for the frontend application.

## Modules Completed

The backend currently consists of two fully implemented core modules:

### Module 1: Data Pipeline & Database Engine
- **Data Ingestion**: Parses raw CSV datasets (`covered_countries.csv`, `covered_targets.csv`, and data in `raw_data/`).
- **Storage (`database.py`)**: Uses a local SQLite database (`sdg_database.db`) for efficient structured storage and fast querying.
- **Pipeline (`data_pipeline.py`)**: Responsible for ETL (Extract, Transform, Load) operations, making sure the data is clean and ready for API consumption.

### Module 2: Machine Learning Forecasting & API Serving
- **Forecasting Engine (`models.py`)**: Uses Scikit-learn's `LinearRegression` for projecting SDG trajectory up to 2030, and `IsolationForest` for robust anomaly detection (filtering outliers). It also supports dynamic policy multipliers to simulate policy impacts.
- **LLM Integration**: Integrated with the OpenRouter API to generate intelligent, dynamic 2-sentence AI narratives about a country's trajectory progress. Includes a robust fallback mechanism using various open-source LLMs if the primary fails.
- **FastAPI Server (`main.py`)**: Provides high-performance RESTful API endpoints for the frontend to consume.

---

## Prerequisites

- Python 3.8+
- [OpenRouter API Key](https://openrouter.ai/) for AI narratives.

## Setup Instructions

1. **Virtual Environment Setup (Optional but recommended):**
   ```bash
   python -m venv .venv
   source .venv/Scripts/activate  # On Windows
   ```

2. **Install Dependencies:**
   Install all required libraries. (Note: Ensure `requirements.txt` is fully populated, or manually install dependencies like `fastapi`, `uvicorn`, `pandas`, `scikit-learn`, `requests`, `python-dotenv`).
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables:**
   Create a `.env` file in the `backend/` directory and add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

## Running the Server

Start the FastAPI backend server using Uvicorn:

```bash
uvicorn main:app --reload
```
The API will be available at `http://127.0.0.1:8000`. You can also view the interactive Swagger API documentation at `http://127.0.0.1:8000/docs`.

---

## API Documentation

The backend exposes the following CORS-enabled endpoints for the frontend to use:

### 1. Predict Trajectory
**Endpoint**: `GET /api/predict`

Fetches historical data and generates standard 2030 forecasts for a specific country and SDG target.

**Query Parameters:**
- `country_code` (string): Human-readable country code (e.g., `'IND'`, `'USA'`).
- `sdg_target` (string): The SDG Target or Goal (e.g., `'Goal1'`, `'13.2'`).

### 2. Simulate Policy
**Endpoint**: `GET /api/simulate`

Simulates alternate 2030 projections by accepting a policy impact multiplier.

**Query Parameters:**
- `country_code` (string): Human-readable country code.
- `sdg_target` (string): The SDG Target or Goal.
- `policy_impact_multiplier` (float): Multiplier for the rate of change (e.g., `1.2` for 20% faster growth, `0.9` for a 10% decrease).

### Standard Response Format
Both endpoints return a JSON response adhering to the `PredictionResponse` schema:

```json
{
  "country_code": "IND",
  "sdg_target": "Goal1",
  "historical_data": [
    {
      "Year": 2015,
      "IndicatorValue": 15.2,
      ...
    }
  ],
  "predictions": [
    {
      "Year": 2026,
      "PredictedValue": 18.5
    },
    ...
  ],
  "status": "On-track",
  "policy_simulated_projection": null,
  "ai_narrative": "The trajectory is currently classified as On-track, moving from a baseline of 15.20 to a projected 24.80 by 2030. Strategic interventions may be necessary to ensure optimal target achievement."
}
```

*(Note: `policy_simulated_projection` will contain a float value if requested via the `/api/simulate` endpoint).*

## Test Scripts

Standalone validation and testing scripts have been moved to the `backend/test_scripts/` directory to keep the main source tree clean. These scripts can be used to manually verify the database integrity, find bad rows, check data pipelines, and test the OpenRouter integration without starting the main server.
