import sqlite3
import pandas as pd

def export_integrity_reports():
    print("--- Starting Database Integrity Extraction ---")
    
    # Connect to the database
    conn = sqlite3.connect("sdg_database.db")
    
    # 1. Extract Unique Countries
    print("Extracting list of covered countries/regions...")
    # Using DISTINCT to get every unique country code that exists in the DB
    countries_df = pd.read_sql("SELECT DISTINCT CountryCode FROM sdg_global_data ORDER BY CountryCode", conn)
    countries_df.to_csv("covered_countries.csv", index=False)
    
    # 2. Extract Unique SDG Targets
    print("Extracting list of covered SDG targets...")
    # Using DISTINCT to get every unique target
    targets_df = pd.read_sql("SELECT DISTINCT SDG_Target FROM sdg_global_data ORDER BY SDG_Target", conn)
    targets_df.to_csv("covered_targets.csv", index=False)
    
    # 3. Calculate Goals Covered
    # We can derive the Goals by looking at the prefix of the targets (e.g., '1' from '1.1')
    targets_list = targets_df['SDG_Target'].astype(str).tolist()
    
    # Extract the string before the first dot (or take the whole string if no dot exists)
    goals = set()
    for t in targets_list:
        if '.' in t:
            goals.add(t.split('.')[0])
        else:
            # Fallback in case a target is formatted differently (like 'Goal1' or just '1')
            goals.add(t.replace('Goal', ''))
            
    # Sort the goals numerically if possible
    sorted_goals = sorted(list(goals), key=lambda x: int(x) if x.isdigit() else x)

    # --- Print Summary to Terminal ---
    print("\n================ INTEGRITY SUMMARY ================")
    print(f"Total Unique Countries/Regions Saved: {len(countries_df)}")
    print(f"Total Unique SDG Targets Saved: {len(targets_list)}")
    print(f"Total Unique SDG Goals Covered: {len(sorted_goals)}")
    print(f"Goals Present: {', '.join(sorted_goals)}")
    print("===================================================")
    
    print("\nSUCCESS: Please open 'covered_countries.csv' and 'covered_targets.csv' in your folder to see the complete lists.")
    
    conn.close()

if __name__ == "__main__":
    export_integrity_reports()