import os
import logging
import pandas as pd
import pycountry
import time
from datetime import datetime, timezone
from collections import deque
import libsql_client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# In-memory fast audit buffer (capped at 200 events)
_AUDIT_LOGS_BUFFER = deque(maxlen=200)


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
        ttl = entry.get('ttl', CACHE_TTL)
        if time.time() - entry['timestamp'] < ttl:
            data = entry['data']
            if isinstance(data, pd.DataFrame):
                return data.copy()
            return data
        else:
            del _ASYNC_CACHE[cache_key]
    return None

def _set_cache(cache_key: str, data, ttl: int = CACHE_TTL):
    if isinstance(data, pd.DataFrame):
        stored_data = data.copy() if not data.empty else data
    else:
        stored_data = data
    _ASYNC_CACHE[cache_key] = {
        'timestamp': time.time(),
        'ttl': ttl,
        'data': stored_data
    }

PERCENTAGE_TARGETS = {
    '1.1', '1.2', '1.3', '2.1', '2.2', '4.1', '4.2', '4.3', '4.4', '4.6', 
    '5.2', '5.3', '5.5', '6.1', '6.2', '7.1', '7.2', '8.3', '8.5', '8.6', 
    '8.7', '9.2', '9.3', '9.c', '10.2', '10.4', '11.1', '11.2', '11.6', '16.9'
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
                
                # Sanitize percentage targets: exclude out-of-range count artifacts (>100 or <0)
                if db_target in PERCENTAGE_TARGETS:
                    df = df[(df['IndicatorValue'].isna()) | (df['IndicatorValue'].between(0.0, 100.0))].copy()
            
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

async def get_goal_status_data(sdg_target: str) -> dict:
    db_target = TARGET_TRANSLATION_MAP.get(sdg_target, sdg_target)
    cache_key = f"goal_status_{db_target}"
    cached_data = _check_cache(cache_key)
    if cached_data is not None:
        return cached_data

    url, token = get_turso_credentials()
    if not url or not token:
        logger.error("Missing Turso URL or Auth Token.")
        return {}

    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            sql = """
                SELECT CountryCode, Year, IndicatorValue, is_imputed, is_regional_estimate
                FROM sdg_global_data 
                WHERE SDG_Target = ?
                ORDER BY CountryCode ASC, Year ASC
            """
            rs = await client.execute(sql, [db_target])
            if not rs.rows:
                return {}

            records = []
            for row in rs.rows:
                records.append({
                    'CountryCode': row[0],
                    'Year': row[1],
                    'IndicatorValue': row[2],
                    'is_imputed': row[3],
                    'is_regional_estimate': row[4]
                })
            df = pd.DataFrame(records)
            df['Year'] = pd.to_numeric(df['Year'], errors='coerce')
            df['IndicatorValue'] = pd.to_numeric(df['IndicatorValue'], errors='coerce')

            countries_map = {}
            summary = {
                "total_countries": 0,
                "on_track": 0,
                "at_risk": 0,
                "off_track": 0,
                "insufficient_data": 0
            }

            from forecasting import calculate_core_trajectory

            for country_code, c_df in df.groupby('CountryCode'):
                stats = calculate_core_trajectory(c_df, sdg_target=db_target, contamination_val=0.0)
                status = stats.get("status", "Unknown")
                
                normalized_status = status
                if status in ["On-track", "On Track"]:
                    normalized_status = "On-track"
                    summary["on_track"] += 1
                elif status in ["At-risk", "At Risk"]:
                    normalized_status = "At-risk"
                    summary["at_risk"] += 1
                elif status in ["Off-track", "Off Track"]:
                    normalized_status = "Off-track"
                    summary["off_track"] += 1
                else:
                    normalized_status = "Insufficient Data"
                    summary["insufficient_data"] += 1

                latest_year = None
                latest_val = None
                valid_rows = c_df.dropna(subset=['IndicatorValue']).sort_values('Year')
                if not valid_rows.empty:
                    latest_year = int(valid_rows['Year'].iloc[-1])
                    latest_val = float(valid_rows['IndicatorValue'].iloc[-1])

                baseline = stats.get("baseline_value")
                if baseline is None:
                    baseline = latest_val

                countries_map[str(country_code)] = {
                    "country_code": str(country_code),
                    "status": normalized_status,
                    "baseline_year": latest_year,
                    "baseline_value": baseline,
                    "projected_value_2030": stats.get("projected_value_2030")
                }

            summary["total_countries"] = len(countries_map)

            result = {
                "sdg_target": db_target,
                "countries": countries_map,
                "summary": summary
            }

            _set_cache(cache_key, result, ttl=600)
            return result
    except Exception as e:
        logger.error(f"Failed to compute goal status data: {e}")
        return {}

def clear_db_cache() -> int:
    """Clear the dictionary TTL cache when database updates occur and return count of cleared entries."""
    global _ASYNC_CACHE
    count = len(_ASYNC_CACHE)
    _ASYNC_CACHE = {}
    return count

def get_cache_size() -> int:
    """Get the current count of active cache entries."""
    return len(_ASYNC_CACHE)

async def get_database_stats() -> dict:
    """Query Turso database for summary telemetry and active record metrics."""
    url, token = get_turso_credentials()
    if not url or not token:
        return {
            "turso_status": "offline",
            "total_records": 0,
            "total_countries": 0,
            "total_targets": 0,
            "cache_entries": get_cache_size()
        }
    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            rs_total = await client.execute("SELECT COUNT(*) FROM sdg_global_data")
            total_records = rs_total.rows[0][0] if rs_total.rows else 0
            
            rs_countries = await client.execute("SELECT COUNT(DISTINCT CountryCode) FROM sdg_global_data")
            total_countries = rs_countries.rows[0][0] if rs_countries.rows else 0
            
            rs_targets = await client.execute("SELECT COUNT(DISTINCT SDG_Target) FROM sdg_global_data")
            total_targets = rs_targets.rows[0][0] if rs_targets.rows else 0
            
            return {
                "turso_status": "online",
                "total_records": int(total_records),
                "total_countries": int(total_countries),
                "total_targets": int(total_targets),
                "cache_entries": get_cache_size()
            }
    except Exception as e:
        logger.error(f"Failed to query database stats: {e}")
        return {
            "turso_status": "offline",
            "error": str(e),
            "total_records": 0,
            "total_countries": 0,
            "total_targets": 0,
            "cache_entries": get_cache_size()
        }

_system_config_initialized = False

async def init_system_config():
    global _system_config_initialized
    if _system_config_initialized:
        return
    url, token = get_turso_credentials()
    if not url or not token:
        return
    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            await client.execute('''
                CREATE TABLE IF NOT EXISTS system_config (
                    config_key TEXT PRIMARY KEY,
                    config_value REAL
                )
            ''')
            # Initialize with default if empty
            rs = await client.execute("SELECT COUNT(*) FROM system_config WHERE config_key = 'contamination'")
            if rs.rows and rs.rows[0][0] == 0:
                await client.execute("INSERT INTO system_config (config_key, config_value) VALUES ('contamination', 0.1)")
            _system_config_initialized = True
    except Exception as e:
        logger.error(f"Failed to initialize system_config table: {e}")

async def get_system_config(key: str, default_value: float) -> float:
    if not _system_config_initialized:
        await init_system_config()
    url, token = get_turso_credentials()
    if not url or not token:
        return default_value
    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            rs = await client.execute("SELECT config_value FROM system_config WHERE config_key = ?", [key])
            if rs.rows and rs.rows[0][0] is not None:
                return float(rs.rows[0][0])
            return default_value
    except Exception as e:
        logger.error(f"Failed to get system config ({key}): {e}")
        return default_value

async def set_system_config(key: str, value: float):
    if not _system_config_initialized:
        await init_system_config()
    url, token = get_turso_credentials()
    if not url or not token:
        return
    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            await client.execute('''
                INSERT INTO system_config (config_key, config_value)
                VALUES (?, ?)
                ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value
            ''', [key, float(value)])
    except Exception as e:
        logger.error(f"Failed to set system config ({key}): {e}")

async def get_system_config_str(key: str, default_value: str) -> str:
    if not _system_config_initialized:
        await init_system_config()
    url, token = get_turso_credentials()
    if not url or not token:
        return default_value
    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            rs = await client.execute("SELECT config_value FROM system_config WHERE config_key = ?", [key])
            if rs.rows and rs.rows[0][0] is not None:
                return str(rs.rows[0][0])
            return default_value
    except Exception as e:
        logger.error(f"Failed to get system config str ({key}): {e}")
        return default_value

async def set_system_config_str(key: str, value: str):
    if not _system_config_initialized:
        await init_system_config()
    url, token = get_turso_credentials()
    if not url or not token:
        return
    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            await client.execute('''
                INSERT INTO system_config (config_key, config_value)
                VALUES (?, ?)
                ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value
            ''', [key, str(value)])
    except Exception as e:
        logger.error(f"Failed to set system config str ({key}): {e}")

async def upsert_indicator_record(country_code: str, sdg_target: str, year: int, indicator_value: float, is_imputed: int = 0) -> bool:
    """Insert or update a specific historical indicator record in Turso, invalidating the query cache."""
    db_country, db_target = translate_frontend_request(country_code, sdg_target)
    url, token = get_turso_credentials()
    if not url or not token:
        raise ValueError("Missing Turso database credentials.")
    
    async with libsql_client.create_client(url, auth_token=token) as client:
        rs = await client.execute(
            "SELECT COUNT(*) FROM sdg_global_data WHERE CountryCode = ? AND SDG_Target = ? AND Year = ?",
            [db_country, db_target, int(year)]
        )
        exists = rs.rows and rs.rows[0][0] > 0
        if exists:
            await client.execute(
                "UPDATE sdg_global_data SET IndicatorValue = ?, is_imputed = ? WHERE CountryCode = ? AND SDG_Target = ? AND Year = ?",
                [float(indicator_value), int(is_imputed), db_country, db_target, int(year)]
            )
        else:
            await client.execute(
                "INSERT INTO sdg_global_data (CountryCode, SDG_Target, Year, IndicatorValue, is_imputed, is_regional_estimate) VALUES (?, ?, ?, ?, ?, 0)",
                [db_country, db_target, int(year), float(indicator_value), int(is_imputed)]
            )
        clear_db_cache()
        return True

async def delete_indicator_record(country_code: str, sdg_target: str, year: int) -> bool:
    """Delete a single indicator data point from Turso and purge the query cache."""
    db_country, db_target = translate_frontend_request(country_code, sdg_target)
    url, token = get_turso_credentials()
    if not url or not token:
        raise ValueError("Missing Turso database credentials.")
    
    async with libsql_client.create_client(url, auth_token=token) as client:
        await client.execute(
            "DELETE FROM sdg_global_data WHERE CountryCode = ? AND SDG_Target = ? AND Year = ?",
            [db_country, db_target, int(year)]
        )
        clear_db_cache()
        return True

async def log_admin_action(action_type: str, description: str, actor: str = "admin", status: str = "SUCCESS"):
    """Log administrative actions into in-memory buffer and Turso audit trail."""
    timestamp = datetime.now(timezone.utc).isoformat()
    entry = {
        "timestamp": timestamp,
        "action_type": action_type,
        "description": description,
        "actor": actor,
        "status": status
    }
    _AUDIT_LOGS_BUFFER.appendleft(entry)
    
    url, token = get_turso_credentials()
    if url and token:
        try:
            async with libsql_client.create_client(url, auth_token=token) as client:
                await client.execute('''
                    CREATE TABLE IF NOT EXISTS system_audit_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        action_type TEXT NOT NULL,
                        description TEXT NOT NULL,
                        actor TEXT NOT NULL,
                        status TEXT NOT NULL
                    )
                ''')
                await client.execute('''
                    INSERT INTO system_audit_logs (timestamp, action_type, description, actor, status)
                    VALUES (?, ?, ?, ?, ?)
                ''', [timestamp, action_type, description, actor, status])
        except Exception as e:
            logger.debug(f"Audit log persistence to Turso skipped: {e}")

async def get_admin_audit_logs(limit: int = 50) -> list[dict]:
    """Retrieve the most recent admin audit logs."""
    url, token = get_turso_credentials()
    if url and token:
        try:
            async with libsql_client.create_client(url, auth_token=token) as client:
                rs = await client.execute(
                    "SELECT timestamp, action_type, description, actor, status FROM system_audit_logs ORDER BY id DESC LIMIT ?",
                    [limit]
                )
                if rs.rows:
                    return [
                        {
                            "timestamp": str(row[0]),
                            "action_type": str(row[1]),
                            "description": str(row[2]),
                            "actor": str(row[3]),
                            "status": str(row[4])
                        }
                        for row in rs.rows
                    ]
        except Exception as e:
            logger.debug(f"Fallback to in-memory audit logs: {e}")
    
    return list(_AUDIT_LOGS_BUFFER)[:limit]

async def clear_admin_audit_logs() -> bool:
    """Clear all admin audit logs from memory and Turso."""
    _AUDIT_LOGS_BUFFER.clear()
    url, token = get_turso_credentials()
    if url and token:
        try:
            async with libsql_client.create_client(url, auth_token=token) as client:
                await client.execute("DELETE FROM system_audit_logs")
        except Exception as e:
            logger.debug(f"Failed to clear Turso audit logs table: {e}")
    return True

