import { API_BASE_URL } from '@/config';
import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Home, Download, FileSpreadsheet, Sparkles, BookOpen, Info, TrendingUp, HelpCircle, Loader2, Search, ChevronDown, Globe2 } from 'lucide-react';
import { sdgGoalsContent } from '../data/sdgGoalsContent';
import { sdgColors } from '../data/sdgColors';
import { TARGETS, COUNTRIES } from '../lib/constants';
import { getTargetDetails, generateLaymanInsight, generateDynamicLaymanInsight, formatMetricValue } from '../data/sdgTargetsData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import PolicySimulator from './PolicySimulator';
import CountryComparison from './CountryComparison';
import GlobeView from '../components/GlobeView';
import LanguageSwitcher from '../components/LanguageSwitcher';
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

// Task 3: Dynamic SDG Context Panel
const SDG_CONTEXT_MAP = {
  '1.1': 'Eradicate extreme poverty for all people everywhere. Tracking the proportion of the population living below the international poverty line is critical to ensuring baseline economic security.',
  '2.1': 'End hunger and ensure access by all people to safe, nutritious and sufficient food all year round. This metric tracks the prevalence of undernourishment in the population.',
  '3.1': 'Reduce the global maternal mortality ratio. Ensuring safe childbirth and maternal healthcare is a fundamental indicator of a robust health system.',
  '3.2': 'End preventable deaths of newborns and children under 5 years of age. Child mortality rates serve as a crucial proxy for broader societal health and well-being.',
  '4.1': 'Ensure that all girls and boys complete free, equitable and quality primary and secondary education. Measuring reading and math proficiency is key to human capital development.',
  '8.5': 'Achieve full and productive employment and decent work for all women and men. Unemployment rates are a direct measure of economic health and labor market efficiency.',
  '9.1': 'Develop quality, reliable, sustainable and resilient infrastructure. Tracking passenger and freight volumes provides insight into economic integration and mobility.',
  '13.2': 'Integrate climate change measures into national policies, strategies and planning. Monitoring CO2 emissions is the primary mechanism to combat global warming and environmental degradation.'
};

const getSDGContext = (targetCode) => {
  return SDG_CONTEXT_MAP[targetCode] || 'Strategic progress towards this target is crucial for achieving the broader SDG goal by 2030. Tracking this indicator helps ensure national policy remains aligned with global sustainability objectives.';
};

// Task 2: Large Number Formatting (UX Improvement)
const formatLargeNumber = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [goalNum]);
  
  // Filter targets to this goal
  const goalTargets = TARGETS.filter(t => {
    const gp = parseInt(t.code.split('.')[0], 10);
    return gp === goalNum;
  });
  const [selectedTarget, setSelectedTarget] = useState(goalTargets[0]?.code || '1.1');
  
  useEffect(() => {
    if (!goalTargets.find(t => t.code === selectedTarget)) {
      setSelectedTarget(goalTargets[0]?.code || '1.1');
    }
  }, [goalNum, goalTargets, selectedTarget]);
  
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const chartRef = useRef(null);

  const handleGenerate = async () => {
    setLoading(true);
    setDashboardData(null);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await axios.get(`${API_BASE_URL}/api/predict`, {
        params: { country_code: selectedCountry, sdg_target: selectedTarget }
      });
      
      const { historical_data, predictions, status, ai_narrative } = response.data;
      
      // Map both arrays
      const histMapped = historical_data.map(d => ({ Year: parseInt(d.Year), actualValue: d.IndicatorValue, predictedValue: null }));
      const predMapped = predictions.map(p => ({ Year: parseInt(p.Year), actualValue: null, predictedValue: p.PredictedValue }));
      
      // Combine and strictly sort by Year
      let chartData = [...histMapped, ...predMapped];
      chartData.sort((a, b) => a.Year - b.Year);

      // Identify unique years and merge overlaps
      const mergedDataMap = new Map();
      chartData.forEach(item => {
        if (mergedDataMap.has(item.Year)) {
          const existing = mergedDataMap.get(item.Year);
          mergedDataMap.set(item.Year, {
            ...existing,
            actualValue: item.actualValue !== null ? item.actualValue : existing.actualValue,
            predictedValue: item.predictedValue !== null ? item.predictedValue : existing.predictedValue
          });
        } else {
          mergedDataMap.set(item.Year, item);
        }
      });
      chartData = Array.from(mergedDataMap.values()).sort((a, b) => a.Year - b.Year);

      // The "Bridge": stitch the solid line and dashed line together
      const lastHistoricalIndex = chartData.map(d => d.actualValue !== null).lastIndexOf(true);
      if (lastHistoricalIndex !== -1) {
        // Copy the last historical actual value into its predictedValue slot to anchor the forecast line
        chartData[lastHistoricalIndex].predictedValue = chartData[lastHistoricalIndex].actualValue;
      }

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
      const actual = row.actualValue !== null && row.actualValue !== undefined ? row.actualValue : '';
      const predicted = row.predictedValue !== null && row.predictedValue !== undefined ? row.predictedValue : '';
      csvRows.push(`${row.Year},${actual},${predicted}`);
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
    // Add default font family to the SVG source so it renders nicely in the PNG
    source = source.replace('<svg ', '<svg style="font-family: sans-serif;" ');

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
      <header className="fixed top-0 left-0 w-full h-14 bg-navy/95 backdrop-blur-md z-50 border-b border-white/10 flex items-center px-6">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          {/* Left: Logo */}
          <Link to="/" className="text-sm font-semibold tracking-wide hover:text-slate-300 transition-colors text-white">
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
          
          {/* Right: Language and Country selector */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="w-48">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-full h-8 bg-white border-slate-200 text-xs text-navy font-medium shadow-sm hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-white/20">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 pt-14">
        
        {/* ===== LEFT SIDEBAR — Light theme ===== */}
        <aside className="hidden lg:flex flex-col bg-cream border-r border-slate-200 w-16 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] z-40 pb-20">
          {/* Home icon */}
            <Link to="/" className="flex items-center text-sm font-medium text-slate-500 hover:text-navy transition-colors">
              <Home className="w-4 h-4 text-warm-gray" />
            </Link>
          
          <div className="px-2 py-2">
            <p className="text-[8px] uppercase tracking-wider text-slate-400 text-center leading-tight"><span>Explore</span><br/><span>17 SDGs</span></p>
          </div>
          
          {/* Goal numbers with hover tooltip */}
          {/* W-96 hack allows tooltips to escape the overflow-y-auto clipping without blocking clicks */}
          <div className="flex-1 relative w-16">
            <nav className="absolute inset-0 w-96 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pointer-events-none flex flex-col items-start py-1">
              {Array.from({ length: 17 }, (_, i) => i + 1).map(num => {
                const isActive = num === goalNum;
                const isHovered = hoveredSidebarGoal === num;
                return (
                  <div key={num} className="relative w-16 flex justify-center mb-0.5 pointer-events-auto">
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
                    <div
                      className={`absolute left-[3.75rem] top-1/2 -translate-y-1/2 whitespace-nowrap z-50 pointer-events-none transition-all duration-200 ease-out ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                    >
                    <div
                      className="flex items-center px-3 py-1.5 rounded text-xs font-semibold text-white shadow-lg"
                      style={{ backgroundColor: sdgColors[num], borderLeft: `3px solid ${sdgColors[num]}` }}
                    >
                      {SDG_SHORT_TITLES[num]}
                    </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          
          {/* Goal Hero Section — Gradient background and subtle glow */}
          <section className="text-white py-16 px-6 md:px-12 bg-gradient-to-br from-navy via-[#1e293b] to-navy">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-8 items-center lg:items-start">
              {/* Left: Description (~52%) */}
              <div className="lg:w-[52%] flex-shrink-0">
                {/* Goal number + title with colored underline */}
                <div className="mb-2">
                  <span
                    className="text-6xl md:text-8xl font-serif font-bold"
                    style={{ color: goalColor, textShadow: `0 0 40px ${goalColor}80` }}
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
                <div className="border-t border-white/15 pt-8 mb-8">
                  <h3 className="text-sm uppercase tracking-wider text-white/40 mb-3">History & Background</h3>
                  <p className="text-white/60 leading-relaxed max-w-2xl text-sm">{goal.history}</p>
                </div>
                
                {/* Official Targets */}
                <div className="border-t border-white/15 pt-8">
                  <h3 className="text-sm uppercase tracking-wider text-white/40 mb-3">SDG Targets Covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {goal.officialTargets.map((target, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-3 py-1.5 text-white/90 rounded-full backdrop-blur-sm border transition-colors hover:bg-white/10 cursor-default"
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
                <div className="relative flex justify-center items-center rounded-full shadow-[0_0_60px_-15px_rgba(59,130,246,0.3)] bg-gradient-to-b from-transparent to-blue-50/20 p-4">
                  <GlobeView
                    goalNumber={goalNum}
                    highlightColor="#ffffff"
                    compact={true}
                    size={520}
                    showRing={true}
                  />
                </div>
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
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-sm font-medium text-slate-700">SDG Target</label>
                    <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Select Target" />
                      </SelectTrigger>
                      <SelectContent>
                        {goalTargets.map(t => {
                          const targetInfo = getTargetDetails(t.code, goalNum);
                          return <SelectItem key={t.code} value={t.code}><span className="notranslate">{t.code}</span> <span>— {targetInfo.title}</span></SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
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
                          <Loader2 className="animate-spin w-4 h-4" />
                          Generating...
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
                            Target <span className="notranslate">{selectedTarget}</span>: {targetInfo.title}
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
                      <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-lg shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                tickFormatter={(val) => formatLargeNumber(val)} 
                                width={75}
                                label={{ value: targetInfo.unit, angle: -90, position: 'insideLeft', offset: -5, fill: '#475569', fontSize: 11, fontWeight: 500 }}
                              />
                              <Tooltip 
                                contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
                                labelStyle={{ fontWeight: 'bold', color: '#1B2A4A' }}
                                formatter={(val, name) => [`${formatLargeNumber(val)} ${targetInfo.unit}`, name === 'actualValue' ? 'Historical Data' : 'Forecast']}
                                labelFormatter={(label) => `Year: ${label}`}
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
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> <span>Export CSV</span>
                          </Button>
                          <Button variant="outline" className="text-slate-600 bg-white hover:bg-slate-50 border-slate-200" onClick={handleSaveChart}>
                            <Download className="w-4 h-4 mr-2" /> <span>Save Chart</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Context + Layman Insight */}
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
                    <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
                      <h4 className="text-sm font-semibold text-warm-gray flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-slate-400" /> <span>Target Overview</span>
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        <strong className="font-semibold text-slate-800">SDG Context: </strong>
                        {getSDGContext(selectedTarget)}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: goalColor }} />
                      <h4 className="text-sm font-semibold text-warm-gray flex items-center gap-2 mb-3 pl-2">
                        <Sparkles className="w-4 h-4 text-purple-600" /> <span>AI Trajectory Insight</span>
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
