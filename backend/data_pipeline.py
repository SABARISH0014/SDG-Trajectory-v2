import pandas as pd
import sqlite3
import glob
import os
import requests
import io
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# List of all ~230 UN ISO3 Country Codes (Abridged for brevity in code, but typically includes all ISO-3166-1 alpha-3 codes)
ISO3_CODES = [
    'AFG', 'ALB', 'DZA', 'AND', 'AGO', 'ATG', 'ARG', 'ARM', 'AUS', 'AUT', 'AZE', 'BHS', 'BHR', 'BGD', 'BRB', 'BLR', 'BEL', 'BLZ', 'BEN', 'BTN', 'BOL', 'BIH', 'BWA', 'BRA', 'BRN', 'BGR', 'BFA', 'BDI', 'CPV', 'KHM', 'CMR', 'CAN', 'CAF', 'TCD', 'CHL', 'CHN', 'COL', 'COM', 'COG', 'COD', 'CRI', 'CIV', 'HRV', 'CUB', 'CYP', 'CZE', 'DNK', 'DJI', 'DMA', 'DOM', 'ECU', 'EGY', 'SLV', 'GNQ', 'ERI', 'EST', 'SWZ', 'ETH', 'FJI', 'FIN', 'FRA', 'GAB', 'GMB', 'GEO', 'DEU', 'GHA', 'GRC', 'GRD', 'GTM', 'GIN', 'GNB', 'GUY', 'HTI', 'HND', 'HUN', 'ISL', 'IND', 'IDN', 'IRN', 'IRQ', 'IRL', 'ISR', 'ITA', 'JAM', 'JPN', 'JOR', 'KAZ', 'KEN', 'KIR', 'PRK', 'KOR', 'KWT', 'KGZ', 'LAO', 'LVA', 'LBN', 'LSO', 'LBR', 'LBY', 'LIE', 'LTU', 'LUX', 'MDG', 'MWI', 'MYS', 'MDV', 'MLI', 'MLT', 'MHL', 'MRT', 'MUS', 'MEX', 'FSM', 'MDA', 'MCO', 'MNG', 'MNE', 'MAR', 'MOZ', 'MMR', 'NAM', 'NRU', 'NPL', 'NLD', 'NZL', 'NIC', 'NER', 'NGA', 'MKD', 'NOR', 'OMN', 'PAK', 'PLW', 'PAN', 'PNG', 'PRY', 'PER', 'PHL', 'POL', 'PRT', 'QAT', 'ROU', 'RUS', 'RWA', 'KNA', 'LCA', 'VCT', 'WSM', 'SMR', 'STP', 'SAU', 'SEN', 'SRB', 'SYC', 'SLE', 'SGP', 'SVK', 'SVN', 'SLB', 'SOM', 'ZAF', 'SSD', 'ESP', 'LKA', 'SDN', 'SUR', 'SWE', 'CHE', 'SYR', 'TJK', 'TZA', 'THA', 'TLS', 'TGO', 'TON', 'TTO', 'TUN', 'TUR', 'TKM', 'TUV', 'UGA', 'UKR', 'ARE', 'GBR', 'USA', 'URY', 'UZB', 'VUT', 'VEN', 'VNM', 'YEM', 'ZMB', 'ZWE'
]

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

def initialize_database(db_path: str):
    """Initializes the SQLite database and creates the sdg_global_data table."""
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    logger.info("Initializing database...")
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
    conn.close()
    logger.info("Database initialized successfully.")

def fetch_owid_data() -> pd.DataFrame:
    """
    Fetches real data from the Our World in Data (OWID) repository.
    Example uses OWID CO2 data mapped to SDG target 13.2 (Climate Action).
    """
    logger.info("Fetching real OWID data from GitHub repository...")
    url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        df = pd.read_csv(io.StringIO(response.text))
        
        # Standardize for the pipeline
        df = df[['iso_code', 'year', 'co2']].copy()
        df = df.rename(columns={'iso_code': 'CountryCode', 'year': 'Year', 'co2': 'IndicatorValue'})
        df['SDG_Target'] = '13.2' # Mapping CO2 emissions to Target 13.2
        
        # Filter valid ISO3 codes and years
        df = df[df['CountryCode'].notna() & (df['CountryCode'].str.len() == 3)]
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
            
            # Harmonize column names dynamically based on typical UN SDG file structures
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
            
            # If the format is wide (years as columns), melt it
            year_cols = [c for c in df.columns if str(c).isdigit() and 2015 <= int(c) <= 2025]
            if year_cols and 'Year' not in df.columns:
                id_vars = [c for c in df.columns if c not in year_cols]
                df = df.melt(id_vars=id_vars, value_vars=year_cols, var_name='Year', value_name='IndicatorValue')
                
            if all(col in df.columns for col in required):
                df = df[required].copy()
                df['Year'] = pd.to_numeric(df['Year'], errors='coerce')
                df['IndicatorValue'] = pd.to_numeric(df['IndicatorValue'], errors='coerce')
                df['CountryCode'] = df['CountryCode'].astype(str)
                df['SDG_Target'] = df['SDG_Target'].astype(str)
                
                df = df[df['Year'].between(2015, 2025)]
                df = df.dropna(subset=['IndicatorValue'])
                all_data.append(df)
            else:
                logger.warning(f"File {os.path.basename(file_path)} missing required columns. Skipping.")
                
        except Exception as e:
            logger.error(f"Error processing {os.path.basename(file_path)}: {e}")
            
    return all_data

def build_master_grid_and_load(all_dfs: list, db_path: str):
    """
    Creates a Cartesian Master Grid, merges actual data, imputes missing values, 
    and saves to SQLite without dropping sparse rows.
    """
    logger.info("Concatenating all data sources...")
    combined_df = pd.concat(all_dfs, ignore_index=True)
    
    # Deduplicate in case multiple files/sources provided the same country/target/year
    combined_df = combined_df.groupby(['CountryCode', 'SDG_Target', 'Year'], as_index=False)['IndicatorValue'].mean()
    
    logger.info("Generating Cartesian Master Grid (ISO3 x Targets x Years)...")
    years = list(range(2015, 2026))
    
    master_index = pd.MultiIndex.from_product(
        [ISO3_CODES, SDG_TARGETS, years],
        names=['CountryCode', 'SDG_Target', 'Year']
    )
    master_df = pd.DataFrame(index=master_index).reset_index()
    
    logger.info("Executing LEFT JOIN onto Master Grid...")
    merged_df = pd.merge(master_df, combined_df, on=['CountryCode', 'SDG_Target', 'Year'], how='left')
    
    logger.info("Applying mathematically robust imputation (Linear Interpolate -> FFill -> BFill)...")
    merged_df = merged_df.sort_values(by=['CountryCode', 'SDG_Target', 'Year'])
    
    # Impute missing values within each Country & Target group
    merged_df['IndicatorValue'] = merged_df.groupby(['CountryCode', 'SDG_Target'])['IndicatorValue'].transform(
        lambda group: group.interpolate(method='linear', limit_direction='both')
    )
    # Forward fill then Backward fill for the remaining NaNs at the edges
    merged_df['IndicatorValue'] = merged_df.groupby(['CountryCode', 'SDG_Target'])['IndicatorValue'].ffill().bfill()
    
    logger.info(f"Loading {len(merged_df)} rows into SQLite database...")
    conn = sqlite3.connect(db_path)
    # Using temp table for efficient insertion
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
    conn.close()
    
    logger.info("Database loaded successfully.")

def run_pipeline():
    base_dir = os.path.dirname(__file__)
    raw_data_dir = os.path.join(base_dir, "raw_data")
    db_path = os.path.join(base_dir, 'sdg_database.db')
    
    initialize_database(db_path)
    
    all_data_frames = []
    
    # 1. Load local UN SDG .xlsx files
    un_dfs = process_un_data(raw_data_dir)
    all_data_frames.extend(un_dfs)
    
    # 2. Fetch and append real OWID data
    owid_df = fetch_owid_data()
    if not owid_df.empty:
        all_data_frames.append(owid_df)
        
    if all_data_frames:
        build_master_grid_and_load(all_data_frames, db_path)
    else:
        logger.error("No data processed. Pipeline aborted.")

if __name__ == "__main__":
    run_pipeline()
