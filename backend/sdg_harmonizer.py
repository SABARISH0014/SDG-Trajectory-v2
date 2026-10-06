import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Complete registry of all 17 SDG Goals targets that represent percentages (0% to 100%)
PERCENTAGE_TARGETS = {
    '1.1', '1.2', '1.3', '1.a', '1.b',
    '2.1', '2.2', '2.4', '2.a',
    '3.4', '3.5', '3.7', '3.a', '3.b',
    '4.1', '4.2', '4.3', '4.4', '4.6', '4.a', '4.c',
    '5.2', '5.3', '5.4', '5.5', '5.6', '5.a', '5.b', '5.c',
    '6.1', '6.2', '6.3', '6.4', '6.6', '6.b',
    '7.1', '7.2',
    '8.1', '8.2', '8.3', '8.5', '8.6', '8.7', '8.9', '8.10',
    '9.2', '9.3', '9.5', '9.b', '9.c',
    '10.1', '10.2', '10.3', '10.4', '10.5', '10.6', '10.a', '10.c',
    '11.1', '11.2', '11.7', '11.b',
    '12.3', '12.5', '12.c',
    '14.2', '14.4', '14.5', '14.7', '14.a', '14.c',
    '15.1', '15.2', '15.3', '15.6',
    '16.2', '16.3', '16.5', '16.6', '16.7', '16.8', '16.9',
    '17.1', '17.4', '17.6', '17.8', '17.11', '17.12', '17.15', '17.16'
}

# Standard Index scores bounded from 0 to 100
INDEX_100_TARGETS = {
    '1.4', '2.3', '2.5', '3.8', '3.d', '4.7', '5.1', '6.5', '8.b',
    '11.a', '11.c', '12.1', '12.7', '12.8', '13.1', '13.3', '14.1', '14.b',
    '15.4', '15.8', '15.9', '17.14', '17.18'
}

# Bounded decimal index scores (0.0 to 1.0)
INDEX_1_TARGETS = {
    '4.5', '15.5'
}

# Inherently bidirectional metrics that can legitimately have negative growth rates (e.g., GDP contraction)
BIDIRECTIONAL_GROWTH_TARGETS = {
    '8.1', '8.2', '10.1', '17.2', '17.3', '17.13'
}

def harmonize_time_series(df: pd.DataFrame, sdg_target: str) -> pd.DataFrame:
    """
    Sanitizes, scale-harmonizes, and purges mixed-scale series artifacts for any SDG target.
    Handles decimal ratios (0.0–1.0) vs percentages (0–100%) vs rogue count spikes.
    """
    if df.empty or 'IndicatorValue' not in df.columns:
        return df

    clean_df = df.dropna(subset=['IndicatorValue', 'Year']).copy()
    clean_df['IndicatorValue'] = pd.to_numeric(clean_df['IndicatorValue'], errors='coerce')
    clean_df = clean_df.dropna(subset=['IndicatorValue'])
    if clean_df.empty:
        return clean_df

    target_str = str(sdg_target).strip()
    is_pct = target_str in PERCENTAGE_TARGETS
    is_idx100 = target_str in INDEX_100_TARGETS
    is_idx1 = target_str in INDEX_1_TARGETS

    if is_pct or is_idx100:
        pct_under_2 = (clean_df['IndicatorValue'] <= 2.5).mean()
        pct_under_100 = (clean_df['IndicatorValue'] <= 100.0).mean()

        if pct_under_2 >= 0.5:
            # Stored as decimal ratio 0.0–1.0 (e.g. 0.25 -> 25%). Discard rogue points > 5.0 and scale by 100
            clean_df = clean_df[clean_df['IndicatorValue'] <= 5.0].copy()
            clean_df['IndicatorValue'] = clean_df['IndicatorValue'].apply(lambda v: min(100.0, max(0.0, float(v) * 100.0)))
        elif pct_under_100 >= 0.6:
            # Stored as percentage 0–100%. Discard rogue points > 100
            clean_df = clean_df[clean_df['IndicatorValue'].between(0.0, 100.0)].copy()
        else:
            # General non-negative bounds
            clean_df = clean_df[clean_df['IndicatorValue'] >= 0.0].copy()

    elif is_idx1:
        # Bounded index 0.0 to 1.0 (e.g. Red List Index, Gender Parity)
        clean_df = clean_df[clean_df['IndicatorValue'].between(0.0, 2.0)].copy()
        clean_df['IndicatorValue'] = clean_df['IndicatorValue'].apply(lambda v: max(0.0, min(1.0, float(v))))

    else:
        # Non-negative metrics (mortality, rates, counts, expenditures)
        if target_str not in BIDIRECTIONAL_GROWTH_TARGETS:
            clean_df = clean_df[clean_df['IndicatorValue'] >= 0.0].copy()

    return clean_df

def clamp_indicator_value(val: float, sdg_target: str) -> float:
    """
    Clamps a single predicted or baseline value to its physical domain bounds.
    """
    if val is None or np.isnan(val):
        return None
    val = float(val)
    target_str = str(sdg_target).strip()
    if target_str in PERCENTAGE_TARGETS or target_str in INDEX_100_TARGETS:
        return min(100.0, max(0.0, val))
    elif target_str in INDEX_1_TARGETS:
        return min(1.0, max(0.0, val))
    elif target_str not in BIDIRECTIONAL_GROWTH_TARGETS:
        return max(0.0, val)
    return val
