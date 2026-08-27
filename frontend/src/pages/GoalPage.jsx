import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Home, Download, FileSpreadsheet, Sparkles, BookOpen, Info, TrendingUp, HelpCircle } from 'lucide-react';
import { sdgGoalsContent } from '../data/sdgGoalsContent';
import { sdgColors } from '../data/sdgColors';
import { COUNTRIES, TARGETS } from '../lib/constants';
import { getTargetDetails, generateLaymanInsight, generateDynamicLaymanInsight, formatMetricValue } from '../data/sdgTargetsData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import PolicySimulator from './PolicySimulator';
import CountryComparison from './CountryComparison';
import GlobeView from '../components/GlobeView';
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
    { Year: 2025, actualValue: 21.50, predictedValue: 21.50 },
    { Year: 2026, actualValue: null, predictedValue: 22.10 },
    { Year: 2027, actualValue: null, predictedValue: 22.80 },
    { Year: 2028, actualValue: null, predictedValue: 23.50 },
    { Year: 2029, actualValue: null, predictedValue: 24.10 },
    { Year: 2030, actualValue: null, predictedValue: 24.80 }
  ]
};

// Short titles for sidebar hover
const SDG_SHORT_TITLES = {
  1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health & Well-Being',
  4: 'Quality Education', 5: 'Gender Equality', 6: 'Clean Water & Sanitation',
  7: 'Affordable & Clean Energy', 8: 'Decent Work & Economic Growth',
  9: 'Industry, Innovation & Infrastructure', 10: 'Reduced Inequalities',
  11: 'Sustainable Cities & Communities', 12: 'Responsible Consumption',
  13: 'Climate Action', 14: 'Life Below Water', 15: 'Life on Land',
  16: 'Peace, Justice & Strong Institutions', 17: 'Partnerships for the Goals',
};

export default function GoalPage() {
  const { goalNumber } = useParams();
  const navigate = useNavigate();
  const goalNum = parseInt(goalNumber, 10);
  const goal = sdgGoalsContent.find(g => g.goalNumber === goalNum);
  const goalColor = sdgColors[goalNum] || '#1B2A4A';
  const [hoveredSidebarGoal, setHoveredSidebarGoal] = useState(null);

  // Prediction state
  const [selectedCountry, setSelectedCountry] = useState('IND');
  
  // Filter targets to this goal
  const goalTargets = TARGETS.filter(t => {
    const gp = parseInt(t.code.split('.')[0], 10);
    return gp === goalNum;
  });
  const [selectedTarget, setSelectedTarget] = useState(goalTargets[0]?.code || '1.1');
  
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const chartRef = useRef(null);

  const handleGenerate = async () => {
    setLoading(true);
    setDashboardData(null);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await axios.get(`/api/predict`, {
        params: { country_code: selectedCountry, sdg_target: selectedTarget }
      });
      
      const { historical_data, predictions, status, ai_narrative } = response.data;
      const chartData = [];
      
      historical_data.forEach(d => {
        chartData.push({ Year: d.Year, actualValue: d.IndicatorValue, predictedValue: null });
      });

      if (historical_data.length > 0 && predictions.length > 0) {
        const lastActual = historical_data[historical_data.length - 1];
        chartData[chartData.length - 1].predictedValue = lastActual.IndicatorValue;
      }
      
      predictions.forEach(p => {
        chartData.push({ Year: p.Year, actualValue: null, predictedValue: p.PredictedValue });
      });

      setDashboardData({ status, ai_narrative, chart_data: chartData });
    } catch (error) {
      if (!error.response || error.response.status === 503) {
        setDashboardData(MOCK_DATA);
      } else {
        setDashboardData({
          error: true,
          status: "Error",
          ai_narrative: `Backend error: ${error.response?.status} - ${error.response?.data?.detail || error.message}.`
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

  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream text-warm-gray">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif font-bold">Goal not found</h1>
          <p className="text-slate-500">Goal {goalNumber} does not exist.</p>
          <Link to="/" className="text-navy underline">Return to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      
      {/* ===== TOP HEADER BAR ===== */}
      <header className="bg-navy text-white h-12 flex items-center px-4 z-50 sticky top-0">
        <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
          {/* Left: Logo */}
          <Link to="/" className="text-sm font-semibold tracking-wide hover:text-slate-300 transition-colors">
            SDG Trajectory
          </Link>
          
          {/* Center: 17 SDG dots */}
          <div className="hidden md:flex items-center gap-1.5">
            {Array.from({ length: 17 }, (_, i) => i + 1).map(num => (
              <Link
                key={num}
                to={`/goal/${num}`}
                className="block rounded-full transition-all duration-150"
                style={{ 
                  backgroundColor: sdgColors[num],
                  width: num === goalNum ? '14px' : '8px',
                  height: num === goalNum ? '14px' : '8px',
                  opacity: num === goalNum ? 1 : 0.6,
                }}
                title={`Goal ${num}: ${sdgGoalsContent[num - 1]?.title}`}
              />
            ))}
          </div>
          
          {/* Right: Country selector */}
          <select
            className="bg-navy border border-slate-600 text-white text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        
        {/* ===== LEFT SIDEBAR — Light theme ===== */}
        <aside className="hidden lg:flex flex-col bg-cream border-r border-slate-200 w-16 flex-shrink-0 sticky top-12 h-[calc(100vh-3rem)] z-30 overflow-visible">
          {/* Home icon */}
          <Link to="/" className="flex items-center justify-center h-12 hover:bg-slate-100 transition-colors" title="Home">
            <Home className="w-4 h-4 text-warm-gray" />
          </Link>
          
          <div className="px-2 py-2">
            <p className="text-[8px] uppercase tracking-wider text-slate-400 text-center leading-tight">Explore<br/>17 SDGs</p>
          </div>
          
          {/* Goal numbers with hover tooltip */}
          <nav className="flex-1 flex flex-col items-center gap-0.5 py-1 scrollbar-thin overflow-visible">
            {Array.from({ length: 17 }, (_, i) => i + 1).map(num => {
              const isActive = num === goalNum;
              const isHovered = hoveredSidebarGoal === num;
              return (
                <div key={num} className="relative">
                  <Link
                    to={`/goal/${num}`}
                    className="w-9 h-9 flex items-center justify-center text-xs font-bold rounded transition-all duration-150"
                    style={{
                      backgroundColor: isActive ? sdgColors[num] : (isHovered ? sdgColors[num] + '20' : 'transparent'),
                      color: isActive ? '#fff' : (isHovered ? sdgColors[num] : '#64748b'),
                    }}
                    onMouseEnter={() => setHoveredSidebarGoal(num)}
                    onMouseLeave={() => setHoveredSidebarGoal(null)}
                  >
                    {num}
                  </Link>
                  {/* Hover tooltip — shows short title */}
                  {isHovered && (
                    <div
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap z-50 pointer-events-none"
                      style={{ animation: 'dropdownIn 0.15s ease-out' }}
                    >
                      <div
                        className="flex items-center px-3 py-1.5 rounded text-xs font-semibold text-white shadow-lg"
                        style={{ backgroundColor: sdgColors[num], borderLeft: `3px solid ${sdgColors[num]}` }}
                      >
                        {SDG_SHORT_TITLES[num]}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          
          {/* Goal Hero Section — Consistent navy bg, goal-colored number/underline only */}
          <section className="text-white py-16 px-6 md:px-12 bg-navy">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-8 items-center lg:items-start">
              {/* Left: Description (~52%) */}
              <div className="lg:w-[52%] flex-shrink-0">
                {/* Goal number + title with colored underline */}
                <div className="mb-2">
                  <span
                    className="text-6xl md:text-8xl font-serif font-bold"
                    style={{ color: goalColor }}
                  >
                    {goalNum}
                  </span>
                  <span className="ml-4 text-xl md:text-2xl font-semibold uppercase tracking-wider text-white/90">
                    {goal.title}
                  </span>
                </div>
                {/* Colored underline */}
                <div className="h-0.5 w-32 mb-8" style={{ backgroundColor: goalColor }} />

                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white leading-snug mb-6">
                  {goal.subtitle}
                </h2>
                <p className="text-white/70 leading-relaxed max-w-2xl mb-8 text-[15px]">{goal.whatItAchieves}</p>
                
                {/* History */}
                <div className="border-t border-white/15 pt-6 mb-8">
                  <h3 className="text-sm uppercase tracking-wider text-white/40 mb-3">History & Background</h3>
                  <p className="text-white/60 leading-relaxed max-w-2xl text-sm">{goal.history}</p>
                </div>
                
                {/* Official Targets */}
                <div className="border-t border-white/15 pt-6">
                  <h3 className="text-sm uppercase tracking-wider text-white/40 mb-3">SDG Targets Covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {goal.officialTargets.map((target, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-3 py-1.5 text-white/90 rounded border"
                        style={{ borderColor: goalColor + '60', backgroundColor: goalColor + '20' }}
                      >
                        {target}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Rotating Globe (~48%) — bigger, with ring touching edges */}
              <div className="lg:w-[48%] flex justify-center items-center lg:sticky lg:top-20 py-4">
                <GlobeView
                  goalNumber={goalNum}
                  highlightColor="#ffffff"
                  compact={true}
                  size={520}
                  showRing={true}
                />
              </div>
            </div>
          </section>

          {/* Predictions Section */}
          <section className="py-12 px-6 md:px-12 bg-cream border-b border-slate-200">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-warm-gray mb-1">Trajectory Forecast</h2>
                  <p className="text-sm text-slate-500">
                    Explore data-driven projections toward 2030 for specific indicators and evaluate national progress.
                  </p>
                </div>
              </div>
              
              {/* Controls */}
              <div className="bg-white border border-slate-200 p-6 mb-8 rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-sm font-medium text-slate-700">Country</label>
                    <select 
                      className="w-full h-11 px-4 border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-navy rounded-md"
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                    >
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-sm font-medium text-slate-700">SDG Target</label>
                    <select 
                      className="w-full h-11 px-4 border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-navy rounded-md"
                      value={selectedTarget}
                      onChange={(e) => setSelectedTarget(e.target.value)}
                    >
                      {goalTargets.map(t => {
                        const targetInfo = getTargetDetails(t.code, goalNum);
                        return <option key={t.code} value={t.code}>{t.code} — {targetInfo.title}</option>;
                      })}
                    </select>
                  </div>

                  <div className="w-full md:w-auto flex gap-2">
                    <Button 
                      onClick={() => navigate(`/country/${selectedCountry}`)} 
                      variant="outline"
                      className="w-full md:w-auto h-11 border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    >
                      View Profile
                    </Button>
                    <Button 
                      onClick={handleGenerate} 
                      disabled={loading}
                      className="w-full md:w-auto h-11"
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
              </div>

              {/* Target Context & Goal Impact Description */}
              {(() => {
                const targetInfo = getTargetDetails(selectedTarget, goalNum);
                return (
                  <div className="bg-white border border-slate-200 p-5 mb-8 rounded-lg shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded text-white" style={{ backgroundColor: goalColor }}>
                            Goal {goalNum}: {goal.title}
                          </span>
                          <span className="text-base font-bold text-warm-gray">
                            Target {selectedTarget}: {targetInfo.title}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Metric: {targetInfo.indicatorName} ({targetInfo.unit})
                        </span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${targetInfo.polarity === 'lower_is_better' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {targetInfo.polarity === 'lower_is_better' ? '📉 Lower is better' : '📈 Higher is better'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <strong className="text-warm-gray font-semibold">How this target drives Goal {goalNum}: </strong>
                      {targetInfo.impactOnGoal}
                    </p>
                  </div>
                );
              })()}

              {/* Loading */}
              {loading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-lg">
                    <Skeleton className="h-8 w-32 mb-4" />
                    <Skeleton className="h-[350px] w-full" />
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-lg"><Skeleton className="h-32 w-full" /></div>
                    <div className="bg-white border border-slate-200 p-6 rounded-lg"><Skeleton className="h-48 w-full" /></div>
                  </div>
                </div>
              )}

              {/* Results */}
              {!loading && dashboardData && !dashboardData.error && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart */}
                  {(() => {
                    const targetInfo = getTargetDetails(selectedTarget, goalNum);
                    return (
                      <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                          <div>
                            <h3 className="text-lg font-serif font-semibold text-warm-gray">
                              Trajectory Forecast (2015–2030)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Historical actuals with statistical time-series regression projection.
                            </p>
                          </div>
                          <Badge variant={getBadgeVariant(dashboardData.status)} className="px-3 py-1.5 text-sm font-semibold">
                            {dashboardData.status}
                          </Badge>
                        </div>
                        
                        <div className="h-[360px] w-full" ref={chartRef}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dashboardData.chart_data} margin={{ top: 15, right: 20, left: 15, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis 
                                dataKey="Year" 
                                tickLine={false} 
                                axisLine={{ stroke: '#cbd5e1' }} 
                                tick={{fill: '#64748b', fontSize: 12}} 
                                dy={10} 
                                label={{ value: 'Year', position: 'insideBottom', offset: -12, fill: '#475569', fontSize: 12, fontWeight: 600 }}
                              />
                              <YAxis 
                                tickLine={false} 
                                axisLine={{ stroke: '#cbd5e1' }} 
                                tick={{fill: '#64748b', fontSize: 11}}
                                tickFormatter={(val) => formatMetricValue(val)} 
                                width={65}
                                label={{ value: targetInfo.unit, angle: -90, position: 'insideLeft', offset: -5, fill: '#475569', fontSize: 11, fontWeight: 500 }}
                              />
                              <Tooltip 
                                contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
                                labelStyle={{ fontWeight: 'bold', color: '#1B2A4A' }}
                                formatter={(val) => [`${formatMetricValue(val)} ${targetInfo.unit}`, '']}
                              />
                              <Legend verticalAlign="top" height={36} iconType="circle" />
                              <Line name="Historical Data" type="monotone" dataKey="actualValue" stroke={goalColor} strokeWidth={2.5} dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5, stroke: goalColor, strokeWidth: 2 }} />
                              <Line name="Statistical Trend Forecast (2030)" type="monotone" dataKey="predictedValue" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5, stroke: '#7c3aed', strokeWidth: 2 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* 2-line Layman Disclaimer Box */}
                        <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                          <div className="leading-relaxed">
                            <strong className="text-slate-800">How is this forecast generated? </strong>
                            This trajectory uses statistical linear regression on historical UN and World Bank indicator data (2015–2025). It models current velocity and projects expected 2030 outcomes assuming existing policy environments and investment rates continue without disruption.
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                          <Button variant="outline" className="text-slate-600 bg-white hover:bg-slate-50 border-slate-200" onClick={handleExportCSV}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
                          </Button>
                          <Button variant="outline" className="text-slate-600 bg-white hover:bg-slate-50 border-slate-200" onClick={handleSaveChart}>
                            <Download className="w-4 h-4 mr-2" /> Save Chart
                          </Button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Context + Layman Insight */}
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
                      <h4 className="text-sm font-semibold text-warm-gray flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-slate-400" /> Target Overview
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {getTargetDetails(selectedTarget, goalNum).impactOnGoal}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: goalColor }} />
                      <h4 className="text-sm font-semibold text-warm-gray flex items-center gap-2 mb-3 pl-2">
                        <Sparkles className="w-4 h-4 text-purple-600" /> AI Trajectory Insight
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium pl-2">
                        {generateDynamicLaymanInsight({
                          countryName: COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry,
                          goalNumber: goalNum,
                          goalName: goal.title,
                          targetCode: selectedTarget,
                          status: dashboardData.status,
                          chartData: dashboardData.chart_data,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {!loading && dashboardData && dashboardData.error && (
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-3xl">
                  <h3 className="font-semibold text-red-700 mb-2">Failed to load forecast data</h3>
                  <p className="text-red-600 text-sm">{dashboardData.ai_narrative}</p>
                </div>
              )}
            </div>
          </section>

          {/* Policy Simulator Section */}
          <section className="py-12 px-6 md:px-12 bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto">
              <PolicySimulator goalNumber={goalNum} />
            </div>
          </section>

          {/* Country Comparison Section */}
          <section className="py-12 px-6 md:px-12 bg-cream border-b border-slate-200">
            <div className="max-w-6xl mx-auto">
              <CountryComparison goalNumber={goalNum} />
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-cream">
            <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-slate-500">
              <p>© 2026 SDG Trajectory — Academic Project Prototype</p>
              <p className="mt-1 text-xs text-slate-400">
                This tool is for educational and research purposes. Data sourced from the United Nations SDG API and Our World in Data.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
