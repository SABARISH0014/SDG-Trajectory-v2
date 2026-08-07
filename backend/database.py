import os
import logging
import pandas as pd
from sqlalchemy import create_engine, Column, Integer, Float, String, Boolean, Index, text
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

COUNTRY_TRANSLATION_MAP = {
    '104': 'MMR',
    '356': 'IND',
    '840': 'USA',
    '826': 'GBR',
    'India': 'IND',
    'United States': 'USA',
    'UK': 'GBR',
    'Britain': 'GBR'
}

TARGET_TRANSLATION_MAP = {
    f"Goal{i}": f"{i}.1" for i in range(1, 18)
}

def translate_frontend_request(country_code: str, sdg_target: str) -> tuple[str, str]:
    db_country_code = COUNTRY_TRANSLATION_MAP.get(country_code, country_code).upper()
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

    __table_args__ = (
        Index('idx_country_target_year', 'CountryCode', 'SDG_Target', 'Year', unique=True),
    )

def init_db():
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)

def query_database(country_code: str, sdg_target: str) -> pd.DataFrame:
    db_country, db_target = translate_frontend_request(country_code, sdg_target)
    
    if not os.path.exists(DB_PATH):
        logger.error(f"Database not found at {DB_PATH}")
        return pd.DataFrame()
        
    try:
        query = text("""
        SELECT Year, IndicatorValue, is_imputed
        FROM sdg_global_data 
        WHERE CountryCode = :country AND SDG_Target = :target
        ORDER BY Year ASC
        """)
        
        with engine.connect() as conn:
            df = pd.read_sql_query(query, conn, params={"country": db_country, "target": db_target})
        
        if not df.empty:
            df['Year'] = df['Year'].astype(int)
            df['IndicatorValue'] = df['IndicatorValue'].astype(float)
            
        return df
    except Exception as e:
        logger.error(f"Failed to query database: {e}")
        return pd.DataFrame()


def get_country_profile_data(country_code: str) -> pd.DataFrame:
    db_country, _ = translate_frontend_request(country_code, "")
    
    if not os.path.exists(DB_PATH):
        return pd.DataFrame()
        
    try:
        query = text("""
        SELECT SDG_Target, Year, IndicatorValue, is_imputed
        FROM sdg_global_data 
        WHERE CountryCode = :country
        ORDER BY SDG_Target ASC, Year ASC
        """)
        
        with engine.connect() as conn:
            df = pd.read_sql_query(query, conn, params={"country": db_country})
        
        if not df.empty:
            df['Year'] = df['Year'].astype(int)
            df['IndicatorValue'] = df['IndicatorValue'].astype(float)
            
        return df
    except Exception as e:
        logger.error(f"Failed to query country profile data: {e}")
        return pd.DataFrame()
