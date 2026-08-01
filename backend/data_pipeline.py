import pandas as pd
import sqlite3
import glob
import os
import requests
import io
import logging
import pycountry

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Dynamically extract all valid UN ISO3 Country Codes using pycountry
ISO3_CODES = [country.alpha_3 for country in pycountry.countries]

# List of 169 SDG Targets
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
    """Uses pycountry to ensure strict ISO-3 validation or fuzzy matching."""
    if pd.isna(raw_code):
        return None
        
    raw_str = str(raw_code).strip().upper()
    
    # Fast path if it's already a valid ISO3
    if len(raw_str) == 3 and pycountry.countries.get(alpha_3=raw_str):
        return raw_str
        
    # Try fuzzy matching if it's a name or full string
    try:
        results = pycountry.countries.search_fuzzy(raw_str)
        if results:
            return results[0].alpha_3
    except LookupError:
        pass
        
    return None

def initialize_database(db_path: str):
    """Initializes the SQLite database and creates the sdg_global_data table safely."""
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    logger.info("Initializing database...")
    
    # Safe Context Manager Implementation
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("DROP TABLE IF EXISTS sdg_global_data")
        
        create_table_sql = """
        CREATE TABLE sdg_global_data (
            CountryCode TEXT,
            SDG_Target TEXT,
            Year INTEGER,
            IndicatorValue REAL,
            UNIQUE(CountryCode, SDG_Target, Year)
        )
        """
        cursor.execute(create_table_sql)
        conn.commit()
        
    logger.info("Database initialized successfully.")

def fetch_owid_data() -> pd.DataFrame:
    """Fetches real data from the Our World in Data (OWID) repository."""
    logger.info("Fetching real OWID data from GitHub repository...")
    url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        df = pd.read_csv(io.StringIO(response.text), low_memory=False)
        
        df = df[['iso_code', 'year', 'co2']].copy()
        df = df.rename(columns={'iso_code': 'CountryCode', 'year': 'Year', 'co2': 'IndicatorValue'})
        df['SDG_Target'] = '13.2'
        
        # Strict Normalization (Optimized)
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

def process_un_data(raw_data_dir: str) -> list[pd.DataFrame]:
    """Reads and parses all UN SDG .xlsx files from the raw_data directory."""
    all_data = []
    pattern = os.path.join(raw_data_dir, 'Goal*.xlsx')
    files = sorted(glob.glob(pattern))
    
    for file_path in files:
        logger.info(f"Reading UN file: {os.path.basename(file_path)}")
        try:
            df = pd.read_excel(file_path)
            
            col_map = {}
            for col in df.columns:
                col_str = str(col).lower()
                if 'target' in col_str: col_map[col] = 'SDG_Target'
                elif 'geoareacode' in col_str or 'countrycode' in col_str or 'iso3' in col_str: col_map[col] = 'CountryCode'
                elif 'timeperiod' in col_str or 'year' in col_str: col_map[col] = 'Year'
                elif 'value' in col_str: col_map[col] = 'IndicatorValue'
                
            if col_map:
                df = df.rename(columns=col_map)
                
            required = ['CountryCode', 'SDG_Target', 'Year', 'IndicatorValue']
            
            year_cols = [c for c in df.columns if str(c).isdigit() and 2015 <= int(c) <= 2025]
            if year_cols and 'Year' not in df.columns:
                id_vars = [c for c in df.columns if c not in year_cols]
                df = df.melt(id_vars=id_vars, value_vars=year_cols, var_name='Year', value_name='IndicatorValue')
                
            if all(col in df.columns for col in required):
                df = df[required].copy()
                df['Year'] = pd.to_numeric(df['Year'], errors='coerce')
                df['IndicatorValue'] = pd.to_numeric(df['IndicatorValue'], errors='coerce')
                df['SDG_Target'] = df['SDG_Target'].astype(str)
                
                # Strict Normalization (Optimized)
                unique_codes = df['CountryCode'].dropna().unique()
                code_map = {code: standardize_country_code(code) for code in unique_codes}
                df['CountryCode'] = df['CountryCode'].map(code_map)
                
                df = df[df['Year'].between(2015, 2025)]
                df = df.dropna(subset=['IndicatorValue', 'CountryCode'])
                all_data.append(df)
            else:
                logger.warning(f"File {os.path.basename(file_path)} missing required columns. Skipping.")
                
        except Exception as e:
            logger.error(f"Error processing {os.path.basename(file_path)}: {e}")
            
    return all_data

def build_master_grid_and_load(all_dfs: list, db_path: str):
    """
    Creates a Cartesian Master Grid, merges actual data, imputes missing values safely, 
    and saves to SQLite using context managers.
    """
    logger.info("Concatenating all data sources...")
    combined_df = pd.concat(all_dfs, ignore_index=True)
    
    # Deduplicate
    combined_df = combined_df.groupby(['CountryCode', 'SDG_Target', 'Year'], as_index=False)['IndicatorValue'].mean()
    
    logger.info("Generating Cartesian Master Grid...")
    years = list(range(2015, 2026))
    
    master_index = pd.MultiIndex.from_product(
        [ISO3_CODES, SDG_TARGETS, years],
        names=['CountryCode', 'SDG_Target', 'Year']
    )
    master_df = pd.DataFrame(index=master_index).reset_index()
    
    logger.info("Executing LEFT JOIN onto Master Grid...")
    merged_df = pd.merge(master_df, combined_df, on=['CountryCode', 'SDG_Target', 'Year'], how='left')
    
    logger.info("Applying constrained imputation (limit=2) to prevent over-projecting gaps...")
    merged_df = merged_df.sort_values(by=['CountryCode', 'SDG_Target', 'Year'])
    
    # Impute missing values with strict limits to avoid hallucinating data
    merged_df['IndicatorValue'] = merged_df.groupby(['CountryCode', 'SDG_Target'])['IndicatorValue'].transform(
        lambda group: group.interpolate(method='linear', limit=2, limit_direction='both')
    )
    merged_df['IndicatorValue'] = merged_df.groupby(['CountryCode', 'SDG_Target'])['IndicatorValue'].transform(
        lambda group: group.ffill(limit=2).bfill(limit=2)
    )
    
    logger.info(f"Loading {len(merged_df)} rows into SQLite database safely...")
    
    # Safe Context Manager Database Push
    with sqlite3.connect(db_path) as conn:
        merged_df.to_sql('temp_load_table', conn, if_exists='replace', index=False)
        
        insert_sql = """
        INSERT OR REPLACE INTO sdg_global_data (CountryCode, SDG_Target, Year, IndicatorValue)
        SELECT CountryCode, SDG_Target, Year, IndicatorValue FROM temp_load_table
        """
        cursor = conn.cursor()
        cursor.execute(insert_sql)
        conn.commit()
        cursor.execute("DROP TABLE temp_load_table")
        conn.commit()
    
    logger.info("Database loaded successfully.")

def run_pipeline():
    base_dir = os.path.dirname(__file__)
    raw_data_dir = os.path.join(base_dir, "raw_data")
    db_path = os.path.join(base_dir, 'sdg_database.db')
    
    initialize_database(db_path)
    
    all_data_frames = []
    
    un_dfs = process_un_data(raw_data_dir)
    all_data_frames.extend(un_dfs)
    
    owid_df = fetch_owid_data()
    if not owid_df.empty:
        all_data_frames.append(owid_df)
        
    if all_data_frames:
        build_master_grid_and_load(all_data_frames, db_path)
    else:
        logger.error("No data processed. Pipeline aborted.")

if __name__ == "__main__":
    run_pipeline()
