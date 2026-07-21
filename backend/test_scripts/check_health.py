import sqlite3

def check_for_nans():
    print("🏥 Running Data Health Check (Null Value Detection)...")
    
    conn = sqlite3.connect("sdg_database.db")
    cursor = conn.cursor()
    
    # Query for any row where IndicatorValue is NULL
    # SQLite treats missing data as NULL
    query = "SELECT COUNT(*) FROM sdg_global_data WHERE IndicatorValue IS NULL OR IndicatorValue = ''"
    cursor.execute(query)
    nan_count = cursor.fetchone()[0]
    
    if nan_count == 0:
        print("✅ PASS: Zero NaN values detected in IndicatorValue.")
        print("🎉 Your database is perfectly clean for Module 2!")
    else:
        print(f"❌ FAIL: {nan_count} rows have missing values (NaN).")
        print("You must re-run the interpolation logic in data_pipeline.py.")
        
    conn.close()

if __name__ == "__main__":
    check_for_nans()