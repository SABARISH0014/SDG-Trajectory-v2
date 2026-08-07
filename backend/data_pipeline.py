import pandas as pd
from database import engine, SessionLocal
from sqlalchemy import text
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
    
    if len(raw_str) == 3 and pycountry.countries.get(alpha_3=raw_str):
        return raw_str
        
    try:
        results = pycountry.countries.search_fuzzy(raw_str)
        if results:
            return results[0].alpha_3
    except LookupError:
        pass
        
    return None

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
        df['Source'] = 'OWID'
        
        # Strict Normalization
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
                df['Source'] = 'UN_Excel'
                
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

def process_worldbank_data(raw_data_dir: str) -> pd.DataFrame:
    wb_file = os.path.join(raw_data_dir, 'worldbank_sdg.csv')
    if not os.path.exists(wb_file):
        logger.warning(f"WorldBank file not found: {wb_file}")
        return pd.DataFrame()
        
    logger.info(f"Reading WorldBank file: {os.path.basename(wb_file)}")
    try:
        df = pd.read_csv(wb_file)
        
        col_map = {}
        for col in df.columns:
            col_str = str(col).lower()
            if col_str in ['country code', 'countrycode', 'iso3', 'ref_area']: col_map[col] = 'CountryCode'
            elif col_str in ['indicator code', 'target', 'sdg', 'indicator']: col_map[col] = 'SDG_Target'
            elif col_str in ['year', 'time_period']: col_map[col] = 'Year'
            elif col_str in ['value', 'indicatorvalue']: col_map[col] = 'IndicatorValue'
            
        if col_map:
            df = df.rename(columns=col_map)
            
        year_cols = [c for c in df.columns if str(c).isdigit() and 2015 <= int(c) <= 2025]
        if year_cols and 'Year' not in df.columns:
            id_vars = [c for c in df.columns if c not in year_cols]
            df = df.melt(id_vars=id_vars, value_vars=year_cols, var_name='Year', value_name='IndicatorValue')
            
        required = ['CountryCode', 'SDG_Target', 'Year', 'IndicatorValue']
        if all(col in df.columns for col in required):
            df = df[required].copy()
            df['Year'] = pd.to_numeric(df['Year'], errors='coerce')
            df['IndicatorValue'] = pd.to_numeric(df['IndicatorValue'], errors='coerce')
            df['SDG_Target'] = df['SDG_Target'].astype(str)
            df['Source'] = 'WorldBank'
            
            unique_codes = df['CountryCode'].dropna().unique()
            code_map = {code: standardize_country_code(code) for code in unique_codes}
            df['CountryCode'] = df['CountryCode'].map(code_map)
            
            df = df[df['Year'].between(2015, 2025)]
            df = df.dropna(subset=['IndicatorValue', 'CountryCode'])
            return df
        else:
            logger.warning(f"WorldBank file missing required columns. Schema found: {df.columns.tolist()}")
            return pd.DataFrame()
            
    except Exception as e:
        logger.error(f"Error processing WorldBank data: {e}")
        return pd.DataFrame()

def build_master_grid_and_load(all_dfs: list):
    """
    Deduplicates hierarchically, imputes gaps safely (within actual coverage only),
    and atomically loads into SQLite via shadow swap.
    """
    logger.info("Concatenating all data sources...")
    combined_df = pd.concat(all_dfs, ignore_index=True)
    
    # Hierarchical Deduplication
    source_priority = {'UN_Excel': 1, 'WorldBank': 2, 'OWID': 3}
    combined_df['priority'] = combined_df['Source'].map(source_priority)
    combined_df = combined_df.sort_values(by=['CountryCode', 'SDG_Target', 'Year', 'priority'])
    
    logger.info(f"Records before deduplication: {len(combined_df)}")
    combined_df = combined_df.drop_duplicates(subset=['CountryCode', 'SDG_Target', 'Year'], keep='first')
    logger.info(f"Records after deduplication: {len(combined_df)}")
    
    # Drop priority and Source
    combined_df = combined_df.drop(columns=['priority', 'Source'])
    
    # Add provenance flag
    combined_df['is_imputed'] = False
    
    logger.info("Performing safe gap interpolation (no flat-tails)...")
    
    def safe_impute(group):
        group = group.sort_values('Year')
        min_year = int(group['Year'].min())
        max_year = int(group['Year'].max())
        
        # Only reindex to the actual span of this specific group
        full_years = range(min_year, max_year + 1)
        
        group = group.set_index('Year')
        group = group.reindex(full_years)
        
        # Identify missing spots that will be imputed
        missing_mask = group['IndicatorValue'].isna()
        
        group['CountryCode'] = group['CountryCode'].ffill().bfill()
        group['SDG_Target'] = group['SDG_Target'].ffill().bfill()
        
        # Linear interpolation
        group['IndicatorValue'] = group['IndicatorValue'].interpolate(method='linear')
        
        # Tag imputed
        group['is_imputed'] = missing_mask
        
        return group.reset_index().rename(columns={'index': 'Year'})

    # Apply imputation per group
    imputed_dfs = []
    grouped = combined_df.groupby(['CountryCode', 'SDG_Target'])
    for name, group in grouped:
        if len(group) > 1:
            imputed_dfs.append(safe_impute(group))
        else:
            imputed_dfs.append(group) # Can't interpolate a single point
            
    final_df = pd.concat(imputed_dfs, ignore_index=True)
    
    logger.info("Generating full Cartesian Master Grid to guarantee 100% target coverage...")
    years = list(range(2015, 2026))
    master_index = pd.MultiIndex.from_product(
        [ISO3_CODES, SDG_TARGETS, years],
        names=['CountryCode', 'SDG_Target', 'Year']
    )
    master_df = pd.DataFrame(index=master_index).reset_index()
    
    logger.info("Merging processed data into Master Grid (out-of-bounds dates will remain safely as NULL)...")
    final_master_df = pd.merge(master_df, final_df, on=['CountryCode', 'SDG_Target', 'Year'], how='left')
    
    # Fill NaN is_imputed flags with False (meaning it's not a synthetic bridge, it's just raw missing data)
    final_master_df['is_imputed'] = final_master_df['is_imputed'].fillna(False)
    
    logger.info(f"Final dataset size: {len(final_master_df)} (Imputed bridges: {final_df['is_imputed'].sum()} rows)")
    
    logger.info("Starting zero-downtime database load...")
    
    # Dump to staging table using SQLAlchemy
    try:
        final_master_df.to_sql('sdg_global_data_staging', con=engine, if_exists='replace', index=False)
        
        # Atomic swap
        with engine.begin() as conn:
            conn.execute(text("DROP TABLE IF EXISTS sdg_global_data_old;"))
            
            # Check if sdg_global_data exists
            table_exists = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='sdg_global_data';")).fetchone()
            if table_exists:
                conn.execute(text("ALTER TABLE sdg_global_data RENAME TO sdg_global_data_old;"))
                
            conn.execute(text("ALTER TABLE sdg_global_data_staging RENAME TO sdg_global_data;"))
            conn.execute(text("DROP TABLE IF EXISTS sdg_global_data_old;"))
            
            # Recreate indices on new table
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_country_target_year ON sdg_global_data (CountryCode, SDG_Target, Year);"))
            
        logger.info("Zero-downtime database load completed successfully.")
    except Exception as e:
        logger.error(f"Database load failed: {e}")
        raise

def run_pipeline():
    base_dir = os.path.dirname(__file__)
    raw_data_dir = os.path.join(base_dir, "raw_data")
    
    all_data_frames = []
    
    un_dfs = process_un_data(raw_data_dir)
    all_data_frames.extend(un_dfs)
    
    wb_df = process_worldbank_data(raw_data_dir)
    if not wb_df.empty:
        all_data_frames.append(wb_df)
    
    owid_df = fetch_owid_data()
    if not owid_df.empty:
        all_data_frames.append(owid_df)
        
    if all_data_frames:
        build_master_grid_and_load(all_data_frames)
    else:
        logger.error("No data processed. Pipeline aborted.")

if __name__ == "__main__":
    run_pipeline()
