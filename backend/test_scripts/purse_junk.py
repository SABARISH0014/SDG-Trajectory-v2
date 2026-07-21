import sqlite3

def delete_bad_rows():
    print("🧹 Purging ghost records...")
    conn = sqlite3.connect("sdg_database.db")
    cursor = conn.cursor()
    
    # This deletes any row where the indicator is missing
    cursor.execute("DELETE FROM sdg_global_data WHERE IndicatorValue IS NULL")
    count = cursor.rowcount
    
    conn.commit()
    conn.close()
    print(f"✅ Successfully deleted {count} junk row(s).")

if __name__ == "__main__":
    delete_bad_rows()