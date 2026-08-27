import os
import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
import sys
from unittest.mock import patch

# Import backend modules safely
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import query_database
from forecasting import filter_outliers, train_and_predict, classify_status, calculate_core_trajectory
from main import app

# ==========================================
# 1. Data Layer & Architecture Tests
# ==========================================

def test_empty_dataframe_fallback():
    """
    Test that the new Turso architecture gracefully handles missing or empty data 
    by triggering the Sparse Data Bypass instead of crashing.
    """
    empty_df = pd.DataFrame()
    result = calculate_core_trajectory(empty_df, sdg_target="1.1")
    
    assert result["status"] == "Insufficient Data"
    assert result["predictions"] == []
    assert result["baseline_value"] is None

def test_sparse_data_bypass():
    """
    Test that data with fewer than 2 real points triggers the sparse data bypass.
    """
    sparse_df = pd.DataFrame({
        "Year": [2015],
        "IndicatorValue": [10.5]
    })
    result = calculate_core_trajectory(sparse_df, sdg_target="1.1")
    
    assert result["status"] == "Insufficient Data"
    assert result["predictions"] == []

# ==========================================
# 2. AI & Model Tests (models.py/forecasting.py)
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
    Test /api/predict. Due to CI not having Turso credentials, 
    this will gracefully fallback to Insufficient Data but maintain schema.
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
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Insufficient Data", "Failed to trigger Sparse Data Bypass"

def test_api_simulate_valid():
    """
    Test /api/simulate endpoint.
    """
    response = client.get("/api/simulate?country_code=IND&sdg_target=13.2&policy_impact_multiplier=1.5")
    assert response.status_code == 200
    data = response.json()
    
    if data["status"] == "Insufficient Data":
        assert data.get("policy_simulated_projection") is None
    else:
        assert data.get("policy_simulated_projection") is not None

# ==========================================
# 4. Admin API Endpoint Tests (main.py)
# ==========================================

@patch("main.verify_password")
def test_admin_login_success(mock_verify):
    # Mock verify_password to always return True for this test
    # This circumvents the broken dummy hash in CI
    mock_verify.return_value = True
    
    response = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    data = response.json()
    assert "token" in data

@patch("main.verify_password")
def test_admin_login_failure(mock_verify):
    # Mock to return False
    mock_verify.return_value = False
    
    response = client.post("/api/admin/login", json={"username": "admin", "password": "wrongpassword"})
    assert response.status_code == 401

@patch("main.verify_password")
def test_admin_config_requires_auth(mock_verify):
    response = client.post("/api/admin/config", json={"contamination": 0.1})
    assert response.status_code == 401

@patch("main.verify_password")
def test_admin_config_bounds_check(mock_verify):
    mock_verify.return_value = True
    login_res = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
    assert login_res.status_code == 200, "Setup failed: Could not login for token"
    token = login_res.json()["token"]
    
    response = client.post(
        "/api/admin/config", 
        json={"contamination": 0.9},
        headers={"Authorization": f"Bearer {token}"}
    )
    # 422 Unprocessable Entity because contamination is > 0.5
    assert response.status_code == 422