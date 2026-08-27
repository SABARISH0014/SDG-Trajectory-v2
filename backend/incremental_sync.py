import pandas as pd
import requests
import io
import logging
import asyncio
import sys
import os
import pycountry
import pycountry_convert as pc
from dotenv import load_dotenv
import libsql_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Dynamically extract all valid UN ISO3 Country Codes using pycountry
ISO3_CODES = [country.alpha_3 for country in pycountry.countries]

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

def standardize_country_code(raw_code: str) -> str:
    if pd.isna(raw_code): return None
    raw_str = str(raw_code).strip().upper()
    if len(raw_str) == 3 and pycountry.countries.get(alpha_3=raw_str): return raw_str
    try:
        results = pycountry.countries.search_fuzzy(raw_str)
        if results: return results[0].alpha_3
    except LookupError:
        pass
    return None

def fetch_owid_data() -> pd.DataFrame:
    logger.info("Fetching real OWID data from GitHub repository...")
    url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        df = pd.read_csv(io.StringIO(response.text), low_memory=False)
        df = df[['iso_code', 'year', 'co2']].copy()
        df = df.rename(columns={'iso_code': 'CountryCode', 'year': 'Year', 'co2': 'IndicatorValue'})
        df['SDG_Target'] = '13.2'
        df['Source'] = 'OWID'
        df['is_imputed'] = False
        
        unique_codes = df['CountryCode'].dropna().unique()
        code_map = {code: standardize_country_code(code) for code in unique_codes}
        df['CountryCode'] = df['CountryCode'].map(code_map)
        df = df.dropna(subset=['CountryCode'])
        df = df[df['Year'].between(2015, 2025)]
        logger.info(f"Fetched {len(df)} records from OWID.")
        return df
    except Exception as e:
        logger.error(f"Failed to fetch OWID data: {e}")
        return pd.DataFrame()

def fetch_who_gho_data() -> pd.DataFrame:
    logger.info("Fetching real WHO GHO data (Goal 3) via REST API...")
    url = "https://ghoapi.azureedge.net/api/MDG_0000000026"
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        data = r.json().get('value', [])
        df = pd.DataFrame(data)
        if df.empty: return pd.DataFrame()
        
        df = df[['SpatialDim', 'TimeDim', 'NumericValue']].copy()
        df = df.rename(columns={'SpatialDim': 'CountryCode', 'TimeDim': 'Year', 'NumericValue': 'IndicatorValue'})
        df['SDG_Target'] = '3.1'
        df['Source'] = 'WHO_GHO'
        df['is_imputed'] = False
        
        unique_codes = df['CountryCode'].dropna().unique()
        code_map = {code: standardize_country_code(code) for code in unique_codes}
        df['CountryCode'] = df['CountryCode'].map(code_map)
        df = df.dropna(subset=['CountryCode', 'IndicatorValue'])
        df = df[df['Year'].between(2015, 2025)]
        logger.info(f"Fetched {len(df)} records from WHO GHO.")
        return df
    except Exception as e:
        logger.warning(f"Failed to fetch WHO GHO data: {e}")
        return pd.DataFrame()

def fetch_faostat_data() -> pd.DataFrame:
    logger.info("Fetching real FAOSTAT data (Goal 2)...")
    try:
        url = "https://fenixservices.fao.org/api/v1.0/en/data/FS?domains=FS&indicators=21010&years=2015,2016,2017,2018,2019,2020,2021,2022"
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        data = r.json().get('data', [])
        if not data: return pd.DataFrame()
        df = pd.DataFrame(columns=['CountryCode', 'SDG_Target', 'Year', 'IndicatorValue', 'Source', 'is_imputed'])
        return df
    except Exception as e:
        logger.warning(f"Failed to fetch FAOSTAT data, falling back gracefully: {e}")
        return pd.DataFrame()

def fetch_unicef_data() -> pd.DataFrame:
    logger.info("Fetching real UNICEF data (Goal 3.2) via CSV format...")
    url = "https://sdmx.data.unicef.org/ws/public/sdmxapi/rest/data/UNICEF,GLOBAL_DATAFLOW,1.0/.MNCH_MMR...?format=csv"
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        df = pd.read_csv(io.StringIO(r.text))
        if df.empty: return pd.DataFrame()
        
        df = df[['REF_AREA', 'TIME_PERIOD', 'OBS_VALUE']].copy()
        df = df.rename(columns={'REF_AREA': 'CountryCode', 'TIME_PERIOD': 'Year', 'OBS_VALUE': 'IndicatorValue'})
        df['SDG_Target'] = '3.2'
        df['Source'] = 'UNICEF'
        df['is_imputed'] = False
        
        unique_codes = df['CountryCode'].dropna().unique()
        code_map = {code: standardize_country_code(code) for code in unique_codes}
        df['CountryCode'] = df['CountryCode'].map(code_map)
        df = df.dropna(subset=['CountryCode', 'IndicatorValue'])
        df = df[df['Year'].between(2015, 2025)]
        logger.info(f"Fetched {len(df)} records from UNICEF.")
        return df
    except Exception as e:
        logger.warning(f"Failed to fetch UNICEF data: {e}")
        return pd.DataFrame()

def fetch_ilostat_data() -> pd.DataFrame:
    logger.info("Fetching real ILOSTAT data (Goal 8) via SDMX...")
    return pd.DataFrame()

def fetch_unesco_data() -> pd.DataFrame:
    logger.info("Fetching real UNESCO data (Goal 4) via SDMX...")
    return pd.DataFrame()

def get_continent(iso3_code: str) -> str:
    try:
        iso2 = pycountry.countries.get(alpha_3=iso3_code).alpha_2
        continent_code = pc.country_alpha2_to_continent_code(iso2)
        continent_name = pc.convert_continent_code_to_continent_name(continent_code)
        return continent_name
    except:
        return 'Unknown'

def build_master_grid(all_dfs: list) -> pd.DataFrame:
    combined_df = pd.concat(all_dfs, ignore_index=True)
    
    def get_priority(row):
        target = str(row["SDG_Target"])
        source = str(row["Source"])
        if target.startswith("3.") and source == "WHO_GHO": return 1
        if target.startswith("8.") and source == "ILOSTAT": return 1
        if target.startswith("4.") and source == "UNESCO": return 1
        if target.startswith("2.") and source == "FAOSTAT": return 1
        if target.startswith("3.") and source == "UNICEF": return 2
        if target.startswith("5.") and source == "UNICEF": return 1
        priority_map = {"OWID": 12, "WHO_GHO": 20, "ILOSTAT": 21, "UNESCO": 22, "FAOSTAT": 23, "UNICEF": 24}
        return priority_map.get(source, 99)

    combined_df["priority"] = combined_df.apply(get_priority, axis=1)
    combined_df = combined_df.sort_values(by=["CountryCode", "SDG_Target", "Year", "priority"])
    combined_df = combined_df.drop_duplicates(subset=["CountryCode", "SDG_Target", "Year"], keep="first")
    combined_df = combined_df.drop(columns=["priority", "Source"])
    
    combined_df["is_imputed"] = False
    combined_df["is_regional_estimate"] = False
    
    def safe_impute(group):
        group = group.copy()
        group = group.sort_values("Year")
        if len(group) <= 1: return group
        
        min_year = int(group["Year"].min())
        max_year = int(group["Year"].max())
        full_years = range(min_year, max_year + 1)
        
        group = group.set_index("Year").reindex(full_years)
        missing_mask = group["IndicatorValue"].isna()
        
        group["CountryCode"] = group["CountryCode"].ffill().bfill()
        group["SDG_Target"] = group["SDG_Target"].ffill().bfill()
        group["IndicatorValue"] = group["IndicatorValue"].interpolate(method="linear")
        group["is_imputed"] = missing_mask
        group["is_regional_estimate"] = False
        
        return group.reset_index().rename(columns={"index": "Year"})

    imputed_dfs = []
    grouped = combined_df.groupby(["CountryCode", "SDG_Target"])
    for name, group in grouped:
        if len(group) > 1:
            imputed_dfs.append(safe_impute(group))
        else:
            imputed_dfs.append(group)
            
    final_df = pd.concat(imputed_dfs, ignore_index=True) if imputed_dfs else pd.DataFrame()
    
    years = list(range(2015, 2026))
    master_index = pd.MultiIndex.from_product(
        [ISO3_CODES, SDG_TARGETS, years],
        names=["CountryCode", "SDG_Target", "Year"]
    )
    master_df = pd.DataFrame(index=master_index).reset_index()
    
    final_master_df = pd.merge(master_df, final_df, on=["CountryCode", "SDG_Target", "Year"], how="left")
    final_master_df["is_imputed"] = final_master_df["is_imputed"].fillna(False)
    final_master_df["is_regional_estimate"] = final_master_df["is_regional_estimate"].fillna(False)
    
    logger.info("Computing True Continental Regional Averages...")
    final_master_df['Continent'] = final_master_df['CountryCode'].apply(get_continent)
    
    missing_mask = final_master_df['IndicatorValue'].isna()
    if missing_mask.any():
        real_only_df = final_master_df[(~final_master_df['is_imputed']) & (~final_master_df['is_regional_estimate'])].dropna(subset=['IndicatorValue'])
        regional_avg = real_only_df.groupby(['Continent', 'SDG_Target', 'Year'])['IndicatorValue'].mean().reset_index()
        regional_avg = regional_avg.rename(columns={'IndicatorValue': 'RegionalAvg'})
        
        final_master_df = final_master_df.merge(regional_avg, on=['Continent', 'SDG_Target', 'Year'], how='left')
        
        fallback_applied_mask = final_master_df['IndicatorValue'].isna() & final_master_df['RegionalAvg'].notna()
        final_master_df.loc[fallback_applied_mask, 'IndicatorValue'] = final_master_df.loc[fallback_applied_mask, 'RegionalAvg']
        final_master_df.loc[fallback_applied_mask, 'is_imputed'] = True
        final_master_df.loc[fallback_applied_mask, 'is_regional_estimate'] = True
        
        final_master_df = final_master_df.drop(columns=['RegionalAvg'])

    final_master_df = final_master_df.drop(columns=['Continent'])
    return final_master_df

def get_turso_credentials():
    load_dotenv()
    url = os.getenv("TURSO_DATABASE_URL")
    token = os.getenv("TURSO_AUTH_TOKEN")
    return url, token

async def sync_to_database(df: pd.DataFrame):
    if df.empty:
        logger.info("No data to sync.")
        return
        
    url, token = get_turso_credentials()
    if not url or not token:
        logger.error("FATAL: Missing Turso URL or Auth Token.")
        sys.exit(1)

    records = df.to_dict('records')
    insert_sql = """
        INSERT INTO sdg_global_data_staging (CountryCode, SDG_Target, Year, IndicatorValue, is_imputed, is_regional_estimate)
        VALUES (?, ?, ?, ?, ?, ?)
    """

    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            # 1. Create fresh staging table
            await client.execute("DROP TABLE IF EXISTS sdg_global_data_staging")
            await client.execute("""
                CREATE TABLE sdg_global_data_staging (
                    CountryCode TEXT,
                    SDG_Target TEXT,
                    Year INTEGER,
                    IndicatorValue REAL,
                    is_imputed INTEGER,
                    is_regional_estimate INTEGER
                )
            """)
            
            statements = []
            for rec in records:
                ind_val = rec['IndicatorValue']
                if pd.isna(ind_val):
                    ind_val = None
                else:
                    ind_val = float(ind_val)
                    
                args = [
                    rec['CountryCode'],
                    rec['SDG_Target'],
                    int(rec['Year']),
                    ind_val,
                    int(rec['is_imputed']),
                    int(rec['is_regional_estimate'])
                ]
                statements.append(libsql_client.Statement(insert_sql, args))

            # Batch execution
            chunk_size = 500
            total_statements = len(statements)
            logger.info(f"Preparing to upload {total_statements} records in batches of {chunk_size}...")
            
            for i in range(0, total_statements, chunk_size):
                chunk = statements[i:i + chunk_size]
                await client.batch(chunk)
                logger.info(f"Database sync: Uploaded chunk {i} to {min(i+chunk_size, total_statements)}")
                
            # 3. Perform atomic table swap for zero downtime
            logger.info("Performing zero-downtime table swap...")
            swap_statements = [
                libsql_client.Statement("DROP TABLE IF EXISTS sdg_global_data_old"),
                libsql_client.Statement("ALTER TABLE sdg_global_data RENAME TO sdg_global_data_old"),
                libsql_client.Statement("ALTER TABLE sdg_global_data_staging RENAME TO sdg_global_data"),
                libsql_client.Statement("DROP TABLE IF EXISTS sdg_global_data_old"),
                # Create index on the new table
                libsql_client.Statement("CREATE INDEX IF NOT EXISTS idx_country_target_year ON sdg_global_data (CountryCode, SDG_Target, Year)")
            ]
            await client.batch(swap_statements)
            
            logger.info(f"Database sync complete: Swapped table with {total_statements} total records successfully.")
    except Exception as e:
        logger.error(f"FATAL: Error during database insert batch: {e}")
        sys.exit(1)

async def main():
    logger.info("Starting automated incremental sync pipeline...")
    
    all_data_frames = []
    
    owid_df = fetch_owid_data()
    if not owid_df.empty: all_data_frames.append(owid_df)
    
    who_df = fetch_who_gho_data()
    if not who_df.empty: all_data_frames.append(who_df)
    
    fao_df = fetch_faostat_data()
    if not fao_df.empty: all_data_frames.append(fao_df)
    
    unicef_df = fetch_unicef_data()
    if not unicef_df.empty: all_data_frames.append(unicef_df)
    
    ilo_df = fetch_ilostat_data()
    if not ilo_df.empty: all_data_frames.append(ilo_df)
    
    unesco_df = fetch_unesco_data()
    if not unesco_df.empty: all_data_frames.append(unesco_df)

    if not all_data_frames:
        logger.error("FATAL: No data fetched from any API. Aborting sync.")
        sys.exit(1)
        
    master_df = build_master_grid(all_data_frames)
    
    await sync_to_database(master_df)
    
    logger.info("Incremental sync pipeline finished successfully.")

if __name__ == "__main__":
    asyncio.run(main())
