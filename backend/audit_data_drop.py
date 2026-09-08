import os
import asyncio
import libsql_client
import pandas as pd
from dotenv import load_dotenv

# Load Turso credentials from .env
load_dotenv()

async def run_audit():
    url = os.getenv("TURSO_DATABASE_URL")
    token = os.getenv("TURSO_AUTH_TOKEN")

    if not url or not token:
        print("❌ Error: Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env file.")
        return

    # Define the specific country and target you want to audit
    target_country = 'IND'
    target_sdg = '1.1'

    print(f"🔍 Connecting to Turso to audit {target_country} - Target {target_sdg}...")

    query = """
        SELECT 
            Year, 
            IndicatorValue, 
            is_imputed, 
            is_regional_estimate
        FROM 
            sdg_global_data
        WHERE 
            CountryCode = ? AND SDG_Target = ?
        ORDER BY 
            Year ASC
    """
    
    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            result = await client.execute(query, [target_country, target_sdg])
            
            if not result.rows:
                print(f"⚠️ No data found for CountryCode='{target_country}' and SDG_Target='{target_sdg}'.")
                return
                
            # Convert results to a Pandas DataFrame for clean terminal printing
            columns = result.columns
            data = [list(row) for row in result.rows]
            df = pd.DataFrame(data, columns=columns)
            
            print(f"\n📊 Data Timeline for {target_country} (Target {target_sdg}):")
            print("-" * 60)
            print(df.to_string(index=False))
            print("-" * 60)
            
    except Exception as e:
        print(f"❌ Failed to query Turso: {e}")

if __name__ == "__main__":
    # Windows-specific fix for asyncio compatibility
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_audit())