# 🌍 SDG Trajectory: 2030 Forecasting & Policy Simulator

![SDG Trajectory Banner](frontend/src/lib/SDG%20Goals.avif)

**SDG Trajectory** is an interactive, full-stack data visualization and forecasting platform designed to analyze global progress toward the United Nations' 17 Sustainable Development Goals (SDGs). By integrating real-world datasets, statistical modeling, and artificial intelligence, this platform empowers policymakers, researchers, and citizens to understand where we stand today and where we are heading by the 2030 deadline.

---

## ✨ Key Features

*   **📊 Statistical Trajectory Forecasting**: Projects historical UN and World Bank indicator data forward to 2030 using linear regression models. Evaluates whether a country is *On-track*, *At-risk*, or *Off-track*.
*   **🎛️ "What-If" Policy Simulator**: Dynamically adjust a "Policy Multiplier" slider (0.5x to 1.5x) to model how accelerated investments or systemic slowdowns would alter a country's 2030 outcomes.
*   **⚖️ Country Benchmarking**: Side-by-side comparative analysis of two nations, revealing current leaders, projected 2030 gaps, and AI-driven layman explanations of the disparities.
*   **🤖 SDG Policy Copilot**: A secure, AI-powered assistant (via OpenRouter integration) that provides contextual explanations, analyzes specific forecast data, and generates actionable policy recommendations.
*   **📄 Executive Dossier Export**: Instantly capture charts and data context, rendering them into a professional, heavily branded PDF report suitable for executive briefings.
*   **🌐 Interactive 3D Globe**: A WebGL-powered 3D globe visualization highlighting country selections and data availability.
*   **🌍 Multi-Language Support**: Fully integrated real-time translation for global accessibility.

---

## 🛠️ Technology Stack

This project is built using a modern decoupled architecture:

### Frontend (User Interface)
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS, PostCSS
*   **Data Visualization**: Recharts (SVG-based charting library)
*   **Icons & Assets**: Lucide React
*   **Routing**: React Router DOM
*   **Export Engine**: jsPDF, html2canvas

### Backend (Data & AI Services)
*   **Framework**: FastAPI (Python)
*   **Data Processing**: Pandas, NumPy, Scikit-learn (Linear Regression)
*   **AI Integration**: Httpx, OpenRouter API (Proxied securely through the backend)
*   **Server**: Uvicorn

---

## 🚀 Getting Started

To run the SDG Trajectory platform locally, you will need to start both the backend server and the frontend development server.

### Prerequisites
*   Node.js (v18+)
*   Python (3.9+)

### 1. Backend Setup
The backend handles the statistical data modeling and securely proxies requests to the AI Copilot.

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install required dependencies
pip install fastapi uvicorn pandas numpy scikit-learn httpx python-dotenv pydantic

# Create an environment file and add your OpenRouter API key
echo OPENROUTER_API_KEY=your_api_key_here > .env

# Start the FastAPI server
python main.py
```
*The backend server will run at `http://127.0.0.1:8000`.*

### 2. Frontend Setup
The frontend serves the interactive React application.

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*The application will be accessible at `http://localhost:5173`.*

---

## 📂 Project Structure

```text
SDG-Trajectory/
├── backend/                  # Python FastAPI Backend
│   ├── main.py               # API endpoints (Forecasts, Simulator, Copilot Proxy)
│   ├── sdg_data.csv          # Historical indicator dataset
│   └── models.py             # Pydantic schemas and ML logic
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components (GlobeView, CopilotDrawer, etc.)
│   │   ├── pages/            # Main application views (GoalPage, PolicySimulator, etc.)
│   │   ├── data/             # Static configurations (SDG content, color maps)
│   │   └── main.jsx          # React mount point & DOM patches
│   ├── index.html            # Entry point & Initial Splash Screen
│   ├── tailwind.config.js    # Tailwind theme configuration
│   └── vite.config.js        # Vite bundler configuration
└── README.md                 # Project documentation
```

---

## 🔒 Security Note
The frontend application does **not** store or expose any API keys. All AI Copilot interactions are securely routed through the FastAPI backend (`POST /api/copilot/chat`), ensuring credentials remain strictly server-side.

---

## 🎓 About
Developed as an academic prototype to bridge the gap between complex UN statistical datasets and accessible, policy-oriented decision making. Data utilized is synthesized from official United Nations SDG Indicators and World Bank Open Data.
