# 🌍 SDG Trajectory - Global Outcome Forecaster

Welcome to the **SDG Trajectory Forecaster**! This is a full-stack, AI-driven web application designed to track, forecast, and simulate global progress toward the United Nations' Sustainable Development Goals (SDGs) by 2030. 

By aggregating live data from six major global organizations and applying machine learning algorithms, this platform provides researchers, policymakers, and the public with a dynamic, interactive visualization of our world's trajectory.

---

## ✨ Key Features

1. **Interactive 3D Globe Visualization**
   - A highly performant, interactive 3D globe built with WebGL that visually maps out country-level SDG progress, allowing users to intuitively explore global datasets.

2. **AI-Driven 2030 Forecasting**
   - Utilizes Machine Learning to analyze historical data trends from 2015-present and project indicator values out to 2030.
   - Employs **Isolation Forests** for automated anomaly detection to clean erratic historical data points before forecasting.

3. **Dynamic Policy Simulator**
   - Allows users to simulate the impact of theoretical policy changes by applying "Impact Multipliers" (e.g., 20% faster growth in clean energy) to see how alternate timelines affect the 2030 goals.

4. **SDG Policy Copilot**
   - An integrated AI chat assistant (powered by OpenRouter & advanced LLMs like Gemma) that offers tailored, context-aware policy recommendations based on the specific country and SDG target being viewed.

5. **Automated ETL Data Pipeline**
   - Scrapes, cleans, and standardizes live data from:
     - World Health Organization (WHO)
     - World Bank / OWID
     - Food and Agriculture Organization (FAOSTAT)
     - UNICEF
     - International Labour Organization (ILOSTAT)
     - UNESCO
   - Handles missing data interpolation and regional average fallback calculations.

6. **Secure Admin Dashboard**
   - JWT-secured portal for system administrators.
   - **Algorithm Configurator**: Dynamically adjust the sensitivity (contamination ratio) of the AI Anomaly Detection model. Changes are saved instantly to a global Turso database and apply across all scaled instances.
   - **Data Sync Trigger**: Securely offloads the heavy incremental ETL data scraping pipeline to **GitHub Actions** via the GitHub REST API, ensuring the web server remains highly performant and never times out.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS & custom CSS for rich, glassmorphism-free modern aesthetics
- **Routing**: React Router DOM
- **Data Visualization**: Recharts (2D Charts)
- **3D Rendering**: React Globe.GL / Three.js
- **Icons**: Lucide React
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: Turso (libSQL/SQLite) - Edge Database
- **Machine Learning**: Scikit-Learn, Pandas, NumPy
- **Authentication**: PyJWT, Passlib (bcrypt)
- **Background Tasks**: GitHub Actions (CI/CD and Data Sync via REST API triggers)
- **Rate Limiting**: SlowAPI
- **Deployment**: Render

---

## 🚀 How It Was Developed

This project was built with a strong focus on **Human-Computer Interaction (HCI) principles** and highly scalable backend architectures.

1. **Database Migration**: The project initially relied on local JSON configuration files and SQLite databases. It was successfully migrated to **Turso**, an edge-hosted distributed database, enabling horizontal scaling without lock-contention issues.
2. **Scalable Data Sync**: The data ingestion pipeline (`incremental_sync.py`) downloads tens of thousands of records. To prevent blocking the FastAPI event loop or crashing free-tier web servers, the sync process was completely offloaded to a scheduled **GitHub Actions workflow**. The Admin Dashboard now simply dispatches a GitHub Action securely using a Personal Access Token.
3. **UI/UX Polish**: The interface was heavily refined to avoid cheap CSS tricks like heavy glassmorphism, instead relying on professional color theory (creams, slates, deep navys), distinct drop shadows (`shadow-xl`), smooth micro-interactions, and clear user-feedback states (e.g., handling `401 Unauthorized` and `409 Conflict` errors gracefully with UI loaders and alerts).

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- Turso CLI (or a Turso cloud account)
- GitHub Personal Access Token (for triggering syncs)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Activate virtual environment
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
TURSO_DATABASE_URL=libsql://your-turso-db-url
TURSO_AUTH_TOKEN=your_turso_token
OPENROUTER_API_KEY=your_openrouter_api_key
JWT_SECRET_KEY=a_very_secure_long_random_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$your_bcrypt_hash_here
GITHUB_PAT=your_github_personal_access_token
```

Run the backend:
```bash
python main.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory (if configuring custom URLs):
```env
VITE_API_BASE_URL=http://localhost:8000
```

Run the frontend:
```bash
npm run dev
```

---

## 🔐 Admin Access
To access the Admin Dashboard locally, navigate to `http://localhost:5173/admin` and use the credentials configured in your backend `.env` file.

---

## 📜 License
This project is dedicated to the public domain and the advancement of the UN Sustainable Development Goals.
