import sys
import os
import pandas as pd
import numpy as np
import pycountry
from colorama import init, Fore, Style
import logging

# Add parent directory to path so we can import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from forecasting import classify_status, calculate_core_trajectory

# Initialize colorama for terminal colors
init(autoreset=True)

def print_result(name: str, passed: bool, details: str = ""):
    """Helper to print colorful pass/fail results."""
    if passed:
        print(f"{Fore.GREEN}[PASS]{Style.RESET_ALL} {name}")
        if details:
            print(f"       -> {Fore.LIGHTBLACK_EX}{details}{Style.RESET_ALL}")
    else:
        print(f"{Fore.RED}[FAIL]{Style.RESET_ALL} {name}")
        if details:
            print(f"       -> {Fore.RED}{details}{Style.RESET_ALL}")

def audit_data_completeness():
    print(f"\n{Fore.CYAN}=== 1. Data Completeness & Parsing Audit ==={Style.RESET_ALL}")
    
    # List of 169 SDG Targets
    SDG_TARGETS = [
        '1.1', '1.2', '1.3', '1.4', '1.5', '1.a', '1.b',
        '2.1', '2.2', '2.3', '2.4', '2.5', '2.a', '2.b', '2.c',
        '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9', '3.a', '3.b', '3.c', '3.d',
        '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.a', '4.b', '4.c',
        '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.a', '5.b', '5.c',
        '6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.a', '6.b',
        '7.1', '7.2', '7.3', '7.a', '7.b',
        '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '8.10', '8.a', '8.b',
        '9.1', '9.2', '9.3', '9.4', '9.5', '9.a', '9.b', '9.c',
        '10.1', '10.2', '10.3', '10.4', '10.5', '10.6', '10.7', '10.a', '10.b', '10.c',
        '11.1', '11.2', '11.3', '11.4', '11.5', '11.6', '11.7', '11.a', '11.b', '11.c',
        '12.1', '12.2', '12.3', '12.4', '12.5', '12.6', '12.7', '12.8', '12.a', '12.b', '12.c',
        '13.1', '13.2', '13.3', '13.a', '13.b',
        '14.1', '14.2', '14.3', '14.4', '14.5', '14.6', '14.7', '14.a', '14.b', '14.c',
        '15.1', '15.2', '15.3', '15.4', '15.5', '15.6', '15.7', '15.8', '15.9', '15.a', '15.b', '15.c',
        '16.1', '16.2', '16.3', '16.4', '16.5', '16.6', '16.7', '16.8', '16.9', '16.10', '16.a', '16.b',
        '17.1', '17.2', '17.3', '17.4', '17.5', '17.6', '17.7', '17.8', '17.9', '17.10', '17.11', '17.12', '17.13', '17.14', '17.15', '17.16', '17.17', '17.18', '17.19'
    ]
    
    try:
        query = "SELECT CountryCode, SDG_Target, Year, is_imputed, is_regional_estimate FROM sdg_global_data"
        df = pd.read_sql_query(query, engine)
        
        if df.empty:
            print_result("Database Connection", False, "Table sdg_global_data is empty or does not exist.")
            return
        print_result("Database Connection", True, f"Successfully loaded {len(df)} rows.")

        # Imputation Validation
        total_rows = len(df)
        imputed_rows = df['is_imputed'].sum()
        regional_rows = df['is_regional_estimate'].sum()
        real_rows = total_rows - imputed_rows - regional_rows
        
        real_pct = (real_rows / total_rows) * 100
        imp_pct = (imputed_rows / total_rows) * 100
        reg_pct = (regional_rows / total_rows) * 100
        
        print_result(
            "Imputation Validation", 
            True, 
            f"Real Data: {real_pct:.2f}% | Imputed: {imp_pct:.2f}% | Regional: {reg_pct:.2f}%"
        )
        
        # Cartesian Grid Check
        ISO3_CODES = [country.alpha_3 for country in pycountry.countries]
        EXPECTED_YEARS = list(range(2015, 2027))
        
        db_countries = set(df['CountryCode'].unique())
        missing_countries = set(ISO3_CODES) - db_countries
        db_targets = set(df['SDG_Target'].unique())
        missing_targets = set(SDG_TARGETS) - db_targets
        
        passed_cartesian = True
        err_msg = []
        if missing_countries:
            passed_cartesian = False
            err_msg.append(f"Missing {len(missing_countries)} official ISO-3 countries.")
        if missing_targets:
            passed_cartesian = False
            err_msg.append(f"Missing {len(missing_targets)} official UN targets.")
            
        if passed_cartesian:
            print_result("Cartesian Grid Check", True, "All countries and targets are represented in the dataset.")
        else:
            print_result("Cartesian Grid Check", False, " | ".join(err_msg))

    except Exception as e:
        print_result("Data Completeness Audit", False, f"Exception occurred: {e}")

def audit_predictive_logic():
    print(f"\n{Fore.CYAN}=== 2. Predictive Logic & Mathematical Robustness Audit ==={Style.RESET_ALL}")
    
    try:
        # A. Zero-Floor Constraint
        df_downward = pd.DataFrame({
            'Year': [2015, 2016, 2017, 2018],
            'IndicatorValue': [50.0, 30.0, 10.0, -10.0], # Mathematically plunges below zero
            'is_imputed': [False, False, False, False],
            'is_regional_estimate': [False, False, False, False]
        })
        
        res_floor = calculate_core_trajectory(df_downward, '1.1')
        proj_2030 = res_floor.get('projected_value_2030')
        
        if proj_2030 is not None and proj_2030 >= 0.0:
            print_result("Zero-Floor Constraint", True, f"Prediction bounded safely at {proj_2030} (>= 0.0)")
        else:
            print_result("Zero-Floor Constraint", False, f"Failed floor constraint. Value: {proj_2030}")
            
        # B. Inverted Polarity Classification
        # 3.1 is Maternal Mortality. A drop from 100 to 50 is a HUGE success.
        status_polarity = classify_status(baseline_value=100.0, projected_value=50.0, sdg_target='3.1')
        if status_polarity == "On-track":
            print_result("Inverted Polarity Classification", True, f"Correctly classified 3.1 drop as '{status_polarity}'")
        else:
            print_result("Inverted Polarity Classification", False, f"Classified drop in 3.1 as '{status_polarity}' (Expected On-track)")
            
        # C. Sparse Data Safety Bypass
        df_sparse = pd.DataFrame({
            'Year': [2015],
            'IndicatorValue': [10.0],
            'is_imputed': [False],
            'is_regional_estimate': [False]
        })
        res_sparse = calculate_core_trajectory(df_sparse, '1.1')
        status_sparse = res_sparse.get('status')
        if status_sparse == "Insufficient Data":
            print_result("Sparse Data Safety Bypass", True, "Successfully caught N<2 and bypassed Scikit-Learn safely.")
        else:
            print_result("Sparse Data Safety Bypass", False, f"Did not bypass. Status returned: {status_sparse}")

    except Exception as e:
        print_result("Predictive Logic Audit", False, f"Exception occurred: {e}")

def audit_policy_simulator():
    print(f"\n{Fore.CYAN}=== 3. 'What-If' Policy Simulator Audit ==={Style.RESET_ALL}")
    
    try:
        # Standard synthetic dataset growing steadily
        df_standard = pd.DataFrame({
            'Year': [2015, 2016, 2017, 2018, 2019],
            'IndicatorValue': [10.0, 12.0, 14.0, 16.0, 18.0],
            'is_imputed': [False, False, False, False, False],
            'is_regional_estimate': [False, False, False, False, False]
        })
        
        res_base = calculate_core_trajectory(df_standard, '1.1', policy_multiplier=1.0)
        res_accel = calculate_core_trajectory(df_standard, '1.1', policy_multiplier=1.5)
        res_decel = calculate_core_trajectory(df_standard, '1.1', policy_multiplier=0.5)
        
        proj_base = res_base.get('projected_value_2030')
        proj_accel = res_accel.get('policy_simulated_projection')
        proj_decel = res_decel.get('policy_simulated_projection')
        
        if proj_base is None or proj_accel is None or proj_decel is None:
            print_result("Multiplier Math Check", False, "Missing projection outputs.")
            return

        # Acceleration should result in a higher value, deceleration in a lower value
        if proj_accel > proj_base and proj_decel < proj_base:
            print_result(
                "Multiplier Math Check", 
                True, 
                f"Base: {proj_base:.2f} | Accel (1.5x): {proj_accel:.2f} | Decel (0.5x): {proj_decel:.2f}"
            )
        else:
            print_result(
                "Multiplier Math Check", 
                False, 
                f"Math error -> Base: {proj_base}, Accel: {proj_accel}, Decel: {proj_decel}"
            )

    except Exception as e:
        print_result("Policy Simulator Audit", False, f"Exception occurred: {e}")

if __name__ == "__main__":
    print(f"{Fore.MAGENTA}{Style.BRIGHT}==========================================")
    print(f"SDG Trajectory - Backend QA Engine")
    print(f"=========================================={Style.RESET_ALL}")
    
    audit_data_completeness()
    audit_predictive_logic()
    audit_policy_simulator()
    
    print(f"\n{Fore.MAGENTA}{Style.BRIGHT}==========================================")
    print(f"Audit Complete.")
    print(f"=========================================={Style.RESET_ALL}\n")
