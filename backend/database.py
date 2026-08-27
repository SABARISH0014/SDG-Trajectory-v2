import os
import logging
import pandas as pd
import pycountry
from sqlalchemy import create_engine, Column, Integer, Float, String, Boolean, Index, text
from sqlalchemy.orm import sessionmaker, declarative_base
from functools import lru_cache

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

def get_db_path() -> str:
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sdg_database.db')

DB_PATH = get_db_path()
DB_URL = f"sqlite:///{DB_PATH}"

# SQLAlchemy Engine and Session
engine = create_engine(
    DB_URL, 
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SDGGlobalData(Base):
    __tablename__ = "sdg_global_data"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    CountryCode = Column(String(3), index=True, nullable=False)
    SDG_Target = Column(String(10), index=True, nullable=False)
    Year = Column(Integer, index=True, nullable=False)
    IndicatorValue = Column(Float, nullable=True)
    is_imputed = Column(Boolean, default=False)
    is_regional_estimate = Column(Boolean, default=False)

    __table_args__ = (
        Index('idx_country_target_year', 'CountryCode', 'SDG_Target', 'Year', unique=True),
    )

def init_db():
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)

@lru_cache(maxsize=2048)
def query_database(country_code: str, sdg_target: str) -> pd.DataFrame:
    db_country, db_target = translate_frontend_request(country_code, sdg_target)
    
    if not os.path.exists(DB_PATH):
        logger.error(f"Database not found at {DB_PATH}")
        return pd.DataFrame()
        
    try:
        query = text("""
        SELECT Year, IndicatorValue, is_imputed, is_regional_estimate
        FROM sdg_global_data 
        WHERE CountryCode = :country AND SDG_Target = :target
        ORDER BY Year ASC
        """)
        
        with engine.connect() as conn:
            df = pd.read_sql_query(query, conn, params={"country": db_country, "target": db_target})
        
        if not df.empty:
            df = df.where(pd.notnull(df), None) # Clean NULLs to None
            df['Year'] = df['Year'].astype(int)
            df['IndicatorValue'] = pd.to_numeric(df['IndicatorValue'], errors='coerce')
            
        return df
    except Exception as e:
        logger.error(f"Failed to query database: {e}")
        return pd.DataFrame()

@lru_cache(maxsize=2048)
def get_country_profile_data(country_code: str) -> pd.DataFrame:
    db_country, _ = translate_frontend_request(country_code, "")
    
    if not os.path.exists(DB_PATH):
        return pd.DataFrame()
        
    try:
        query = text("""
        SELECT SDG_Target, Year, IndicatorValue, is_imputed, is_regional_estimate
        FROM sdg_global_data 
        WHERE CountryCode = :country
        ORDER BY SDG_Target ASC, Year ASC
        """)
        
        with engine.connect() as conn:
            df = pd.read_sql_query(query, conn, params={"country": db_country})
        
        if not df.empty:
            df = df.where(pd.notnull(df), None) # Clean NULLs to None
            df['Year'] = df['Year'].astype(int)
            df['IndicatorValue'] = pd.to_numeric(df['IndicatorValue'], errors='coerce')
            
        return df
    except Exception as e:
        logger.error(f"Failed to query country profile data: {e}")
        return pd.DataFrame()

def clear_db_cache():
    """Clear the LRU cache when database updates occur."""
    query_database.cache_clear()
    get_country_profile_data.cache_clear()
