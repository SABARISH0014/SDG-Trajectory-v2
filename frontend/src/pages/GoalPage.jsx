import { API_BASE_URL } from '@/config';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Home, 
  Download, 
  FileSpreadsheet, 
  Sparkles, 
  BookOpen, 
  Info, 
  TrendingUp, 
  HelpCircle, 
  Loader2, 
  Search, 
  ChevronDown, 
  Globe2, 
  ChevronRight, 
  SlidersHorizontal, 
  Scale, 
  Table, 
  LineChart as ChartIcon,
  Bot,
  Clock
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { sdgGoalsContent } from '../data/sdgGoalsContent';
import { sdgColors } from '../data/sdgColors';
import { TARGETS, COUNTRIES } from '../lib/constants';
import { getTargetDetails, generateDynamicLaymanInsight, formatMetricValue } from '../data/sdgTargetsData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import TargetSelectItem from '../components/TargetSelectItem';
import PolicySimulator from './PolicySimulator';
import CountryComparison from './CountryComparison';
import GlobeView from '../components/GlobeView';
import ExportDossierButton from '../components/ExportDossierButton';
import CopilotDrawer from '../components/CopilotDrawer';
import SplashScreenOverlay from '../components/SplashScreenOverlay';
import ForecastPreviewPlaceholder from '../components/ForecastPreviewPlaceholder';
import LoadingTriviaCard from '../components/LoadingTriviaCard';
import DataTableTab from '../components/tabs/DataTableTab';
import html2canvas from 'html2canvas';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 text-white border border-slate-700 shadow-2xl p-3.5 rounded-xl z-[100] text-xs pointer-events-none notranslate min-w-[220px]">
        <p className="font-semibold text-slate-400 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
          <span>Year (X):</span> <span className="text-white font-bold text-sm">{label}</span>
        </p>
        {payload.map((entry, index) => {
          if (entry.value === null || entry.value === undefined) return null;
          const isPredicted = entry.dataKey === 'predictedValue';
          return (
            <div key={index} className="flex items-center justify-between gap-3 py-1">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                {isPredicted ? '2030 Forecast:' : 'Historical Actual:'}
              </span>
              <span className="font-mono font-bold text-white text-xs">
                {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(entry.value)}
                {unit && <span className="ml-1 text-[10px] text-slate-400 font-normal">({unit})</span>}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

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

export default function GoalPage() {
  const { goalNumber } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const goalNum = parseInt(goalNumber, 10);
  const goal = sdgGoalsContent.find(g => g.goalNumber === goalNum);
  const goalColor = sdgColors[goalNum] || '#1B2A4A';
  const [hoveredSidebarGoal, setHoveredSidebarGoal] = useState(null);

  // Tab State: 'forecast' | 'simulator' | 'benchmark' | 'datatable'
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'forecast');

  useEffect(() => {
    if (urlTab && ['forecast', 'simulator', 'benchmark', 'datatable'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabId);
    setSearchParams(newParams, { replace: true });
  };

  // Prediction state & URL param initialization
  const urlCountry = searchParams.get('country');
  const urlTarget = searchParams.get('target');

  const [selectedCountry, setSelectedCountry] = useState(() => {
    if (urlCountry && COUNTRIES.some(c => c.code === urlCountry)) return urlCountry;
    return 'IND';
  });

  useEffect(() => {
    if (urlCountry && COUNTRIES.some(c => c.code === urlCountry)) {
      setSelectedCountry(urlCountry);
    }
  }, [urlCountry]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [goalNum]);
  
  // Filter targets to this goal
  const goalTargets = TARGETS.filter(t => {
    const gp = parseInt(t.code.split('.')[0], 10);
    return gp === goalNum;
  });

  const [selectedTarget, setSelectedTarget] = useState(() => {
    if (urlTarget && goalTargets.some(t => t.code === urlTarget)) return urlTarget;
    return goalTargets[0]?.code || `${goalNum}.1`;
  });
  
  useEffect(() => {
    if (urlTarget && goalTargets.some(t => t.code === urlTarget)) {
      setSelectedTarget(urlTarget);
    } else if (!goalTargets.find(t => t.code === selectedTarget)) {
      setSelectedTarget(goalTargets[0]?.code || `${goalNum}.1`);
    }
  }, [goalNum, goalTargets, selectedTarget, urlTarget]);
  
  const [loading, setLoading] = useState(false);
  const [isSavingChart, setIsSavingChart] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const chartRef = useRef(null);

  const handleGenerate = async () => {
    setLoading(true);
    setDashboardData(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/predict`, {
        params: { country_code: selectedCountry, sdg_target: selectedTarget }
      });
      
      const { historical_data, predictions, status, ai_narrative } = response.data;
      
      const histMapped = historical_data.map(d => ({ Year: parseInt(d.Year), actualValue: d.IndicatorValue, predictedValue: null }));
      const predMapped = predictions.map(p => ({ Year: parseInt(p.Year), actualValue: null, predictedValue: p.PredictedValue }));
      
      let chartData = [...histMapped, ...predMapped];
      chartData.sort((a, b) => a.Year - b.Year);

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

      const lastHistoricalIndex = chartData.map(d => d.actualValue !== null).lastIndexOf(true);
      if (lastHistoricalIndex !== -1) {
        const finalHistoricalYear = chartData[lastHistoricalIndex].Year;
        chartData.forEach(d => {
          if (d.Year < finalHistoricalYear) {
            d.predictedValue = null;
          }
        });
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

  // Reset forecast data when country or target changes so the static preview appears
  // and forecasting is only executed on-demand when the user clicks "Generate Forecast"
  useEffect(() => {
    setDashboardData(null);
  }, [selectedCountry, selectedTarget]);

  const lastUpdatedYear = useMemo(() => {
    if (!dashboardData?.chart_data) return null;
    const hist = dashboardData.chart_data.filter(d => d.actualValue !== null && d.actualValue !== undefined);
    if (hist.length === 0) return null;
    return hist[hist.length - 1].Year;
  }, [dashboardData]);

  const getBadgeVariant = (status) => {
    if (!status) return "default";
    const s = status.toLowerCase();
    if (s.includes('off')) return "destructive";
    if (s.includes('risk')) return "warning";
    if (s.includes('track')) return "success";
    return "default";
  };

  const handleExportCSV = () => {
    if (!dashboardData || !dashboardData.chart_data) return;
    const unitStr = targetInfo?.unit || 'Value';
    const headers = ['Year', `Historical_Actual (${unitStr})`, `Statistical_Forecast_2030 (${unitStr})`];
    const csvRows = [
      `# SDG Goal ${goalNum} - Target ${selectedTarget}: "${targetInfo.title}"`,
      `# Country: ${countryName} (${selectedCountry})`,
      `# Metric: ${targetInfo.indicatorName} | Y-Axis Unit: ${unitStr} | Direction: ${targetInfo.polarity === 'lower_is_better' ? 'Lower is better' : 'Higher is better'}`,
      `# UN 2030 Benchmark: ${targetInfo.benchmarkLabel || targetInfo.benchmarkValue || 'Standard'}`,
      headers.join(',')
    ];
    dashboardData.chart_data.forEach(row => {
      const actual = row.actualValue !== null && row.actualValue !== undefined ? row.actualValue : '';
      const predicted = row.predictedValue !== null && row.predictedValue !== undefined ? row.predictedValue : '';
      csvRows.push(`${row.Year},${actual},${predicted}`);
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `sdg_forecast_${selectedCountry}_Target_${selectedTarget}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveChart = async () => {
    const chartContainer = document.getElementById('trajectory-chart-container') || chartRef.current;
    if (!chartContainer) return;
    setIsSavingChart(true);
    try {
      const originalBg = chartContainer.style.backgroundColor;
      chartContainer.style.backgroundColor = '#ffffff';
      const canvas = await html2canvas(chartContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        ignoreElements: (element) => element.classList && element.classList.contains('pdf-hide')
      });
      chartContainer.style.backgroundColor = originalBg;
      
      const imgUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `SDG_Forecast_${selectedCountry}_Target_${selectedTarget}.png`;
      a.href = imgUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Save chart failed:", err);
      alert("Failed to save chart. Please try again.");
    } finally {
      setIsSavingChart(false);
    }
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

  const countryName = COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry;
  const targetInfo = getTargetDetails(selectedTarget, goalNum);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar activeGoal={goalNum} />

      {/* ===== BREADCRUMB BAR ===== */}
      <div className="bg-slate-100 border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-navy flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link to="/countries" className="hover:text-navy">
              Goals
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-navy">
              Goal {goalNum}: {goal.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/country/${selectedCountry}`}
              className="text-xs text-teal-700 hover:underline font-semibold flex items-center gap-1"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>{countryName} Macro Profile</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        
        {/* ===== LEFT SIDEBAR — 17 SDG Quick Nav ===== */}
        <aside className="hidden lg:flex flex-col bg-cream border-r border-slate-200 w-16 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] z-40 pb-20">
          <div className="flex justify-center pt-4 pb-2 border-b border-slate-200/50 mb-2">
            <Link to="/" className="w-9 h-9 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-500 hover:text-navy hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-sm transition-all" title="Home">
              <Home className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="px-2 py-2">
            <p className="text-[8px] uppercase tracking-wider text-slate-400 text-center leading-tight"><span>Explore</span><br/><span>17 SDGs</span></p>
          </div>
          
          <div className="flex-1 relative w-16">
            <nav className="absolute inset-0 w-96 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pointer-events-none flex flex-col items-start py-1">
              {Array.from({ length: 17 }, (_, i) => i + 1).map(num => {
                const isActive = num === goalNum;
                const isHovered = hoveredSidebarGoal === num;
                return (
                  <div key={num} className="relative w-16 flex justify-center mb-0.5 pointer-events-auto">
                    <Link
                      to={`/goal/${num}${selectedCountry ? `?country=${selectedCountry}` : ''}`}
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
          
          {/* Goal Hero Section */}
          <section className="text-white py-16 px-6 md:px-12 bg-gradient-to-br from-navy via-[#1e293b] to-navy">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-8 items-center lg:items-start">
              {/* Left: Description */}
              <div className="lg:w-[52%] flex-shrink-0">
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

              {/* Right: Rotating Globe */}
              <div className="lg:w-[48%] flex justify-center items-center lg:sticky lg:top-20 py-4">
                <GlobeView
                  goalNumber={goalNum}
                  sdgTarget={selectedTarget}
                  onTargetChange={setSelectedTarget}
                  highlightColor="#ffffff"
                  compact={true}
                  size={520}
                  showRing={true}
                />
              </div>
            </div>
          </section>

          {/* ===== TABBED NAVIGATION BAR ===== */}
          <section className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 md:px-12 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => handleTabChange('forecast')}
                className={`py-4 px-4 font-serif font-bold text-sm flex items-center gap-2 border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'forecast'
                    ? 'text-navy border-navy'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
                style={{ borderColor: activeTab === 'forecast' ? goalColor : 'transparent' }}
              >
                <ChartIcon className="w-4 h-4" />
                <span>Trajectory Forecast</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('simulator')}
                className={`py-4 px-4 font-serif font-bold text-sm flex items-center gap-2 border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'simulator'
                    ? 'text-navy border-navy'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
                style={{ borderColor: activeTab === 'simulator' ? goalColor : 'transparent' }}
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span>Policy Simulator</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('benchmark')}
                className={`py-4 px-4 font-serif font-bold text-sm flex items-center gap-2 border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'benchmark'
                    ? 'text-navy border-navy'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
                style={{ borderColor: activeTab === 'benchmark' ? goalColor : 'transparent' }}
              >
                <Scale className="w-4 h-4 text-purple-600" />
                <span>Country Benchmarking</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('datatable')}
                className={`py-4 px-4 font-serif font-bold text-sm flex items-center gap-2 border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'datatable'
                    ? 'text-navy border-navy'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
                style={{ borderColor: activeTab === 'datatable' ? goalColor : 'transparent' }}
              >
                <Table className="w-4 h-4 text-teal-600" />
                <span>Data Table & Series</span>
              </button>
            </div>
          </section>

          {/* ===== TAB CONTENT CONTAINER ===== */}
          <div className="py-12 px-6 md:px-12 bg-cream min-h-[600px]">
            <div className="max-w-6xl mx-auto">
              
              {/* TAB 1: TRAJECTORY FORECAST */}
              {activeTab === 'forecast' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-serif font-bold text-warm-gray mb-1">
                        National Trajectory Forecast
                      </h3>
                      <p className="text-sm text-slate-500">
                        Explore data-driven projections toward 2030 for specific indicators and evaluate national progress.
                      </p>
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
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
                              const targetDetail = getTargetDetails(t.code, goalNum);
                              return <TargetSelectItem key={t.code} targetCode={t.code} targetTitle={targetDetail.title} />;
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
                          className="w-full md:w-auto h-11 bg-navy text-white hover:bg-slate-800"
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

                    {/* Requirement 4: Last updated year status line */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>
                          Official data reporting for <strong className="text-slate-800 font-semibold">{countryName}</strong> (Target <strong className="text-slate-800 font-semibold">{selectedTarget}</strong>):
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-navy bg-slate-100 px-3 py-1 rounded-full border border-slate-200 text-xs self-start sm:self-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {lastUpdatedYear ? `Latest reported data: ${lastUpdatedYear}` : 'Latest reported data: 2024'}
                      </span>
                    </div>
                  </div>

                  {/* Target Context & Goal Impact Description */}
                  <div key={selectedTarget} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
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

                  {/* Scoped Loading State with Dynamic SDG Trivia */}
                  {loading && (
                    <LoadingTriviaCard 
                      message={`Generating 2030 Trajectory Forecast for ${countryName}...`}
                      submessage={`Training statistical regression on Target ${selectedTarget} indicator actuals`}
                      isScoped={true}
                    />
                  )}

                  {/* Static Forecast Preview Placeholder (Zero-latency initial state) */}
                  {!loading && !dashboardData && (
                    <ForecastPreviewPlaceholder
                      countryName={countryName}
                      countryCode={selectedCountry}
                      targetInfo={targetInfo}
                      goalColor={goalColor}
                      goalNumber={goalNum}
                      onGenerateForecast={handleGenerate}
                      loading={loading}
                    />
                  )}

                  {/* Results */}
                  {!loading && dashboardData && !dashboardData.error && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Chart */}
                      <div id="trajectory-chart-container" className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
                          <div>
                            <h3 className="text-lg font-serif font-semibold text-warm-gray">
                              Trajectory Forecast (2015–2030)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Historical actuals with statistical time-series regression projection for {countryName}.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              const pred2030 = dashboardData?.chart_data?.find(d => d.Year === 2030)?.predictedValue;
                              const bVal = targetInfo.benchmarkValue;
                              if (bVal !== null && pred2030 !== null && pred2030 !== undefined) {
                                const isLower = targetInfo.polarity === 'lower_is_better';
                                const met = isLower ? pred2030 <= bVal : pred2030 >= bVal;
                                const gap = Math.abs(pred2030 - bVal);
                                return (
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                                    met 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {met ? '✓ Target Milestone Met' : `Gap to Benchmark: ${gap.toFixed(1)} ${targetInfo.unit}`}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            <Badge variant={getBadgeVariant(dashboardData.status)} className="px-3 py-1.5 text-sm font-semibold">
                              {dashboardData.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Axes units indicator line above the chart */}
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
                          <div className="inline-flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-md text-slate-700 font-medium flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">X-Axis Unit:</span>
                              <span className="font-bold text-navy">Year</span>
                            </div>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Y-Axis Unit:</span>
                              <span className="font-bold text-navy">{targetInfo.unit || 'Score / Rate'}</span>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            Historical Actuals &amp; 2030 Regression Projection
                          </div>
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
                                tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(val)} 
                                domain={[
                                  dataMin => (dataMin >= 0 ? Math.max(0, dataMin - (dataMin * 0.05)) : dataMin - (Math.abs(dataMin) * 0.05)),
                                  dataMax => dataMax + (Math.abs(dataMax) * 0.05)
                                ]}
                                width={85}
                                label={{ 
                                  value: targetInfo.unit || 'Score / Rate', 
                                  angle: -90, 
                                  position: 'insideLeft', 
                                  offset: 0,
                                  style: { textAnchor: 'middle', fill: '#475569', fontSize: 11, fontWeight: 600 } 
                                }}
                              />
                              <Tooltip content={<CustomTooltip unit={targetInfo.unit} />} />
                              <Legend verticalAlign="top" height={36} iconType="circle" />
                              
                              {/* Historical Solid Line */}
                              <Line name="Historical Data" type="monotone" dataKey="actualValue" stroke={goalColor} strokeWidth={2.5} connectNulls={true} dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5, stroke: goalColor, strokeWidth: 2 }} />
                              
                              {/* 2030 Regression Forecast Dashed Line */}
                              <Line name="Statistical Trend Forecast (2030)" type="monotone" dataKey="predictedValue" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 5" connectNulls={true} dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5, stroke: '#7c3aed', strokeWidth: 2 }} />
                              
                              {/* Official UN 2030 Target Reference Line (Rendered for all targets and countries) */}
                              {targetInfo.benchmarkValue !== null && targetInfo.benchmarkValue !== undefined && (
                                <ReferenceLine 
                                  y={targetInfo.benchmarkValue} 
                                  stroke="#e11d48" 
                                  strokeDasharray="4 4" 
                                  strokeWidth={1.75}
                                  label={{ 
                                    value: targetInfo.benchmarkLabel || 'UN 2030 Target', 
                                    fill: '#e11d48', 
                                    fontSize: 10, 
                                    fontWeight: 700, 
                                    position: 'insideTopRight' 
                                  }} 
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* 2-line Layman Disclaimer Box */}
                        <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                          <div className="leading-relaxed">
                            <strong className="text-slate-800">How is this forecast generated? </strong>
                            This trajectory uses statistical linear regression on historical UN and World Bank indicator data (2015–2025). It models current velocity and projects expected 2030 outcomes assuming existing policy environments continue.
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100 pdf-hide">
                          <Button variant="outline" className="text-slate-600 bg-white hover:bg-slate-50 border-slate-200 h-9 px-4 transition-all" onClick={handleExportCSV}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> <span className="text-sm font-medium">Export CSV</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            disabled={isSavingChart}
                            className="text-slate-600 bg-white hover:bg-slate-50 border-slate-200 h-9 px-4 transition-all" 
                            onClick={handleSaveChart}
                          >
                            {isSavingChart ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            <span className="text-sm font-medium">{isSavingChart ? 'Saving...' : 'Save Chart'}</span>
                          </Button>
                          <ExportDossierButton 
                            chartId="trajectory-chart-container" 
                            context={{
                              countryCode: selectedCountry,
                              countryName: countryName,
                              goalNumber: goalNum,
                              goalTitle: goal?.title || `Goal ${goalNum}`,
                              selectedTarget: selectedTarget,
                              targetTitle: targetInfo.title,
                              indicatorName: targetInfo.indicatorName,
                              unit: targetInfo.unit,
                              polarity: targetInfo.polarity,
                              benchmarkValue: targetInfo.benchmarkValue,
                              benchmarkLabel: targetInfo.benchmarkLabel,
                              baselineValue: dashboardData?.chart_data?.find(d => d.actualValue !== null && d.actualValue !== undefined)?.actualValue,
                              projectedValue2030: dashboardData?.chart_data?.find(d => d.Year === 2030)?.predictedValue,
                              status: dashboardData?.status || 'Unknown',
                              aiNarrative: generateDynamicLaymanInsight({
                                countryName: countryName,
                                goalNumber: goalNum,
                                goalName: goal.title,
                                targetCode: selectedTarget,
                                status: dashboardData?.status,
                                chartData: dashboardData?.chart_data,
                              }),
                              policyBriefSummary: dashboardData?.ai_narrative || '',
                              sdgContext: getSDGContext(selectedTarget),
                              goalColor: goalColor,
                            }} 
                          />
                        </div>
                      </div>

                      {/* Context + Layman Insight */}
                      <div className="space-y-6">
                        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                          <h4 className="text-sm font-semibold text-warm-gray flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4 text-slate-400" /> <span>Target Overview</span>
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            <strong className="font-semibold text-slate-800">SDG Context: </strong>
                            {getSDGContext(selectedTarget)}
                          </p>
                        </div>

                        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: goalColor }} />
                          <div className="flex items-center justify-between mb-3 pl-2">
                            <h4 className="text-sm font-semibold text-warm-gray flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-600" /> <span>AI Trajectory Diagnosis</span>
                            </h4>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              Automated Insight
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-700 leading-relaxed font-medium pl-2 mb-3">
                            {generateDynamicLaymanInsight({
                              countryName: countryName,
                              goalNumber: goalNum,
                              goalName: goal.title,
                              targetCode: selectedTarget,
                              status: dashboardData.status,
                              chartData: dashboardData.chart_data,
                            })}
                          </p>

                          {dashboardData.ai_narrative && dashboardData.ai_narrative.trim().length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 pl-2">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1.5">
                                <Bot className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Policy Brief Summary</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                                "{dashboardData.ai_narrative}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {!loading && dashboardData && dashboardData.error && (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-xl max-w-3xl">
                      <h3 className="font-semibold text-red-700 mb-2">Failed to load forecast data</h3>
                      <p className="text-red-600 text-sm">{dashboardData.ai_narrative}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: WHAT-IF POLICY SIMULATOR */}
              {activeTab === 'simulator' && (
                <div className="animate-in fade-in duration-300">
                  <PolicySimulator goalNumber={goalNum} isEmbedded={true} />
                </div>
              )}

              {/* TAB 3: COUNTRY BENCHMARKING */}
              {activeTab === 'benchmark' && (
                <div className="animate-in fade-in duration-300">
                  <CountryComparison goalNumber={goalNum} isEmbedded={true} />
                </div>
              )}

              {/* TAB 4: DATA TABLE & TIME SERIES */}
              {activeTab === 'datatable' && (
                <div className="animate-in fade-in duration-300">
                  <DataTableTab
                    dashboardData={dashboardData}
                    countryName={countryName}
                    countryCode={selectedCountry}
                    targetInfo={targetInfo}
                    goalColor={goalColor}
                    onGenerateForecast={handleGenerate}
                    loading={loading}
                  />
                </div>
              )}

            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-cream relative z-10 py-8 text-center text-sm text-slate-500">
            <div className="max-w-6xl mx-auto px-6 space-y-1">
              <p>© 2026 SDG Trajectory — Academic Project Prototype</p>
              <p className="text-xs text-slate-400">
                This tool is for educational and research purposes. Data sourced from the United Nations SDG API and Our World in Data.
              </p>
            </div>
          </footer>
        </main>
      </div>

      <CopilotDrawer 
        context={{
          countryCode: selectedCountry,
          countryName: countryName,
          selectedTarget: selectedTarget,
          targetName: targetInfo?.name,
          unit: targetInfo?.unit,
          polarity: targetInfo?.polarity,
          benchmarkValue: targetInfo?.benchmarkValue,
          benchmarkLabel: targetInfo?.benchmarkLabel,
          baselineValue: dashboardData?.chart_data?.find(d => d.Year === 2015)?.actualValue,
          projectedValue2030: dashboardData?.chart_data?.find(d => d.Year === 2030)?.predictedValue,
          status: dashboardData?.status,
          historicalData: dashboardData?.chart_data
        }} 
      />
    </div>
  );
}
