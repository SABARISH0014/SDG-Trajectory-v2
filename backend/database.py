import os
import logging
import pandas as pd
import pycountry
import time
import libsql_client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Dynamically generate TARGET_TRANSLATION_MAP for all 17 goals
TARGET_TRANSLATION_MAP = {
    f"Goal{i}": f"{i}.1" for i in range(1, 18)
}

def translate_frontend_request(country_code: str, sdg_target: str) -> tuple[str, str]:
    db_country_code = country_code
    if country_code:
        raw_str = str(country_code).strip().upper()
        # Direct alpha-3 match
        if len(raw_str) == 3 and pycountry.countries.get(alpha_3=raw_str):
            db_country_code = raw_str
        # Direct alpha-2 match
        elif len(raw_str) == 2 and pycountry.countries.get(alpha_2=raw_str):
            db_country_code = pycountry.countries.get(alpha_2=raw_str).alpha_3
        # Direct numeric match
        elif raw_str.isdigit() and pycountry.countries.get(numeric=raw_str.zfill(3)):
            db_country_code = pycountry.countries.get(numeric=raw_str.zfill(3)).alpha_3
        else:
            # Fuzzy match
            try:
                results = pycountry.countries.search_fuzzy(raw_str)
                if results:
                    db_country_code = results[0].alpha_3
            except LookupError:
                db_country_code = raw_str

    db_sdg_target = TARGET_TRANSLATION_MAP.get(sdg_target, sdg_target)
    return db_country_code, db_sdg_target

def get_turso_credentials():
    url = os.environ.get("TURSO_DATABASE_URL", "")
    token = os.environ.get("TURSO_AUTH_TOKEN", "")
    if url.startswith("libsql://"):
        url = url.replace("libsql://", "https://")
    elif url.startswith("wss://"):
        url = url.replace("wss://", "https://")
    return url, token

_ASYNC_CACHE = {}
CACHE_TTL = 300

def _check_cache(cache_key: str):
    if cache_key in _ASYNC_CACHE:
        entry = _ASYNC_CACHE[cache_key]
        if time.time() - entry['timestamp'] < CACHE_TTL:
            return entry['data'].copy()
        else:
            del _ASYNC_CACHE[cache_key]
    return None

def _set_cache(cache_key: str, data: pd.DataFrame):
    _ASYNC_CACHE[cache_key] = {
        'timestamp': time.time(),
        'data': data.copy() if not data.empty else data
    }

async def query_database(country_code: str, sdg_target: str) -> pd.DataFrame:
    db_country, db_target = translate_frontend_request(country_code, sdg_target)
    
    cache_key = f"query_{db_country}_{db_target}"
    cached_df = _check_cache(cache_key)
    if cached_df is not None:
        return cached_df
    
    url, token = get_turso_credentials()
    if not url or not token:
        logger.error("Missing Turso URL or Auth Token.")
        return pd.DataFrame()

    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            sql = """
                SELECT Year, IndicatorValue, is_imputed, is_regional_estimate
                FROM sdg_global_data 
                WHERE CountryCode = ? AND SDG_Target = ?
                ORDER BY Year ASC
            """
            rs = await client.execute(sql, [db_country, db_target])
            
            if not rs.rows:
                df = pd.DataFrame()
            else:
                records = []
                for row in rs.rows:
                    records.append({
                        'Year': row[0],
                        'IndicatorValue': row[1],
                        'is_imputed': row[2],
                        'is_regional_estimate': row[3]
                    })
                df = pd.DataFrame(records)
                
                df = df.where(pd.notnull(df), None)
                df['Year'] = df['Year'].astype(int)
                df['IndicatorValue'] = pd.to_numeric(df['IndicatorValue'], errors='coerce')
            
            _set_cache(cache_key, df)
            return df
    except Exception as e:
        logger.error(f"Failed to query database asynchronously: {e}")
        return pd.DataFrame()

async def get_country_profile_data(country_code: str) -> pd.DataFrame:
    db_country, _ = translate_frontend_request(country_code, "")
    
    cache_key = f"profile_{db_country}"
    cached_df = _check_cache(cache_key)
    if cached_df is not None:
        return cached_df
    
    url, token = get_turso_credentials()
    if not url or not token:
        logger.error("Missing Turso URL or Auth Token.")
        return pd.DataFrame()

    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            sql = """
                SELECT SDG_Target, Year, IndicatorValue, is_imputed, is_regional_estimate
                FROM sdg_global_data 
                WHERE CountryCode = ?
                ORDER BY SDG_Target ASC, Year ASC
            """
            rs = await client.execute(sql, [db_country])
            
            if not rs.rows:
                df = pd.DataFrame()
            else:
                records = []
                for row in rs.rows:
                    records.append({
                        'SDG_Target': row[0],
                        'Year': row[1],
                        'IndicatorValue': row[2],
                        'is_imputed': row[3],
                        'is_regional_estimate': row[4]
                    })
                df = pd.DataFrame(records)
                
                df = df.where(pd.notnull(df), None)
                df['Year'] = df['Year'].astype(int)
                df['IndicatorValue'] = pd.to_numeric(df['IndicatorValue'], errors='coerce')
            
            _set_cache(cache_key, df)
            return df
    except Exception as e:
        logger.error(f"Failed to query country profile data asynchronously: {e}")
        return pd.DataFrame()

def clear_db_cache():
    """Clear the dictionary TTL cache when database updates occur."""
    global _ASYNC_CACHE
    _ASYNC_CACHE = {}
