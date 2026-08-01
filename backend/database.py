import sqlite3
import pandas as pd
import os
import logging
from contextlib import closing

logger = logging.getLogger(__name__)

# Translation mapping to handle frontend human-readable requests vs database-native schemas
# In our database, we used ISO3 codes (e.g., 'IND'), but we add this layer for robustness 
# in case the frontend sends UN M49 numeric codes or full country names.
COUNTRY_TRANSLATION_MAP = {
    '104': 'MMR', # Myanmar (example)
    '356': 'IND',
    '840': 'USA',
    '826': 'GBR',
    'India': 'IND',
    'United States': 'USA',
    'UK': 'GBR',
    'Britain': 'GBR'
}

# Translating "GoalX" to specific targets.
# If frontend asks for "Goal1", we map it to '1.1' as a representative target for the goal,
# or we could return a list. For simplicity in prediction, we map to the primary target.
TARGET_TRANSLATION_MAP = {
    f"Goal{i}": f"{i}.1" for i in range(1, 18)
}

def translate_frontend_request(country_code: str, sdg_target: str) -> tuple[str, str]:
    """
    Translates human-readable frontend codes to database-native formats.
    """
    db_country_code = COUNTRY_TRANSLATION_MAP.get(country_code, country_code).upper()
    db_sdg_target = TARGET_TRANSLATION_MAP.get(sdg_target, sdg_target)
    
    return db_country_code, db_sdg_target

def get_db_path() -> str:
    return os.path.join(os.path.dirname(__file__), 'sdg_database.db')

def query_database(country_code: str, sdg_target: str) -> pd.DataFrame:
    """
    Connects to SQLite, applies the translation layer, and returns a Pandas DataFrame 
    of historical years and values for the specified country and target.
    """
    db_country, db_target = translate_frontend_request(country_code, sdg_target)
    db_path = get_db_path()
    
    if not os.path.exists(db_path):
        logger.error(f"Database not found at {db_path}")
        return pd.DataFrame()
        
    try:
        with closing(sqlite3.connect(db_path)) as conn:
            query = """
            SELECT Year, IndicatorValue 
            FROM sdg_global_data 
            WHERE CountryCode = ? AND SDG_Target = ?
            ORDER BY Year ASC
            """
            df = pd.read_sql_query(query, conn, params=(db_country, db_target))
        
        # Ensure correct types
        if not df.empty:
            df['Year'] = df['Year'].astype(int)
            df['IndicatorValue'] = df['IndicatorValue'].astype(float)
            
        return df
    except Exception as e:
        logger.error(f"Failed to query database: {e}")
        return pd.DataFrame()
