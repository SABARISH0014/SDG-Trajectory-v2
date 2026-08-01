# SDG Trajectory — Global Outcome Forecaster

> **An enterprise-grade academic prototype for predicting global progress toward the United Nations 2030 Sustainable Development Goals using historical data, machine learning, and AI-powered narrative generation.**

[![Python](https://img.shields.io/badge/Python-3.14-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://sqlite.org/)
[![Git LFS](https://img.shields.io/badge/Git_LFS-enabled-F64935)](https://git-lfs.com/)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Module 1 — Data Pipeline & Preprocessing](#module-1--data-pipeline--preprocessing-engine)
- [Module 2 — AI & Predictive Analytics Core](#module-2--ai--predictive-analytics-core)
- [Module 3 — Interactive SPA Dashboard](#module-3--interactive-spa-dashboard)
- [Project Structure](#project-structure)
- [Setup & Running Locally](#setup--running-locally)
- [API Reference](#api-reference)
- [QA & Bug Fixes](#qa--bug-fixes)
- [Git LFS](#git-lfs)
- [Roadmap](#roadmap)

---

## Project Overview

The SDG Trajectory Forecaster is a full-stack analytical tool that:

1. **Ingests** real-world data from the United Nations SDG Excel dataset and the Our World in Data (OWID) CO₂ repository.
2. **Processes** data through a robust ETL (Extract, Transform, Load) pipeline with outlier detection, safe imputation, and ISO-3 country code normalization.
3. **Forecasts** trajectories for all 169 UN SDG targets up to the year 2030 using a Scikit-learn Linear Regression model with polarity-aware classification.
4. **Narrates** forecasts in plain English using an asynchronous LLM call to OpenRouter.
5. **Visualizes** results in a high-quality, scrollable Single Page Application built in React, displaying a split solid/dashed line chart for historical vs. predicted data.

---

## Architecture

```
sdg-trajectory-project/
├── backend/         ← Python FastAPI server (Modules 1 & 2)
│   ├── data_pipeline.py
│   ├── database.py
│   ├── models.py
│   ├── main.py
│   └── sdg_database.db  (tracked via Git LFS)
└── frontend/        ← React + Vite SPA (Module 3)
    └── src/
        ├── App.jsx
        ├── lib/constants.js
        ├── components/ui/
        └── pages/
```

**Data flow:**

```
UN SDG Excel Files + OWID CSV
           │
           ▼
  data_pipeline.py (ETL)
           │
           ▼
  sdg_database.db (SQLite via Git LFS)
           │
           ▼
  database.py (contextlib.closing query layer)
           │
           ▼
  models.py (Isolation Forest + Linear Regression + LLM)
           │
           ▼
  main.py (FastAPI REST API — /api/predict, /api/simulate)
           │
           ▼
  App.jsx (React SPA — Recharts + Axios)
```

---

## Module 1 — Data Pipeline & Preprocessing Engine

**File:** `backend/data_pipeline.py`, `backend/database.py`

### What it does
- Reads all `Goal*.xlsx` files from the `raw_data/` directory using a dynamic column detection mapper that handles inconsistent UN header naming (e.g., `GeoAreaCode`, `CountryCode`, `ISO3`).
- Fetches real CO₂ emissions data from the OWID GitHub repository for SDG Target 13.2 via `requests`.
- **ISO-3 Country Code Normalization:** Uses the `pycountry` library with fuzzy matching to convert any incoming country identifier (numeric, name, or ISO-2) to a strict 3-character ISO-3 code. Invalid codes are safely dropped.
- **Cartesian Master Grid:** Generates a complete cross-product of all 250 countries × 169 SDG targets × 11 years (2015–2025) to guarantee a consistent schema before any data is loaded.
- **Safe Imputation:** Applies `linear` interpolation with `limit=2` in both directions and forward/backward fill with `limit=2`. This deliberately caps imputation to prevent fabricating data over large gaps.
- **SQLite Persistence:** Uses Python context managers (`with sqlite3.connect(...) as conn`) to safely load data via a staging table (`temp_load_table`) with an `INSERT OR REPLACE` strategy, preventing duplicates on repeated pipeline runs.

### Key design decisions

| Decision | Rationale |
|---|---|
| `limit=2` on interpolation | Prevents hallucinating data for countries that have 8+ years of missing values |
| `ISO3_CODES` from `pycountry` | Dynamically reflects the official UN member state list rather than a hardcoded enum |
| `UNIQUE(CountryCode, SDG_Target, Year)` DB constraint | Ensures idempotent pipeline runs — re-running the pipeline never corrupts existing data |
| `fetch_owid_data()` | Supplements sparse UN data with a reliable, version-controlled CO₂ dataset |

---

## Module 2 — AI & Predictive Analytics Core

**File:** `backend/models.py`, `backend/main.py`

### What it does

#### Anomaly Detection — `filter_outliers(df)`
- Applies Scikit-learn's `IsolationForest` (`contamination=0.1`) to detect and remove anomalous historical data points before regression training.
- **Critical safety rule:** The most recent year's data point is **never** removed, regardless of its anomaly score. This anchors the forecast correctly to the latest verified reality.
- Skips detection entirely if `len(df) < 4` (insufficient data to fit the forest).

#### Linear Regression Forecasting — `train_and_predict(df, sdg_target, policy_multiplier)`
- Trains a `LinearRegression` model on cleaned historical data and projects values for 2026–2030.
- **Zero-Floor Mathematical Constraint:** Every predicted value is clamped with `max(0.0, pred_val)`. This prevents physically impossible negative predictions for metrics like maternal mortality or CO₂.
- **Policy Simulation Mode:** Accepts an optional `policy_multiplier` float. A multiplier of `1.2` simulates a 20% acceleration in the rate of change, allowing what-if analysis.

#### Polarity-Aware Classification — `classify_status(baseline, projected, sdg_target)`
- Classifies trajectories as **On-track**, **At-risk**, or **Off-track** based on the ratio of projected-to-baseline value.
- **Polarity is target-aware.** A defined `NEGATIVE_POLARITY_TARGETS` list (`['1.1', '1.2', '2.1', '3.1', '3.2', '13.2']`) inverts the classification logic for indicators where a lower value means better progress (e.g., mortality rates, CO₂ emissions, poverty headcount).

| Target type | "On-track" condition |
|---|---|
| Positive polarity (e.g., electrification, education) | `projected > baseline × 1.05` |
| Negative polarity (e.g., mortality, CO₂ emissions) | `projected < baseline × 0.95` |

#### LLM Narrative Generation — `generate_narrative(stats)`
- Makes a fully **async** HTTP call to OpenRouter using `httpx.AsyncClient` with a 10-second timeout.
- Uses the free-tier model `google/gemma-4-26b-a4b-it:free`.
- Falls back to a pre-formatted template string if the API is unavailable, rate-limited, or times out — ensuring the dashboard never crashes during a demo.

#### FastAPI REST API — `main.py`
- **`GET /api/predict`** — Fetches historical data from SQLite and returns ML predictions + status + AI narrative.
- **`GET /api/simulate`** — Same as predict but accepts a `policy_impact_multiplier` query parameter.
- CORS configured with `allow_origins=["*"]` for local development.
- Both endpoints are fully `async` and do not block the ASGI event loop.

#### Database Connection Safety — `database.py`
- The `query_database` function uses `contextlib.closing(sqlite3.connect(db_path))` as the outermost context manager.
- This guarantees the underlying OS file handle is closed even when `pd.read_sql_query` throws an unexpected exception — preventing the `WinError 32` file-lock issue that would crash the server on repeated failures.

---

## Module 3 — Interactive SPA Dashboard

**File:** `frontend/src/App.jsx`, `frontend/src/lib/constants.js`

### What it does
A fully scrollable, single-page React application with no client-side routing library. Navigation is handled via smooth-scroll anchors.

### Page Sections

| Section | ID | Description |
|---|---|---|
| **Hero** | `#home` | Dark premium landing area with abstract glow background, project title, and CTA buttons |
| **About** | `#about` | 3-card feature grid highlighting Global Coverage, Predictive Analytics, AI Insights |
| **History** | `#history` | UN 2030 Agenda context — explains the origin and purpose of the SDG framework |
| **Dashboard** | `#dashboard` | Full interactive data tracker with country/target dropdowns and Recharts visualization |

### Control Panel
- **Country dropdown:** Populated with all 250+ ISO-3 countries from `pycountry` via the auto-generated `constants.js`.
- **SDG Target dropdown:** Covers all 169 official UN Sustainable Development Goal targets.
- **Generate Forecast button:** Disabled with a spinner during loading, preventing double-submit race conditions.

### Data Visualization (Recharts)
- **Solid blue line (`actualValue`)** — Historical UN data from 2015 to the latest available year.
- **Dashed purple line (`predictedValue`, `strokeDasharray="5 5"`)** — AI-generated forecast from 2026 to 2030.
- The two lines are bridged at the last historical year to create a continuous visual trajectory.

### Resilience & Fallbacks
- If the FastAPI backend is unreachable (e.g., during a standalone demo), the Axios `catch` block automatically loads a pre-built `MOCK_DATA` payload, so the UI always renders correctly.
- `Skeleton` components display during the 2-second loading state for a polished UX.

### Navigation
- Sticky `backdrop-blur` glassmorphism header.
- All nav links call `element.scrollIntoView({ behavior: 'smooth' })` for native smooth scrolling with no dependencies.

---

## Project Structure

```
sdg-trajectory-project/
│
├── .gitattributes              ← Git LFS tracking rules (*.db)
├── .gitignore                  ← Excludes node_modules, venv, .env, raw_data, __pycache__
├── README.md                   ← This file
│
├── backend/
│   ├── data_pipeline.py        ← Module 1: ETL, normalization, imputation, SQLite load
│   ├── database.py             ← Module 1: Query layer with contextlib.closing safety
│   ├── models.py               ← Module 2: Isolation Forest, LinearRegression, LLM narrative
│   ├── main.py                 ← Module 2: FastAPI app, /api/predict, /api/simulate
│   ├── requirements.txt        ← Python dependencies
│   ├── sdg_database.db         ← 120MB SQLite DB (tracked via Git LFS)
│   ├── forecasting.py          ← (Reserved for Module 4 advanced forecasting)
│   ├── tests/
│   │   └── test_backend.py     ← Pytest integration tests
│   └── test_scripts/
│       └── test_openrouter.py  ← Standalone LLM connectivity test
│
└── frontend/
    ├── index.html
    ├── vite.config.js          ← Vite dev server config
    ├── tailwind.config.js      ← Tailwind CSS config
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx            ← React entry point
        ├── App.jsx             ← Main SPA — all four scroll sections
        ├── index.css           ← Global Tailwind directives + custom utilities
        ├── lib/
        │   ├── utils.js        ← shadcn cn() helper
        │   └── constants.js    ← Auto-generated: all 250 countries + 169 SDG targets
        ├── components/ui/
        │   ├── Card.jsx        ← shadcn-style Card component
        │   ├── Button.jsx      ← shadcn-style Button component
        │   ├── Badge.jsx       ← Status badge (success/warning/destructive variants)
        │   └── Skeleton.jsx    ← Loading skeleton component
        └── pages/
            ├── PolicySimulator.jsx   ← Module 4 scaffold (in progress)
            ├── CountryComparison.jsx ← Module 4 scaffold (in progress)
            └── AdminPanel.jsx        ← Module 5 scaffold (in progress)
```

---

## Setup & Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git LFS installed (`git lfs install`)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# (Optional) Run the data pipeline to rebuild the database
# WARNING: This fetches live data and may take 15-30 minutes
python data_pipeline.py

# Start the FastAPI development server
python main.py
# API is now available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

> The app works without a key — it will use the built-in fallback narrative template.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
# App is now available at http://localhost:5173
```

---

## API Reference

### `GET /api/predict`

Fetches historical data from the database and returns a complete ML forecast.

**Query Parameters:**

| Parameter | Type | Example | Description |
|---|---|---|---|
| `country_code` | string | `IND` | ISO-3 country code |
| `sdg_target` | string | `13.2` | SDG target (e.g. `3.1`, `7.1`) |

**Response:**

```json
{
  "country_code": "IND",
  "sdg_target": "13.2",
  "historical_data": [
    { "Year": 2015, "IndicatorValue": 2.44 },
    ...
  ],
  "predictions": [
    { "Year": 2026, "PredictedValue": 2.71 },
    ...
  ],
  "status": "Off-track",
  "policy_simulated_projection": null,
  "ai_narrative": "The trajectory for India's CO₂ emissions is classified as Off-track..."
}
```

---

### `GET /api/simulate`

Same as `/api/predict` but accepts a policy multiplier to simulate accelerated or decelerated scenarios.

**Additional Parameter:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `policy_impact_multiplier` | float | `1.0` | Multiplier on rate of change. `1.2` = 20% acceleration |

---

## QA & Bug Fixes

The following critical bugs were identified during a structured QA audit and resolved:

| # | Bug | Severity | Fix Applied |
|---|---|---|---|
| 1 | LinearRegression could predict **negative** mortality/emission values | 🔴 Critical | `pred_val = max(0.0, float(pred_val))` injected in forecast loop |
| 2 | Classification logic assumed **growth = On-track** for ALL targets, including CO₂ and mortality | 🔴 Critical | `NEGATIVE_POLARITY_TARGETS` list with inverted polarity logic |
| 3 | `sqlite3` connection leak on `pd.read_sql_query` exception | 🟡 High | Replaced bare `conn = sqlite3.connect()` with `contextlib.closing()` |

---

## Git LFS

The compiled `sdg_database.db` SQLite file (~120 MB) is tracked using **Git Large File Storage** to avoid bloating the repository history.

The `.gitattributes` file contains:
```
*.db filter=lfs diff=lfs merge=lfs -text
backend/raw_data/* filter=lfs diff=lfs merge=lfs -text
```

To clone this repo and pull LFS objects:
```bash
git lfs install
git clone https://github.com/SABARISH0014/SDG-Trajectory.git
git lfs pull
```

---

## Roadmap

| Module | Status | Description |
|---|---|---|
| Module 1 — Data Pipeline | ✅ Complete | ETL, normalization, SQLite persistence |
| Module 2 — AI Core | ✅ Complete | Forecasting, classification, async LLM |
| Module 3 — SPA Dashboard | ✅ Complete | Scrollable React UI, live data, all 169 targets |
| Module 4 — Policy Simulator | 🔄 In Progress | What-if sliders, country benchmarking |
| Module 4 — Country Comparison | 🔄 In Progress | Side-by-side dual-country analysis |
| Module 5 — Admin Panel | 🔄 Scaffolded | Data sync hub, algorithm configurator |
| Backend — SQLAlchemy ORM | 📋 Planned | Migrate from raw sqlite3 to SQLAlchemy |

---

## Academic Context

This project was built as part of an academic curriculum to demonstrate:

- **Data Engineering:** Robust ETL pipelines handling real-world dirty data from UN sources.
- **Machine Learning:** Practical application of regression modeling and unsupervised anomaly detection.
- **Software Architecture:** Clean separation of concerns across data, ML, API, and UI layers.
- **Full-Stack Development:** A complete production-style system from database to interactive frontend.

---

*© 2026 SDG Trajectory – Global Outcome Forecaster. Academic Prototype.*
