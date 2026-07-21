import sqlite3
import pandas as pd

def run_database_audit():
    print("🔍 Running Enterprise Database Audit...\n")
    
    # Connect to your newly built database
    conn = sqlite3.connect("sdg_database.db")
    
    # 1. Check Total Rows (How massive is your dataset?)
    total_rows = pd.read_sql("SELECT COUNT(*) as count FROM sdg_global_data", conn).iloc[0]['count']
    print(f"📊 Total Records (Rows): {total_rows:,}")
    
    # 2. Check Country Coverage
    countries_df = pd.read_sql("SELECT DISTINCT CountryName, CountryCode FROM sdg_global_data", conn)
    total_countries = len(countries_df)
    print(f"🌍 Total Unique Countries/Regions Covered: {total_countries}")
    # Print a sample to verify it looks correct
    print(f"   -> Sample: {', '.join(countries_df['CountryName'].head(5).tolist())}...")
    
    # 3. Check Goal & Target Coverage
    goals_df = pd.read_sql("SELECT DISTINCT SDG_Target FROM sdg_global_data ORDER BY SDG_Target", conn)
    total_goals = len(goals_df)
    print(f"🎯 Total Unique Goals/Targets Found: {total_goals}")
    safe_goals_list = [str(item) for item in goals_df['SDG_Target'].head(20).tolist()]
    print(f"   -> List of Goals (Sample): {', '.join(safe_goals_list)} ...")
    # 4. Check Year Range (Should be 2015 to 2025/2026)
    years_df = pd.read_sql("SELECT MIN(Year) as start_year, MAX(Year) as end_year FROM sdg_global_data", conn)
    start = years_df.iloc[0]['start_year']
    end = years_df.iloc[0]['end_year']
    print(f"📅 Data Timeframe: {start} to {end}")
    
    # 5. Check Sources
    sources = pd.read_sql("SELECT DISTINCT Source FROM sdg_global_data", conn)
    print(f"🗄️  Data Sources Integrated: {', '.join(sources['Source'].tolist())}")
    
    conn.close()
    print("\n✅ Audit Complete.")

if __name__ == "__main__":
    run_database_audit()