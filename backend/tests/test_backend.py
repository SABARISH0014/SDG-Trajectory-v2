import os
import sqlite3
import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
import sys

# Import backend modules safely
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import query_database
from forecasting import filter_outliers, train_and_predict, classify_status, calculate_core_trajectory
from main import app

DB_PATH = "sdg_database.db"

# ==========================================
# 1. Data Layer Tests
# ==========================================

def test_database_exists():
    """Test that the SQLite database file exists at the expected path."""
    assert os.path.exists(DB_PATH), f"Database file {DB_PATH} does not exist."

def test_sparse_data_nulls_retained():
    """
    Test utility that queries the database to assert that the Cartesian grid 
    successfully retained NULL values for countries/targets with absolutely zero data, 
    as per the strict enterprise requirements (Sparse Data Bypass).
    """
    conn = sqlite3.connect(DB_PATH)
    query = "SELECT IndicatorValue FROM sdg_global_data"
    df = pd.read_sql(query, conn)
    conn.close()
    
    # We EXPECT null values because we do not use dropna() on the Master Grid
    null_count = df["IndicatorValue"].isnull().sum()
    assert null_count > 0, "Expected NULL values for completely sparse targets, but found 0. The Cartesian grid might be accidentally dropping empty countries."


# ==========================================
# 2. AI & Model Tests (models.py)
# ==========================================

@pytest.fixture
def mock_historical_data():
    """Create a mock small Pandas DataFrame for model testing."""
    return pd.DataFrame({
        "Year": [2015, 2016, 2017],
        "IndicatorValue": [10.5, 11.2, 11.8]
    })

def test_filter_outliers_sparse_data(mock_historical_data):
    """
    Test the anomaly detection function to ensure it doesn't crash 
    when given fewer than 4 data points.
    """
    df_clean = filter_outliers(mock_historical_data)
    
    # Assert it returns the DataFrame unchanged instead of crashing
    assert len(df_clean) == 3
    pd.testing.assert_frame_equal(df_clean, mock_historical_data)

import asyncio

def test_forecasting_and_classification():
    """
    Test the forecasting function to assert that it runs without crashing 
    using the new Enterprise AI logic.
    """
    extended_df = pd.DataFrame({
        "Year": [2015, 2016, 2017, 2018, 2019, 2020],
        "IndicatorValue": [10.5, 11.2, 11.8, 12.5, 13.0, 13.8]
    })
    
    # Run the new AI prediction logic (now async)
    result = asyncio.run(train_and_predict(extended_df, sdg_target='13.2'))
    assert result is not None, "Model failed to return predictions."
    assert "predictions" in result, "Predictions missing from result."


# ==========================================
# 3. API Endpoint Tests (main.py)
# ==========================================

client = TestClient(app)

def test_api_predict_valid():
    """
    Test /api/predict with a target known to have robust data (13.2 from OWID).
    Assert status 200 and expected JSON keys.
    """
    response = client.get("/api/predict?country_code=IND&sdg_target=13.2")
    
    assert response.status_code == 200
    
    data = response.json()
    assert "historical_data" in data
    assert "predictions" in data
    assert "status" in data
    assert "ai_narrative" in data

def test_api_predict_error_handling():
    """
    Test /api/predict with a fake country code to assert graceful handling 
    via the new Sparse Data Bypass.
    """
    response = client.get("/api/predict?country_code=99999&sdg_target=1.1")
    
    # Our new system returns 200 with an "Insufficient Data" status instead of crashing
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Insufficient Data", "Failed to trigger Sparse Data Bypass"

def test_api_simulate_valid():
    """
    Test /api/simulate with valid parameters. We use target 13.2 because we 
    know the OWID dataset guarantees data exists for this target globally.
    """
    response = client.get("/api/simulate?country_code=IND&sdg_target=13.2&policy_impact_multiplier=1.5")
    
    assert response.status_code == 200
    
    data = response.json()
    
    # Check if the fallback was triggered or if we got actual simulated data
    if data["status"] == "Insufficient Data":
        assert data.get("policy_simulated_projection") is None
    else:
        assert data.get("policy_simulated_projection") is not None

# ==========================================
# 4. Admin API Endpoint Tests (main.py)
# ==========================================

def test_admin_login_success():
    response = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    data = response.json()
    assert "token" in data

def test_admin_login_failure():
    response = client.post("/api/admin/login", json={"username": "admin", "password": "wrongpassword"})
    assert response.status_code == 401

def test_admin_config_requires_auth():
    response = client.post("/api/admin/config", json={"contamination": 0.1})
    assert response.status_code == 401

def test_admin_config_bounds_check():
    login_res = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
    assert login_res.status_code == 200, "Setup failed: Could not login for token"
    token = login_res.json()["token"]
    
    response = client.post(
        "/api/admin/config", 
        json={"contamination": 0.9},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 422