import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Globe, LineChart as LineChartIcon, Sparkles, Download, FileSpreadsheet, ArrowDownCircle, BookOpen, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import PolicySimulator from './PolicySimulator';
import CountryComparison from './CountryComparison';
import AboutSDGs from '../components/AboutSDGs';
import { Link, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Mock Data Fallback
const MOCK_DATA = {
  status: "On-track",
  ai_narrative: "The trajectory is currently classified as On-track, moving from a baseline of 15.20 to a projected 24.80 by 2030. Strategic interventions may be necessary to ensure optimal target achievement.",
  chart_data: [
    { Year: 2015, actualValue: 15.20, predictedValue: null },
    { Year: 2016, actualValue: 15.80, predictedValue: null },
    { Year: 2017, actualValue: 16.10, predictedValue: null },
    { Year: 2018, actualValue: 16.90, predictedValue: null },
    { Year: 2019, actualValue: 17.50, predictedValue: null },
    { Year: 2020, actualValue: 18.20, predictedValue: null },
    { Year: 2021, actualValue: 18.90, predictedValue: null },
    { Year: 2022, actualValue: 19.50, predictedValue: null },
    { Year: 2023, actualValue: 20.10, predictedValue: null },
    { Year: 2024, actualValue: 20.80, predictedValue: null },
    { Year: 2025, actualValue: 21.50, predictedValue: 21.50 }, // overlap point
    { Year: 2026, actualValue: null, predictedValue: 22.10 },
    { Year: 2027, actualValue: null, predictedValue: 22.80 },
    { Year: 2028, actualValue: null, predictedValue: 23.50 },
    { Year: 2029, actualValue: null, predictedValue: 24.10 },
    { Year: 2030, actualValue: null, predictedValue: 24.80 }
  ]
};

import { COUNTRIES, TARGETS } from '../lib/constants';
import GlobeView from '../components/GlobeView';

export default function MainSite() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [globeMarkers, setGlobeMarkers] = useState([]);
  
  useEffect(() => {
    // Fetch globe markers
    const fetchMarkers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/globe/markers');
        setGlobeMarkers(response.data);
      } catch (error) {
        console.error("Failed to fetch globe markers:", error);
      }
    };
    fetchMarkers();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveTab(entry.target.id);
        }
      });
    }, { threshold: 0.3 });

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, []);
  
  const [selectedCountry, setSelectedCountry] = useState('IND');
  const [selectedTarget, setSelectedTarget] = useState('13.2');
  
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const chartRef = useRef(null);

  const handleGenerate = async () => {
    setLoading(true);
    setDashboardData(null);

    // Artificial 2-second delay to simulate AI processing overhead for the UI
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await axios.get(`http://localhost:8000/api/predict`, {
        params: { country_code: selectedCountry, sdg_target: selectedTarget }
      });
      
      const { historical_data, predictions, status, ai_narrative } = response.data;
      
      // Format data for Recharts (split into actual and predicted for styling)
      const chartData = [];
      
      historical_data.forEach(d => {
        chartData.push({ Year: d.Year, actualValue: d.IndicatorValue, predictedValue: null });
      });

      if (historical_data.length > 0 && predictions.length > 0) {
        // Link the last actual with the first prediction to make the line continuous
        const lastActual = historical_data[historical_data.length - 1];
        chartData[chartData.length - 1].predictedValue = lastActual.IndicatorValue;
      }
      
      predictions.forEach(p => {
        chartData.push({ Year: p.Year, actualValue: null, predictedValue: p.PredictedValue });
      });

      setDashboardData({ status, ai_narrative, chart_data: chartData });
      
    } catch (error) {
      if (!error.response || error.response.status === 503) {
        console.warn("Backend unavailable, using rich mock fallback.", error);
        setDashboardData(MOCK_DATA);
      } else {
        console.error("Backend request failed:", error);
        setDashboardData({
            error: true,
            status: "Error",
            ai_narrative: `Backend error: ${error.response?.status} - ${error.response?.data?.detail || error.message}. Please try again later.`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (status) => {
    if (!status) return "default";
    const s = status.toLowerCase();
    if (s.includes('track')) return "success";
    if (s.includes('risk')) return "warning";
    if (s.includes('off')) return "destructive";
    return "default";
  };

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getSDGContext = (targetCode) => {
    const contexts = {
      '1.1': "Eradicate extreme poverty for all people everywhere, currently measured as people living on less than $1.25 a day.",
      '3.1': "Reduce the global maternal mortality ratio to less than 70 per 100,000 live births.",
      '7.1': "Ensure universal access to affordable, reliable and modern energy services.",
      '13.2': "Integrate climate change measures into national policies, strategies and planning."
    };
    return contexts[targetCode] || `This indicator measures the progress of the selected country against SDG Target ${targetCode}. The historical baseline traces back to 2015, the inception year of the SDGs.`;
  };

  const handleExportCSV = () => {
    if (!dashboardData || !dashboardData.chart_data) return;
    const headers = ['Year', 'ActualValue', 'PredictedValue'];
    const csvRows = [headers.join(',')];
    
    dashboardData.chart_data.forEach(row => {
      csvRows.push(`${row.Year},${row.actualValue || ''},${row.predictedValue || ''}`);
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `sdg_forecast_${selectedCountry}_${selectedTarget}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveChart = () => {
    if (!chartRef.current) return;
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = window.URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgElement.clientWidth || 800;
      canvas.height = svgElement.clientHeight || 400;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      window.URL.revokeObjectURL(url);
      
      const imgUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `forecast_${selectedCountry}_${selectedTarget}.png`;
      a.href = imgUrl;
      a.click();
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans scroll-smooth">
      {/* Sticky Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('home')}>
            <div className="bg-blue-900 p-2 rounded-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-blue-900 tracking-tight hidden sm:block">
              SDG <span className="font-light text-slate-500">Forecaster</span>
            </h1>
          </div>
          <nav className="flex items-center gap-2 sm:gap-6 text-sm font-medium text-slate-600 overflow-x-auto pb-1 sm:pb-0">
            <button 
              onClick={() => scrollTo('home')} 
              className={`pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'home' || activeTab === 'history' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent hover:text-blue-900'}`}
            >
              Home
            </button>
            <button 
              onClick={() => scrollTo('about')} 
              className={`pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'about' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent hover:text-blue-900'}`}
            >
              About SDGs
            </button>
            <button 
              onClick={() => scrollTo('dashboard')} 
              className={`pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent hover:text-blue-900'}`}
            >
              Deep Dive Explorer
            </button>
            <button 
              onClick={() => scrollTo('simulator')} 
              className={`pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'simulator' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent hover:text-blue-900'}`}
            >
              Policy Simulator
            </button>
            <button 
              onClick={() => scrollTo('comparison')} 
              className={`pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'comparison' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent hover:text-blue-900'}`}
            >
              Compare
            </button>
            <select
              className="pb-1 border-b-2 border-transparent bg-transparent text-sm font-medium text-slate-600 hover:text-blue-900 focus:outline-none cursor-pointer appearance-none text-center"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  navigate(`/country/${e.target.value}`);
                }
              }}
              title="Country Profiles"
            >
              <option value="" disabled>Profiles ▾</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <Link to="/admin" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 shadow-sm ml-2">
              <ShieldCheck className="w-4 h-4 mr-2" /> Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-grow flex flex-col min-h-0 overflow-x-hidden pt-8 pb-12">
        {/* HERO SECTION */}
        <section id="home" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950">
          
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="w-full flex justify-center opacity-90 order-last lg:order-first">
              <GlobeView markers={globeMarkers} />
            </div>

            {/* Text Section (Right) */}
            <div className="space-y-8 text-center lg:text-left order-first lg:order-last">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium bg-white/10 text-white hover:bg-white/20 border-white/10">
                <Sparkles className="w-4 h-4 mr-2 text-primary" /> Data-Driven Forecasting for a Sustainable Future
              </Badge>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight">
                Predicting Global Outcomes for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">2030</span>.
              </h1>
              <p className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                An enterprise-grade analytical engine mapping the trajectory of UN Sustainable Development Goals using historical data and AI-driven predictive modeling.
              </p>
              <div className="pt-4 flex flex-wrap justify-center lg:justify-start gap-4">
                <Button size="lg" className="text-base h-14 px-8 shadow-lg shadow-primary/25" onClick={() => scrollTo('dashboard')}>
                  Explore the Dashboard
                </Button>
                <Button size="lg" variant="outline" className="text-base h-14 px-8 border-slate-700 bg-slate-900/50 text-white hover:bg-slate-800" onClick={() => scrollTo('about')}>
                  Learn More
                </Button>
              </div>
            </div>
          </div>
          
          {/* Scroll Down Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <ArrowDownCircle className="w-8 h-8 text-slate-500 opacity-50" />
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">About the Forecaster</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Bridging the gap between raw data and actionable insights to help policymakers and analysts track the world's most critical goals.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-lg shadow-slate-100 bg-slate-50/50">
                <CardContent className="pt-6 space-y-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900">Global Coverage</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Integrating datasets from the United Nations API and Our World in Data to provide a comprehensive view of global progress.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-lg shadow-slate-100 bg-slate-50/50">
                <CardContent className="pt-6 space-y-4">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                    <LineChartIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900">Predictive Analytics</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Utilizing advanced regression models and anomaly detection to accurately forecast trajectory endpoints for the year 2030.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-lg shadow-slate-100 bg-slate-50/50">
                <CardContent className="pt-6 space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900">AI Insights</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Translating complex statistical projections into plain-language narratives powered by large language models.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* HISTORY SECTION */}
        <section id="history" className="py-24 bg-slate-50 border-y border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-sm">
                <Clock className="w-4 h-4" /> The Origin
              </div>
              <h2 className="text-3xl font-bold text-slate-900">The 2030 Agenda</h2>
              <p className="text-slate-600 leading-relaxed">
                In 2015, all United Nations Member States adopted the 2030 Agenda for Sustainable Development. At its heart are the 17 Sustainable Development Goals (SDGs), an urgent call for action by all countries in a global partnership.
              </p>
              <p className="text-slate-600 leading-relaxed">
                This forecaster was built to answer one critical question: <strong>Based on current data, will we reach our targets by 2030?</strong>
              </p>
            </div>
            <div className="flex-1 w-full relative">
              <div className="aspect-square bg-gradient-to-tr from-slate-200 to-slate-100 rounded-3xl p-8 flex items-center justify-center shadow-inner">
                <BookOpen className="w-32 h-32 text-slate-300" />
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT SDGs SECTION */}
        <section id="about" className="py-24 bg-white border-y border-slate-200">
          <AboutSDGs />
        </section>

        {/* DASHBOARD SECTION */}
        <section id="dashboard" className="py-24 bg-slate-100 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="space-y-2 mb-10">
              <h2 className="text-3xl font-bold text-slate-900">Interactive Data Tracker</h2>
              <p className="text-slate-500">Select a country and a specific SDG target to generate a live AI forecast.</p>
            </div>

            {/* Control Panel */}
            <Card className="border-white shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-sm font-medium text-slate-700">Select Country</label>
                    <select 
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                    >
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-sm font-medium text-slate-700">Select SDG Target</label>
                    <select 
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      value={selectedTarget}
                      onChange={(e) => setSelectedTarget(e.target.value)}
                    >
                      {TARGETS.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="w-full md:w-auto mt-4 md:mt-0 flex gap-2">
                    <Button 
                      onClick={() => navigate(`/country/${selectedCountry}`)} 
                      variant="outline"
                      className="w-full md:w-auto shadow-sm h-11 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      View Profile
                    </Button>
                    <Button 
                      onClick={handleGenerate} 
                      disabled={loading}
                      className="w-full md:w-auto shadow-md h-11"
                      size="lg"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : "Generate Forecast"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading Skeletons */}
            {loading && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                <Card className="lg:col-span-2 border-white shadow-lg">
                  <CardContent className="p-6 h-[450px] flex flex-col gap-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-full w-full rounded-xl" />
                  </CardContent>
                </Card>
                <div className="space-y-6">
                  <Card className="border-white shadow-lg"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
                  <Card className="border-white shadow-lg"><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                </div>
              </div>
            )}

            {/* Dashboard Results */}
            {!loading && dashboardData && !dashboardData.error && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
                
                {/* Left Column (Data) */}
                <Card className="lg:col-span-2 border-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50 mb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">Trajectory Forecast (2015-2030)</CardTitle>
                      <p className="text-sm text-slate-500">Historical data combined with AI-driven predictive modeling.</p>
                    </div>
                    <Badge variant={getBadgeVariant(dashboardData.status)} className="px-3 py-1.5 text-sm shadow-sm font-semibold">
                      {dashboardData.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px] w-full mt-4" ref={chartRef}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="Year" 
                            tickLine={false} 
                            axisLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                            dy={10}
                          />
                          <YAxis 
                            tickLine={false} 
                            axisLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          
                          {/* Historical Solid Line */}
                          <Line 
                            name="Historical Data"
                            type="monotone" 
                            dataKey="actualValue" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                            activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                          />
                          
                          {/* Predictive Dashed Line */}
                          <Line 
                            name="AI Forecast (2030)"
                            type="monotone" 
                            dataKey="predictedValue" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                            activeDot={{ r: 6, stroke: '#7c3aed', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-50">
                      <Button variant="outline" className="text-slate-600 bg-slate-50 hover:bg-slate-100" onClick={handleExportCSV}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
                      </Button>
                      <Button variant="outline" className="text-slate-600 bg-slate-50 hover:bg-slate-100" onClick={handleSaveChart}>
                        <Download className="w-4 h-4 mr-2" /> Save Chart
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Right Column (Context & AI) */}
                <div className="space-y-6">
                  <Card className="border-white shadow-lg bg-gradient-to-br from-slate-50 to-white">
                    <CardHeader>
                      <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-slate-500" /> SDG Context
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {getSDGContext(selectedTarget)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-transparent shadow-lg bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                    <CardHeader>
                      <CardTitle className="text-base text-indigo-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" /> AI Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {dashboardData.ai_narrative}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {!loading && dashboardData && dashboardData.error && (
              <Card className="border-red-200 shadow-lg bg-red-50 mt-8 max-w-3xl mx-auto animate-in fade-in">
                <CardHeader>
                  <CardTitle className="text-red-700">
                    Failed to load forecast data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600">{dashboardData.ai_narrative}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
        
        <section id="simulator" className="py-24 bg-white border-t border-slate-200">
          <PolicySimulator />
        </section>
        
        <section id="comparison" className="py-24 bg-slate-50 border-t border-slate-200">
          <CountryComparison />
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm flex flex-col items-center gap-2">
          <Globe className="w-6 h-6 text-slate-600" />
          <p>© 2026 SDG Trajectory - Global Outcome Forecaster.</p>
          <p>Academic Project Prototype.</p>
        </div>
      </footer>
    </div>
  );
}
