import os
import requests
import pandas as pd
import numpy as np
import logging
import asyncio
import sys
from datetime import datetime
from sklearn.ensemble import IsolationForest
import pycountry
import libsql_client

# Import database connection logic
from database import get_turso_credentials

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Example UN SDG API URL
UN_SDG_API_URL = "https://unstats.un.org/sdgapi/v1/sdg/Indicator/Data"

def fetch_recent_data(years=2):
    """Fetch recent data from UN SDG API."""
    current_year = datetime.now().year
    target_years = [str(current_year - i) for i in range(years)]
    
    logger.info(f"Fetching SDG data for years: {target_years}")
    
    try:
        params = {
            'timePeriod': ','.join(target_years),
            'pageSize': 1000
        }
        response = requests.get(UN_SDG_API_URL, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        records = []
        for item in data.get('data', []):
            records.append({
                'CountryCode': item.get('geoAreaCode'),
                'SDG_Target': item.get('target'),
                'Year': int(item.get('timePeriod')),
                'IndicatorValue': float(item.get('value')) if item.get('value') else None,
                'is_imputed': False,
                'is_regional_estimate': False
            })
        return pd.DataFrame(records)
    except Exception as e:
        logger.error(f"Error fetching data from API: {e}")
        return pd.DataFrame(columns=['CountryCode', 'SDG_Target', 'Year', 'IndicatorValue', 'is_imputed', 'is_regional_estimate'])

def get_alpha3(code):
    """Convert numeric or other codes to ISO alpha-3."""
    if not code:
        return code
    raw_str = str(code).strip().upper()
    if raw_str.isdigit() and pycountry.countries.get(numeric=raw_str.zfill(3)):
        return pycountry.countries.get(numeric=raw_str.zfill(3)).alpha_3
    return code

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean data using linear interpolation and drop anomalies."""
    if df.empty:
        return df
        
    # Translate country codes
    df['CountryCode'] = df['CountryCode'].apply(get_alpha3)
        
    # Sort for interpolation
    df = df.sort_values(by=['CountryCode', 'SDG_Target', 'Year'])
    
    # Handle NaNs via linear interpolation per country and target
    df['IndicatorValue'] = df.groupby(['CountryCode', 'SDG_Target'])['IndicatorValue'].transform(
        lambda group: group.interpolate(method='linear', limit_direction='both')
    )
    
    # Drop rows that still have NaNs
    df = df.dropna(subset=['IndicatorValue'])
    
    if df.empty:
        return df

    # Use IsolationForest to drop anomalous spikes (ONLY if >= 4 samples)
    if len(df) >= 4:
        try:
            X = df[['IndicatorValue']].values
            iso_forest = IsolationForest(contamination=0.05, random_state=42)
            predictions = iso_forest.fit_predict(X)
            # Keep only inliers
            df = df[predictions == 1]
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")

    return df

async def sync_to_database(df: pd.DataFrame):
    """Insert data to Turso using INSERT OR IGNORE over async client.batch()"""
    if df.empty:
        logger.info("No data to sync.")
        return
        
    url, token = get_turso_credentials()
    if not url or not token:
        logger.error("FATAL: Missing Turso URL or Auth Token.")
        sys.exit(1)

    records = df.to_dict('records')
    insert_sql = """
        INSERT OR IGNORE INTO sdg_global_data 
        (CountryCode, SDG_Target, Year, IndicatorValue, is_imputed, is_regional_estimate)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    
    try:
        async with libsql_client.create_client(url, auth_token=token) as client:
            statements = []
            for record in records:
                statements.append(libsql_client.Statement(
                    insert_sql,
                    [
                        record['CountryCode'],
                        record['SDG_Target'],
                        record['Year'],
                        record['IndicatorValue'],
                        record['is_imputed'],
                        record['is_regional_estimate']
                    ]
                ))
            
            # Execute batch insert
            # Assuming libsql_client.batch takes a list of Statements
            await client.batch(statements)
            logger.info(f"Database sync complete: Uploaded {len(records)} records in batch.")
    except Exception as e:
        logger.error(f"FATAL: Error during database insert batch: {e}")
        sys.exit(1)

async def main():
    logger.info("Starting automated incremental sync...")
    raw_df = fetch_recent_data(years=2)
    logger.info(f"Fetched {len(raw_df)} records.")
    
    cleaned_df = clean_data(raw_df)
    logger.info(f"Cleaned data down to {len(cleaned_df)} records.")
    
    await sync_to_database(cleaned_df)
    logger.info("Incremental sync finished successfully.")

if __name__ == "__main__":
    asyncio.run(main())
