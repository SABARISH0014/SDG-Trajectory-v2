import sqlite3
import pandas as pd

def inspect_db():
    conn = sqlite3.connect("sdg_database.db")
    
    print("--- Inspecting available Country Codes (first 10) ---")
    codes = pd.read_sql("SELECT DISTINCT CountryCode FROM sdg_global_data LIMIT 10", conn)
    print(codes)
    
    print("\n--- Inspecting available SDG Targets (first 10) ---")
    targets = pd.read_sql("SELECT DISTINCT SDG_Target FROM sdg_global_data LIMIT 10", conn)
    print(targets)
    
    conn.close()

if __name__ == "__main__":
    inspect_db()