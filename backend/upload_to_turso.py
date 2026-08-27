import sqlite3
import libsql_client
import asyncio
import os
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

async def migrate_to_cloud():
    print("⏳ Connecting to local SQLite database...")
    db_file = "sdg_database.db"
    if not os.path.exists(db_file):
        print(f"❌ Error: {db_file} not found in current directory.")
        return

    local_conn = sqlite3.connect(db_file)
    local_cursor = local_conn.cursor()
    
    # 1. Dynamically retrieve actual column names
    local_cursor.execute("PRAGMA table_info(sdg_global_data)")
    columns_info = local_cursor.fetchall()
    
    if not columns_info:
        print("❌ Error: Table 'sdg_global_data' not found or is empty.")
        local_conn.close()
        return

    column_names = [col[1] for col in columns_info]
    cols_str = ", ".join(column_names)
    placeholders = ", ".join(["?"] * len(column_names))
    
    print(f"📋 Detected table columns: {cols_str}")
    
    # 2. Fetch all rows
    local_cursor.execute(f"SELECT {cols_str} FROM sdg_global_data")
    rows = local_cursor.fetchall()
    local_conn.close()
    
    print(f"🚀 Loaded {len(rows):,} rows from local database.")
    
    url = os.getenv("TURSO_DATABASE_URL")
    token = os.getenv("TURSO_AUTH_TOKEN")
    
    if not url or not token:
        print("❌ Error: Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env file.")
        return

    print(f"☁️ Connecting to Turso Cloud ({url})...")
    async with libsql_client.create_client(url, auth_token=token) as client:
        # 3. Create dynamic schema in Turso matching local DB
        create_cols = []
        for col in columns_info:
            col_name = col[1]
            col_type = col[2] or "TEXT"
            create_cols.append(f"{col_name} {col_type}")
        
        create_table_sql = f"""
            CREATE TABLE IF NOT EXISTS sdg_global_data (
                {', '.join(create_cols)}
            );
        """
        await client.execute(create_table_sql)
        print("✅ Cloud table schema verified.")
        
        # 4. Upload in batches of 2,000 rows
        chunk_size = 2000
        total_chunks = (len(rows) // chunk_size) + (1 if len(rows) % chunk_size != 0 else 0)
        insert_sql = f"INSERT INTO sdg_global_data ({cols_str}) VALUES ({placeholders})"
        
        print(f"📤 Uploading {len(rows):,} records across {total_chunks} chunks...")
        
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i:i+chunk_size]
            statements = [
                libsql_client.Statement(insert_sql, list(row))
                for row in chunk
            ]
            await client.batch(statements)
            chunk_num = (i // chunk_size) + 1
            if chunk_num % 10 == 0 or chunk_num == total_chunks:
                print(f"  -> Progress: Chunk {chunk_num}/{total_chunks} uploaded")
            
    print("\n🎉 Migration Complete! All records have been successfully uploaded to Turso Cloud.")

if __name__ == "__main__":
    asyncio.run(migrate_to_cloud())