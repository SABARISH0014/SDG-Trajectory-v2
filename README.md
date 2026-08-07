# SDG Trajectory - Global Outcome Forecaster

An advanced, full-stack web application designed to track, forecast, and simulate the world's progress toward the United Nations' 17 Sustainable Development Goals (SDGs) by 2030. 

This platform leverages statistical modeling and AI-generated narratives to provide actionable insights into whether countries are **On-track**, **At-risk**, or **Off-track** for their specific goals, giving policymakers, researchers, and citizens a powerful tool for global accountability.

---

## 🌟 Key Features

### 1. Deep Dive Explorer
Select any supported country and a specific SDG target to generate a live AI forecast. The system runs a linear regression model on real historical data to predict the 2030 outcome and automatically generates an AI narrative explaining the trajectory.

### 2. "What-If" Policy Simulator
Interactive scenario planning! Users can apply a "Policy Impact Multiplier" to a country's trajectory. By simulating increased (or decreased) effort, you can visually see how policy changes alter the future on an interactive Recharts line graph.

### 3. Comprehensive Country Profiles (New!)
A holistic view of a nation's progress. Navigating to a Country Profile fetches data for all 17 SDGs simultaneously, rendering a beautiful grid that instantly highlights which goals are succeeding and which are failing, complete with 2030 statistical projections.

### 4. Educational "About SDGs" Module (New!)
An interactive reference guide detailing the history, purpose, and official targets of all 17 SDGs. Users can generate and download beautiful PDF summaries for offline reading or presentations using the integrated `jsPDF` engine.

### 5. Robust Mathematical Data Pipeline
- **Sparse Data Bypass:** The system strictly separates real historical data from imputed (fake) data. If a goal lacks sufficient real data points, the system safely halts the regression and flags it as "Insufficient Data" rather than hallucinating a trend.
- **Outlier Filtering & Flatline Detection:** Safe anomaly detection handles extreme spikes, while a low-variance mathematical check accurately processes flatlining indicators.
- **Logical Constraints:** Mathematical guardrails ensure that indicators cannot fall below absolute zero.

### 6. Country Comparison Engine
Select multiple countries to compare their historical progress and future trajectories on a single, unified chart. Easily identify global leaders and those falling behind on specific targets.

---

## 💻 Tech Stack

### Frontend
- **React (Vite):** Lightning-fast build tool and frontend framework.
- **Tailwind CSS:** Utility-first CSS framework for beautiful, responsive design.
- **Recharts:** Composable charting library for rendering live trajectory graphs.
- **React Router DOM:** Seamless client-side routing.
- **Lucide-React:** Crisp, modern SVG icons.
- **jsPDF:** Client-side PDF generation for downloading SDG reports.

### Backend
- **FastAPI (Python):** High-performance, asynchronous web framework for building the API.
- **SQLite:** Lightweight, disk-based database storing the global SDG historical data.
- **Pandas & NumPy:** For robust data manipulation, outlier filtering, and array processing.
- **Scikit-Learn:** Core engine powering the Linear Regression forecasting models.
- **Google Gemini API:** Analyzes statistical projections to generate human-readable, contextual narratives.
- **JWT Authentication:** Secures the backend Admin dashboard.

---

## ⚙️ App Internals

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
- Dynamic native smooth scrolling (`scrollIntoView`) mixed with `React Router` for standalone pages like Country Profiles.

---

## 📁 Project Structure

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
│   ├── main.py                 ← Module 2: FastAPI app, /api/predict, /api/simulate, /api/country
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
        ├── App.jsx             ← Application structure 
        ├── index.css           ← Global Tailwind directives + custom utilities
        ├── lib/
        │   ├── utils.js        ← shadcn cn() helper
        │   └── constants.js    ← Auto-generated: all 250 countries + 169 SDG targets
        ├── components/
        │   ├── AboutSDGs.jsx   ← SDG Educational Reference & PDF generator
        │   └── ui/             ← shadcn-style UI components (Card, Button, Badge, Skeleton)
        └── pages/
            ├── MainSite.jsx          ← Main SPA — Dashboard, History, Simulator
            ├── CountryDataPage.jsx   ← Dynamic 17-Goal Country Profile Page
            ├── PolicySimulator.jsx   ← What-if Simulation component
            ├── CountryComparison.jsx ← Cross-country tracking
            └── AdminPanel.jsx        ← JWT secured Admin dashboard
```

---

## 🚀 Setup & Running Locally

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
GEMINI_API_KEY=your-gemini-key-here
```
> The app defaults to Gemini via Google API. If unreachable, it uses a built-in fallback narrative template.

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

## 🌐 API Reference

### `GET /api/predict`
Fetches historical data from the database and returns a complete ML forecast.

**Query Parameters:**
| Parameter | Type | Example | Description |
|---|---|---|---|
| `country_code` | string | `IND` | ISO-3 country code |
| `sdg_target` | string | `13.2` | SDG target (e.g. `3.1`, `7.1`) |

### `GET /api/simulate`
Same as `/api/predict` but accepts a policy multiplier to simulate accelerated or decelerated scenarios.

**Additional Parameter:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| `policy_impact_multiplier` | float | `1.0` | Multiplier on rate of change. `1.2` = 20% acceleration |

### `GET /api/country/{countryCode}/profile`
Fetches the current trajectory status for all 17 SDGs simultaneously for a unified profile view.

---

## 🐛 QA & Bug Fixes

The following critical bugs were identified during a structured QA audit and resolved:

| # | Bug | Severity | Fix Applied |
|---|---|---|---|
| 1 | LinearRegression could predict **negative** mortality/emission values | 🔴 Critical | `pred_val = max(0.0, float(pred_val))` injected in forecast loop |
| 2 | Classification logic assumed **growth = On-track** for ALL targets, including CO₂ and mortality | 🔴 Critical | `NEGATIVE_POLARITY_TARGETS` list with inverted polarity logic |
| 3 | `sqlite3` connection leak on `pd.read_sql_query` exception | 🟡 High | Replaced bare `conn = sqlite3.connect()` with `contextlib.closing()` / SQLAlchemy engine |
| 4 | "Insufficient Data" triggered regressions on imputed data | 🔴 Critical | Added `is_imputed` flag directly to data pipeline and bypass logic |
| 5 | Flatline (Zero-variance) data crashed UI layout & predictions | 🟡 High | Added a specific math variance bypass `< 1e-8` in backend core |

---

## 📦 Git LFS

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

## 🔮 Roadmap / Future Enhancements

| Feature | Status | Description |
|---|---|---|
| Data Pipeline | ✅ Complete | ETL, normalization, SQLite persistence, imputation handling |
| AI Core | ✅ Complete | Forecasting, classification, sync/async LLM pipelines |
| SPA Dashboard | ✅ Complete | Scrollable React UI, live data, interactive charts |
| Country Profiles | ✅ Complete | 17-Goal unified grid with automatic data validation |
| Policy Simulator | ✅ Complete | What-if sliders and visual simulation |
| Global Rollup View | 📋 Planned | 3D interactive globe/choropleth map |
| Advanced Forecasting | 📋 Planned | ARIMA/LSTMs instead of basic Linear Regression |

---

## 🎓 Academic Context

This project was built as part of an academic curriculum to demonstrate:

- **Data Engineering:** Robust ETL pipelines handling real-world dirty data from UN sources.
- **Machine Learning:** Practical application of regression modeling, unsupervised anomaly detection, and data sparsity checks.
- **Software Architecture:** Clean separation of concerns across data, ML, API, and UI layers.
- **Full-Stack Development:** A complete production-style system from database to interactive frontend.

---

*© 2026 SDG Trajectory – Global Outcome Forecaster. Academic Prototype.*
