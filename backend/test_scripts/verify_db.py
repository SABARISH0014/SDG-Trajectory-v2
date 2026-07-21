import sqlite3
import pandas as pd

def verify_sdg_database():
    conn = sqlite3.connect("sdg_database.db")
    
    print("================ DATABASE INTEGRITY AUDIT ================")
    
    # 1. Total Rows
    total_rows = pd.read_sql("SELECT COUNT(*) as count FROM sdg_global_data", conn).iloc[0]['count']
    print(f"Total Rows Loaded: {total_rows}")
    
    # 2. Total Unique Countries
    countries = pd.read_sql("SELECT COUNT(DISTINCT CountryCode) as count FROM sdg_global_data", conn).iloc[0]['count']
    print(f"Unique Country Codes: {countries}")
    
    # 3. Total Unique Targets
    targets = pd.read_sql("SELECT COUNT(DISTINCT SDG_Target) as count FROM sdg_global_data", conn).iloc[0]['count']
    print(f"Unique SDG Targets: {targets}")
    
    # 4. Check Year Span
    years = pd.read_sql("SELECT MIN(Year) as min_y, MAX(Year) as max_y FROM sdg_global_data", conn).iloc[0]
    print(f"Year Range: {years['min_y']} to {years['max_y']}")
    
    # 5. Null Value Check on Imputed Values
    null_vals = pd.read_sql("SELECT COUNT(*) as count FROM sdg_global_data WHERE IndicatorValue IS NULL", conn).iloc[0]['count']
    print(f"Unfillable (Null) Values: {null_vals}")
    
    print("==========================================================")
    conn.close()

if __name__ == "__main__":
    verify_sdg_database()