import pandas as pd
import sqlite3
import glob
import os
import re

def initialize_database(db_path: str):
    """
    Connects to the database and performs a hard reset.
    Creates a new sdg_global_data table with a strict UNIQUE constraint
    to act as a duplicate detection method.
    """
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Performing hard database reset...")
    cursor.execute("DROP TABLE IF EXISTS sdg_global_data")
    
    # Create the table with UNIQUE constraint
    create_table_sql = """
    CREATE TABLE sdg_global_data (
        CountryCode TEXT,
        CountryName TEXT,
        Year INTEGER,
        IndicatorValue REAL,
        SDG_Target TEXT,
        Source TEXT,
        UNIQUE(CountryCode, Year, SDG_Target, Source)
    )
    """
    cursor.execute(create_table_sql)
    conn.commit()
    conn.close()
    print("New sdg_global_data table created successfully.")


def clean_and_harmonize_data(df: pd.DataFrame, source_name: str) -> pd.DataFrame:
    """
    Standardizes data into strict schema, handles 'melt' logic if years are columns,
    normalizes country identities, drops duplicates in-memory, and interpolates missing values.
    """
    if source_name == 'UN':
        # Check if years are columns (e.g. '2015', '2016')
        year_cols = [col for col in df.columns if str(col).isdigit()]
        if year_cols:
            id_vars = [col for col in df.columns if col not in year_cols]
            df = df.melt(id_vars=id_vars, value_vars=year_cols, var_name='Year', value_name='IndicatorValue')
            
        # Standardize UN columns
        df = df.rename(columns={
            'GeoAreaCode': 'CountryCode', 
            'GeoAreaName': 'CountryName',
            'TimePeriod': 'Year', 
            'Value': 'IndicatorValue',
            'Target': 'SDG_Target',
            'Country': 'CountryName'
        })
        if 'CountryCode' not in df.columns and 'CountryName' in df.columns:
            df['CountryCode'] = df['CountryName'].str[:3].str.upper()
            
    elif source_name == 'WorldBank':
        # Standardize World Bank columns
        df = df.rename(columns={
            'iso_code': 'CountryCode',
            'country': 'CountryName',
            'year': 'Year',
            'value': 'IndicatorValue',
            'target': 'SDG_Target'
        })

    # Set Source
    df['Source'] = source_name
    
    # Standardize to strict format
    required_cols = ['CountryCode', 'CountryName', 'Year', 'IndicatorValue', 'SDG_Target', 'Source']
    for col in required_cols:
        if col not in df.columns:
            df[col] = None
            
    df = df[required_cols].copy()

    # Normalize country codes and names
    country_mapping = {'US': 'USA', 'USA': 'USA', 'UK': 'GBR', 'GBR': 'GBR', 'IND': 'IND'}
    name_mapping = {
        'United States': 'United States', 'USA': 'United States', 
        'United Kingdom': 'United Kingdom', 'Britain': 'United Kingdom', 'GBR': 'United Kingdom',
        'India': 'India', 'IND': 'India'
    }
    df['CountryCode'] = df['CountryCode'].map(country_mapping).fillna(df['CountryCode']).astype(str)
    df['CountryName'] = df['CountryName'].map(name_mapping).fillna(df['CountryName']).astype(str)

    # Cast Data Types
    df['Year'] = pd.to_numeric(df['Year'], errors='coerce').fillna(0).astype(int)
    df['SDG_Target'] = df['SDG_Target'].astype(str)
    df['IndicatorValue'] = pd.to_numeric(df['IndicatorValue'], errors='coerce').astype('float32')

    # Memory Duplicate Detection BEFORE DB Insertion
    df = df.drop_duplicates(subset=['CountryCode', 'Year', 'SDG_Target', 'Source'])

    # Handle missing NaN values via mathematical interpolation
    df = df.sort_values(by=['CountryCode', 'SDG_Target', 'Year'])
    df['IndicatorValue'] = df.groupby(['CountryCode', 'SDG_Target'])['IndicatorValue'].transform(
        lambda group: group.interpolate(method='linear', limit_direction='both')
    )
    df['IndicatorValue'] = df.groupby(['CountryCode', 'SDG_Target'])['IndicatorValue'].bfill().ffill()

    return df


def safe_db_load(df: pd.DataFrame, db_path: str):
    """
    Writes the cleaned DataFrame to the SQLite database safely.
    Uses a temporary table and INSERT OR IGNORE to respect the UNIQUE constraint
    without crashing pandas.
    """
    conn = sqlite3.connect(db_path)
    # Write to a temporary table
    temp_table = 'temp_load_table'
    df.to_sql(temp_table, conn, if_exists='replace', index=False)
    
    # Insert or ignore into the final table
    insert_sql = f"""
    INSERT OR IGNORE INTO sdg_global_data (CountryCode, CountryName, Year, IndicatorValue, SDG_Target, Source)
    SELECT CountryCode, CountryName, Year, IndicatorValue, SDG_Target, Source FROM {temp_table}
    """
    cursor = conn.cursor()
    cursor.execute(insert_sql)
    conn.commit()
    
    # Drop temp table
    cursor.execute(f"DROP TABLE {temp_table}")
    conn.commit()
    conn.close()


def extract_goal_number(filename: str) -> int:
    """Extracts the number from GoalX.xlsx for correct sequential sorting."""
    match = re.search(r'Goal(\d+)', filename)
    return int(match.group(1)) if match else 0


def process_un_files(raw_data_dir: str, db_path: str):
    """Processes UN Excel files sequentially."""
    pattern = os.path.join(raw_data_dir, 'Goal*.xlsx')
    files = glob.glob(pattern)
    
    # Custom lambda key to sort exactly: Goal1, Goal2, ... Goal17
    files = sorted(files, key=lambda x: extract_goal_number(os.path.basename(x)))
    
    if not files:
        print("No UN Excel files found.")
        return

    for file_path in files:
        print(f"Processing UN file: {os.path.basename(file_path)}...")
        try:
            # We use a memory efficient usecols to prevent MemoryError
            def usecols_func(col):
                return col in ['Target', 'GeoAreaCode', 'GeoAreaName', 'TimePeriod', 'Value', 'Country', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']
            
            df = pd.read_excel(file_path, usecols=usecols_func)
            cleaned_df = clean_and_harmonize_data(df, source_name='UN')
            safe_db_load(cleaned_df, db_path)
            print(f" -> Successfully loaded {os.path.basename(file_path)}.")
        except Exception as e:
            print(f" -> Failed to process {os.path.basename(file_path)}: {e}")


def process_worldbank_file(raw_data_dir: str, db_path: str):
    """Processes the World Bank CSV file."""
    file_path = os.path.join(raw_data_dir, 'worldbank_sdg.csv')
    if not os.path.exists(file_path):
        print(f"World Bank file not found at {file_path}. Skipping.")
        return
        
    print(f"Processing World Bank file: {os.path.basename(file_path)}...")
    try:
        # For massive CSV files, we process in chunks to be memory-safe
        chunks = pd.read_csv(file_path, chunksize=50000, low_memory=False)
        for i, chunk in enumerate(chunks):
            cleaned_chunk = clean_and_harmonize_data(chunk, source_name='WorldBank')
            safe_db_load(cleaned_chunk, db_path)
            print(f" -> Successfully loaded World Bank chunk {i+1}.")
    except Exception as e:
        print(f" -> Failed to process World Bank data: {e}")


if __name__ == "__main__":
    print("Starting finalized Module 1: Data Pipeline & Preprocessing Engine...")
    
    RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "raw_data")
    DB_FILE = os.path.join(os.path.dirname(__file__), 'sdg_database.db')
    
    # 1. Hard Database Reset
    initialize_database(DB_FILE)
    
    # 2. Process Data Sources
    process_un_files(RAW_DATA_DIR, DB_FILE)
    process_worldbank_file(RAW_DATA_DIR, DB_FILE)
    
    print("\nData Pipeline execution fully complete.")
