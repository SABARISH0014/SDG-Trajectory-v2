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
from auth import create_access_token
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

def test_admin_config_bounds_check():
    token = create_access_token(data={"sub": "admin"})
    
    response = client.post(
        "/api/admin/config", 
        json={"contamination": 0.9},
        headers={"Authorization": f"Bearer {token}"}
    )
    # 422 Unprocessable Entity because contamination is > 0.5
    assert response.status_code == 422

def test_admin_stats_and_cache_purge():
    token = create_access_token(data={"sub": "admin"})
    
    # Test GET /api/admin/stats
    stats_res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert "total_records" in stats_data
    assert "total_countries" in stats_data
    assert "total_targets" in stats_data
    assert "cache_entries" in stats_data
    assert "api_status" in stats_data
    assert stats_data["api_status"] == "online"

    # Test POST /api/admin/cache/clear
    purge_res = client.post("/api/admin/cache/clear", headers={"Authorization": f"Bearer {token}"})
    assert purge_res.status_code == 200
    purge_data = purge_res.json()
    assert "cleared_entries" in purge_data
    assert "message" in purge_data

@patch("main.upsert_indicator_record")
@patch("main.delete_indicator_record")
def test_admin_data_explorer_and_record_ops(mock_delete, mock_upsert):
    mock_upsert.return_value = True
    mock_delete.return_value = True
    token = create_access_token(data={"sub": "admin"})
    
    # Test GET /api/admin/data
    data_res = client.get("/api/admin/data?country_code=IND&sdg_target=8.6", headers={"Authorization": f"Bearer {token}"})
    assert data_res.status_code == 200
    data_json = data_res.json()
    assert "country_code" in data_json
    assert "sdg_target" in data_json
    assert "records" in data_json
    
    # Test POST /api/admin/data/record
    save_res = client.post(
        "/api/admin/data/record",
        json={
            "country_code": "IND",
            "sdg_target": "8.6",
            "year": 2024,
            "indicator_value": 18.25,
            "is_imputed": 0
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert save_res.status_code == 200
    assert "Successfully updated" in save_res.json()["message"]
    
    # Test DELETE /api/admin/data/record
    del_res = client.delete(
        "/api/admin/data/record?country_code=IND&sdg_target=8.6&year=2024",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert del_res.status_code == 200
    assert "Successfully deleted" in del_res.json()["message"]

@patch("main.get_system_config_str")
@patch("main.set_system_config_str")
@patch("main.get_system_config")
@patch("main.set_system_config")
def test_admin_ai_config(mock_set_cfg, mock_get_cfg, mock_set_str, mock_get_str):
    mock_get_str.side_effect = lambda key, default: "google/gemma-4-26b-a4b-it:free" if key == "copilot_model" else "un_advisor"
    mock_get_cfg.side_effect = lambda key, default: 0.2 if key == "copilot_temperature" else 0.0
    mock_set_str.return_value = None
    mock_set_cfg.return_value = None
    token = create_access_token(data={"sub": "admin"})
    
    # Test GET /api/admin/ai-config
    get_res = client.get("/api/admin/ai-config", headers={"Authorization": f"Bearer {token}"})
    assert get_res.status_code == 200
    cfg_data = get_res.json()
    assert "copilot_model" in cfg_data
    assert "copilot_persona" in cfg_data
    assert "copilot_temperature" in cfg_data
    assert "emergency_mock_mode" in cfg_data
    
    # Test POST /api/admin/ai-config
    post_res = client.post(
        "/api/admin/ai-config",
        json={
            "copilot_model": "meta-llama/llama-3.3-70b-instruct:free",
            "copilot_persona": "data_scientist",
            "copilot_temperature": 0.4,
            "emergency_mock_mode": False
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert post_res.status_code == 200
    assert "successfully" in post_res.json()["message"]

@patch("main.verify_password")
@patch("main.set_system_config_str")
@patch("main.get_system_config_str")
def test_admin_change_password(mock_get_str, mock_set_str, mock_verify):
    mock_get_str.return_value = ""
    mock_set_str.return_value = None
    mock_verify.return_value = True
    
    token = create_access_token(data={"sub": "admin"})
    
    # Test valid password change
    res = client.post(
        "/api/admin/change-password",
        json={
            "current_password": "admin123",
            "new_password": "new_secure_password_2026"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert "updated successfully" in res.json()["message"]
    
    # Test invalid current password
    mock_verify.return_value = False
    fail_res = client.post(
        "/api/admin/change-password",
        json={
            "current_password": "wrong_password",
            "new_password": "new_secure_password_2026"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert fail_res.status_code == 400

def test_admin_audit_logs():
    token = create_access_token(data={"sub": "admin"})
    
    # Test GET /api/admin/audit-logs
    res = client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "audit_logs" in data
    assert "count" in data
    assert isinstance(data["audit_logs"], list)
    
    # Test POST /api/admin/audit-logs/clear
    clear_res = client.post("/api/admin/audit-logs/clear", headers={"Authorization": f"Bearer {token}"})
    assert clear_res.status_code == 200
    assert "cleared successfully" in clear_res.json()["message"]

@patch("main.get_goal_status_data")
def test_globe_goal_status(mock_get_goal_status):
    mock_get_goal_status.return_value = {
        "sdg_target": "3.1",
        "countries": {
            "IND": {
                "country_code": "IND",
                "status": "On-track",
                "baseline_year": 2024,
                "baseline_value": 128.5,
                "projected_value_2030": 42.7
            },
            "USA": {
                "country_code": "USA",
                "status": "Off-track",
                "baseline_year": 2024,
                "baseline_value": 17.0,
                "projected_value_2030": 20.6
            }
        },
        "summary": {
            "total_countries": 2,
            "on_track": 1,
            "at_risk": 0,
            "off_track": 1,
            "insufficient_data": 0
        }
    }
    
    res = client.get("/api/globe/goal-status?goal=3")
    assert res.status_code == 200
    data = res.json()
    assert data["goal"] == 3
    assert data["goal_name"] == "Good Health and Well-being"
    assert "IND" in data["countries"]
    assert data["countries"]["IND"]["status"] == "On-track"
    assert data["summary"]["total_countries"] == 2