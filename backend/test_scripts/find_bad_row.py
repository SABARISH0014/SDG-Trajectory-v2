import sqlite3
import pandas as pd

conn = sqlite3.connect("sdg_database.db")
# Find the row where the value is missing
df = pd.read_sql("SELECT * FROM sdg_global_data WHERE IndicatorValue IS NULL", conn)

print("🔍 Found the culprit row(s):")
print(df)
conn.close()