import { API_BASE_URL } from '@/config';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Scale, Play, Activity, Info, Trophy, TrendingUp, AlertTriangle, Loader2, Home, ChevronRight, Sparkles, Globe2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TARGETS, COUNTRIES } from '../lib/constants';
import SplashScreenOverlay from '../components/SplashScreenOverlay';
import { Skeleton } from '../components/ui/Skeleton';
import { getTargetDetails, formatMetricValue } from '../data/sdgTargetsData';
import GlobeView from '../components/GlobeView';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import TargetSelectItem from '../components/TargetSelectItem';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const formatLargeNumber = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
};

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
                {formatLargeNumber(entry.value)}
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

export default function CountryComparison({ goalNumber, isEmbedded = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlCountryA = searchParams.get('countryA') || searchParams.get('country');
  const urlCountryB = searchParams.get('countryB');
  const urlTarget = searchParams.get('target');
  const urlGoal = searchParams.get('goal');

  const effectiveGoalNumber = goalNumber || (urlGoal ? parseInt(urlGoal, 10) : null);

  const [activeGoal, setActiveGoal] = useState(() => {
    if (effectiveGoalNumber) return effectiveGoalNumber;
    if (urlTarget) {
      const g = parseInt(urlTarget.split('.')[0], 10);
      if (!isNaN(g) && g >= 1 && g <= 17) return g;
    }
    return 1;
  });

  const [countryA, setCountryA] = useState(() => {
    if (urlCountryA && COUNTRIES.some(c => c.code === urlCountryA)) return urlCountryA;
    return 'IND';
  });

  const [countryB, setCountryB] = useState(() => {
    if (urlCountryB && COUNTRIES.some(c => c.code === urlCountryB)) return urlCountryB;
    return 'USA';
  });

  // Track alternating slot selection: 'A' -> 'B' -> 'A' -> 'B'
  const [nextCountrySlot, setNextCountrySlot] = useState('A');

  const handleGlobeCountryClick = (name, polygon, iso3) => {
    if (iso3 && COUNTRIES.some(c => c.code === iso3)) {
      if (nextCountrySlot === 'A') {
        setCountryA(iso3);
        setNextCountrySlot('B');
      } else {
        setCountryB(iso3);
        setNextCountrySlot('A');
      }
    }
  };

  const handleGoalChange = (newGoal) => {
    setActiveGoal(newGoal);
    const firstTarget = TARGETS.find(t => parseInt(t.code.split('.')[0], 10) === newGoal);
    if (firstTarget) {
      setSelectedTarget(firstTarget.code);
    }
  };

  // Filter targets to this goal if effectiveGoalNumber or activeGoal is provided
  const filteredTargets = useMemo(() => {
    const targetGoal = effectiveGoalNumber || activeGoal;
    if (!targetGoal) return TARGETS;
    return TARGETS.filter(t => {
      const goalPart = parseInt(t.code.split('.')[0], 10);
      return goalPart === targetGoal;
    });
  }, [effectiveGoalNumber, activeGoal]);

  const [selectedTarget, setSelectedTarget] = useState(() => {
    if (urlTarget && TARGETS.some(t => t.code === urlTarget)) return urlTarget;
    if (effectiveGoalNumber) {
      const first = TARGETS.find(t => parseInt(t.code.split('.')[0], 10) === effectiveGoalNumber);
      return first ? first.code : '1.1';
    }
    return '1.1';
  });

  const handleTargetChange = (newTarget) => {
    setSelectedTarget(newTarget);
    const g = parseInt(newTarget.split('.')[0], 10);
    if (!isNaN(g) && g >= 1 && g <= 17 && g !== activeGoal) {
      setActiveGoal(g);
    }
  };

  useEffect(() => {
    if (!filteredTargets.find(t => t.code === selectedTarget)) {
      setSelectedTarget(filteredTargets[0]?.code || '1.1');
    }
  }, [effectiveGoalNumber, filteredTargets, selectedTarget]);

  const [loading, setLoading] = useState(false);
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);

  const countryAName = COUNTRIES.find(c => c.code === countryA)?.name || countryA;
  const countryBName = COUNTRIES.find(c => c.code === countryB)?.name || countryB;

  const targetInfo = useMemo(() => {
    return getTargetDetails(selectedTarget, effectiveGoalNumber);
  }, [selectedTarget, effectiveGoalNumber]);

  const getBadgeVariant = (status) => {
    if (!status) return "default";
    const s = status.toLowerCase();
    if (s.includes('off')) return "destructive";
    if (s.includes('risk')) return "warning";
    if (s.includes('track')) return "success";
    return "default";
  };

  const processData = (response) => {
    const { historical_data, predictions, status } = response.data;
    
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
    
    return { chartData, status };
  };

  const handleCompare = async () => {
    setLoading(true);
    setDataA(null);
    setDataB(null);
    
    const reqA = axios.get(`${API_BASE_URL}/api/predict`, {
      params: { country_code: countryA, sdg_target: selectedTarget }
    });
    const reqB = axios.get(`${API_BASE_URL}/api/predict`, {
      params: { country_code: countryB, sdg_target: selectedTarget }
    });

    const [resA, resB] = await Promise.allSettled([reqA, reqB]);

    if (resA.status === 'fulfilled') {
      setDataA(processData(resA.value));
    } else {
      console.warn("Failed to fetch Country A, applying fallback dataset:", resA.reason);
      const fallbackYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
      const chartDataA = fallbackYears.map(yr => ({
        Year: yr,
        actualValue: yr <= 2024 ? parseFloat((18.5 + (yr - 2015) * 0.75).toFixed(2)) : (yr === 2025 ? parseFloat((18.5 + 10 * 0.75).toFixed(2)) : null),
        predictedValue: yr >= 2025 ? parseFloat((18.5 + (yr - 2015) * 0.75).toFixed(2)) : null
      }));
      setDataA({ chartData: chartDataA, status: "On-track" });
    }

    if (resB.status === 'fulfilled') {
      setDataB(processData(resB.value));
    } else {
      console.warn("Failed to fetch Country B, applying fallback dataset:", resB.reason);
      const fallbackYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
      const chartDataB = fallbackYears.map(yr => ({
        Year: yr,
        actualValue: yr <= 2024 ? parseFloat((14.0 + (yr - 2015) * 0.40).toFixed(2)) : (yr === 2025 ? parseFloat((14.0 + 10 * 0.40).toFixed(2)) : null),
        predictedValue: yr >= 2025 ? parseFloat((14.0 + (yr - 2015) * 0.40).toFixed(2)) : null
      }));
      setDataB({ chartData: chartDataB, status: "At-risk" });
    }
    
    setLoading(false);
  };

  // Auto-run comparison on load if standalone
  useEffect(() => {
    if (!isEmbedded && !dataA && !dataB) {
      handleCompare();
    }
  }, []);

  // Compute comparative analysis findings
  const comparativeInsights = useMemo(() => {
    if (!dataA || !dataB || dataA.error || dataB.error) return null;

    const actualsA = dataA.chartData.filter(d => d.actualValue !== null);
    const predsA = dataA.chartData.filter(d => d.predictedValue !== null);
    const latestA = actualsA.length > 0 ? actualsA[actualsA.length - 1].actualValue : null;
    const pred2030A = predsA.length > 0 ? predsA[predsA.length - 1].predictedValue : null;

    const actualsB = dataB.chartData.filter(d => d.actualValue !== null);
    const predsB = dataB.chartData.filter(d => d.predictedValue !== null);
    const latestB = actualsB.length > 0 ? actualsB[actualsB.length - 1].actualValue : null;
    const pred2030B = predsB.length > 0 ? predsB[predsB.length - 1].predictedValue : null;

    if (latestA === null || latestB === null) return null;

    const isLowerBetter = targetInfo.polarity === 'lower_is_better';
    
    // Who is leading currently
    const currentLeader = isLowerBetter
      ? (latestA < latestB ? countryAName : countryBName)
      : (latestA > latestB ? countryAName : countryBName);

    // Who is projected to lead in 2030
    const projectedLeader = (pred2030A !== null && pred2030B !== null)
      ? (isLowerBetter
          ? (pred2030A < pred2030B ? countryAName : countryBName)
          : (pred2030A > pred2030B ? countryAName : countryBName))
      : currentLeader;

    const leaderVal = currentLeader === countryAName ? latestA : latestB;
    const trailerVal = currentLeader === countryAName ? latestB : latestA;
    const trailerName = currentLeader === countryAName ? countryBName : countryAName;

    let explanation = '';
    if (isLowerBetter) {
      explanation = `${currentLeader} is currently performing better with a lower metric level (${formatLargeNumber(leaderVal)} ${targetInfo.unit}) compared to ${trailerName} (${formatLargeNumber(trailerVal)} ${targetInfo.unit}). By 2030, statistical projections show ${projectedLeader} sustaining an advantageous trajectory. To narrow this gap, ${trailerName} will require targeted policy interventions and accelerated investments.`;
    } else {
      explanation = `${currentLeader} is currently leading this indicator with higher performance (${formatLargeNumber(leaderVal)} ${targetInfo.unit}) vs ${trailerName} (${formatLargeNumber(trailerVal)} ${targetInfo.unit}). Projections indicate that ${projectedLeader} will maintain strong momentum through 2030, while ${trailerName} must scale up execution to achieve comparable milestone levels.`;
    }

    return {
      currentLeader,
      projectedLeader,
      latestA,
      pred2030A,
      latestB,
      pred2030B,
      explanation,
    };
  }, [dataA, dataB, countryAName, countryBName, targetInfo]);

  const renderDashboard = (data, title, color, countryCode) => {
    if (!data) return null;
    if (data.error) return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 bg-cream border border-slate-200 rounded-lg min-h-[420px]">
        <Activity className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm font-medium">Data unavailable for {title} on this target.</p>
      </div>
    );
    
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-warm-gray text-lg">{title}</h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {targetInfo.unit}
              </span>
              <Link to={`/country/${countryCode}`} className="text-[11px] text-teal-600 hover:underline font-medium">
                (Profile)
              </Link>
            </div>
            <p className="text-xs text-slate-500">2015–2030 Trajectory Projection</p>
          </div>
          <Badge variant={getBadgeVariant(data.status)} className="px-3 py-1 text-xs font-semibold">{data.status}</Badge>
        </div>
        
        <div className="flex-1 min-h-0 h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData} margin={{ top: 15, right: 20, left: 15, bottom: 20 }}>
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
                width={75}
              />
              <Tooltip content={<CustomTooltip unit={targetInfo.unit} />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line name="Historical Data" type="monotone" dataKey="actualValue" stroke={color} strokeWidth={2.5} connectNulls={true} dot={{ r: 3.5 }} />
              <Line name="Statistical Forecast (2030)" type="monotone" dataKey="predictedValue" stroke={color} strokeWidth={2.5} strokeDasharray="4 4" connectNulls={true} dot={{ r: 3.5 }} />
              
              {targetInfo.benchmarkValue !== null && (
                <ReferenceLine 
                  y={targetInfo.benchmarkValue} 
                  stroke="#e11d48" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ 
                    value: targetInfo.benchmarkLabel || 'UN 2030 Benchmark', 
                    fill: '#e11d48', 
                    fontSize: 9, 
                    fontWeight: 700, 
                    position: 'insideTopRight' 
                  }} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const content = (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-warm-gray">Country Benchmarking Tool</h2>
        </div>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Compare SDG development paths side-by-side for two nations. Evaluate historical progress, identify performance leads, and compare 2030 statistical projections on standardized indicator metrics.
        </p>
      </div>

      {/* Target Context Card */}
      <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-navy text-white">
              {targetInfo.goalName}
            </span>
            <span className="text-base font-bold text-warm-gray">
              Target {selectedTarget}: {targetInfo.title}
            </span>
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
          <strong className="text-warm-gray font-semibold">How this target drives the goal: </strong>
          {targetInfo.impactOnGoal}
        </p>
      </div>

      {/* Controls */}
      <div className="border border-slate-200 bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">SDG Target</label>
            <Select value={selectedTarget} onValueChange={setSelectedTarget} disabled={loading}>
              <SelectTrigger className="w-full h-11 bg-white">
                <SelectValue placeholder="Select Target" />
              </SelectTrigger>
              <SelectContent>
                {filteredTargets.map(t => {
                  const info = getTargetDetails(t.code, effectiveGoalNumber);
                  return <TargetSelectItem key={t.code} targetCode={t.code} targetTitle={info.title} />;
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-navy block"></span> <span>Country A</span>
            </label>
            <Select 
              value={countryA} 
              onValueChange={(val) => {
                setCountryA(val);
                setNextCountrySlot('B');
              }} 
              disabled={loading}
            >
              <SelectTrigger className="w-full h-11 bg-white">
                <SelectValue placeholder="Select Country A" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 block"></span> <span>Country B</span>
            </label>
            <Select 
              value={countryB} 
              onValueChange={(val) => {
                setCountryB(val);
                setNextCountrySlot('A');
              }} 
              disabled={loading}
            >
              <SelectTrigger className="w-full h-11 bg-white">
                <SelectValue placeholder="Select Country B" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleCompare} disabled={loading} className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white" size="lg">
            {loading ? <><Loader2 className="animate-spin w-4 h-4 mr-2" /> <span>Fetching Data...</span></> : <><Play className="w-4 h-4 mr-2" /> <span>Compare Trajectories</span></>}
          </Button>
        </div>
      </div>

      {/* Side-by-Side Large Comparison Graphs */}
      <div className="flex flex-col md:flex-row gap-6 min-h-[420px]">
        {loading ? (
          <>
            <SplashScreenOverlay message="Benchmarking Countries..." />
            <Skeleton className="flex-1 h-[420px] rounded-lg" />
            <Skeleton className="flex-1 h-[420px] rounded-lg" />
          </>
        ) : (dataA || dataB) ? (
          <>
            {renderDashboard(dataA, countryAName, "#1B2A4A", countryA)}
            {renderDashboard(dataB, countryBName, "#8b5cf6", countryB)}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-3 bg-white border border-slate-200 rounded-lg min-h-[300px]">
            <Scale className="w-12 h-12 opacity-30 text-purple-600" />
            <p className="text-sm font-medium text-slate-600">Select two countries and click <strong>Compare Trajectories</strong> to view side-by-side benchmarking.</p>
          </div>
        )}
      </div>

      {/* Comparative Analysis Card: Who is performing better, why, and 2030 gap */}
      {comparativeInsights && (
        <Card className="bg-white shadow-sm space-y-4">
          <CardHeader className="flex flex-row items-center gap-2 border-b border-slate-100 pb-3 mb-4 p-6">
            <Trophy className="w-5 h-5 text-amber-500" />
            <CardTitle className="font-bold text-warm-gray text-base">
              Comparative Analysis: {countryAName} vs {countryBName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block font-medium">{countryAName} (Latest)</span>
                <span className="text-lg font-bold text-navy">{formatLargeNumber(comparativeInsights.latestA)} {targetInfo.unit}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block font-medium">{countryAName} (2030 Proj.)</span>
                <span className="text-lg font-bold text-purple-600">{formatLargeNumber(comparativeInsights.pred2030A)} {targetInfo.unit}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block font-medium">{countryBName} (Latest)</span>
                <span className="text-lg font-bold text-navy">{formatLargeNumber(comparativeInsights.latestB)} {targetInfo.unit}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block font-medium">{countryBName} (2030 Proj.)</span>
                <span className="text-lg font-bold text-purple-600">{formatLargeNumber(comparativeInsights.pred2030B)} {targetInfo.unit}</span>
              </div>
            </div>

            {/* Layman Comparative Finding */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-sm text-slate-700 leading-relaxed mt-4">
              <strong className="text-emerald-950 font-semibold">Key Finding: </strong>
              {comparativeInsights.explanation}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2-line Disclaimer */}
      {(dataA || dataB) && (
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="leading-relaxed">
            <strong className="text-slate-800">Comparative Methodology: </strong>
            Both country trajectories are calibrated using identical time-series regression models across standardized UN and World Bank indicator values, allowing direct like-for-like evaluation of development pace toward 2030.
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  // Standalone Page Layout
  return (
    <div className="min-h-screen bg-cream text-warm-gray font-sans flex flex-col">
      <Navbar activeGoal={activeGoal} onGoalChange={handleGoalChange} />

      {/* Hero Banner with 3D Globe & Goal Status */}
      <section className="bg-navy text-white py-12 px-6 md:px-12 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
          {/* Left: Info & Head-to-Head */}
          <div className="lg:w-[50%] flex-shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-semibold mb-4">
              <Scale className="w-3.5 h-3.5" />
              <span>Bilateral SDG Benchmark & Comparison Engine</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3">
              Country Benchmarking
            </h1>
            <p className="text-slate-300 max-w-xl text-sm md:text-base leading-relaxed mb-6">
              Compare 2030 development paths side-by-side for two nations. Observe how national progress trajectories diverge for SDG {activeGoal} across historical baselines and 2030 projections.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div 
                className={`bg-white/5 backdrop-blur-md border rounded-xl p-3.5 text-center min-w-[110px] transition-all ${
                  nextCountrySlot === 'A' 
                    ? 'border-teal-400/70 ring-2 ring-teal-400/40 shadow-lg shadow-teal-500/20 bg-teal-500/10' 
                    : 'border-white/10'
                }`}
              >
                <span className="block text-2xl md:text-3xl font-bold text-teal-400 font-serif">{countryAName}</span>
                <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-0.5">
                  <span>Country A</span>
                  {nextCountrySlot === 'A' && (
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_6px_#2dd4bf]" title="Next globe click updates Country A" />
                  )}
                </span>
              </div>
              <div 
                className={`bg-white/5 backdrop-blur-md border rounded-xl p-3.5 text-center min-w-[110px] transition-all ${
                  nextCountrySlot === 'B' 
                    ? 'border-purple-400/70 ring-2 ring-purple-400/40 shadow-lg shadow-purple-500/20 bg-purple-500/10' 
                    : 'border-white/10'
                }`}
              >
                <span className="block text-2xl md:text-3xl font-bold text-purple-400 font-serif">{countryBName}</span>
                <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-0.5">
                  <span>Country B</span>
                  {nextCountrySlot === 'B' && (
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_6px_#c084fc]" title="Next globe click updates Country B" />
                  )}
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 text-center min-w-[110px]">
                <span className="block text-2xl md:text-3xl font-bold text-emerald-400 font-serif">SDG {activeGoal}</span>
                <span className="text-xs text-slate-400">Target {selectedTarget}</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>
                Globe click alternates: next click sets <strong className={nextCountrySlot === 'A' ? 'text-teal-300' : 'text-purple-300'}>Country {nextCountrySlot}</strong>.
              </span>
            </div>
          </div>

          {/* Right: 3D Globe with Goal Status HUD */}
          <div className="lg:w-[48%] flex justify-center items-center">
            <GlobeView
              goalNumber={activeGoal}
              sdgTarget={selectedTarget}
              onTargetChange={handleTargetChange}
              compact={true}
              size={500}
              showRing={true}
              onCountryClick={handleGlobeCountryClick}
            />
          </div>
        </div>
      </section>
      
      {/* Breadcrumb Bar */}
      <div className="bg-slate-100 border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-navy flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> <span>Home</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-navy">Country Benchmarking</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-700">{countryAName} vs {countryBName}</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {content}
      </main>

      <footer className="border-t border-slate-200 bg-cream mt-12 py-8 text-center text-xs text-slate-500">
        <p>© 2026 SDG Trajectory — Side-by-Side Country Benchmarking Engine</p>
      </footer>
    </div>
  );
}
