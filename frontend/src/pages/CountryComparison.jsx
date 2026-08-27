import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { Scale, Play, Activity, Info, Trophy, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { COUNTRIES, TARGETS } from '../lib/constants';
import { Skeleton } from '../components/ui/Skeleton';
import { getTargetDetails, formatMetricValue } from '../data/sdgTargetsData';
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

export default function CountryComparison({ goalNumber }) {
  const [countryA, setCountryA] = useState('IND');
  const [countryB, setCountryB] = useState('USA');

  // Filter targets to this goal if goalNumber is provided
  const filteredTargets = useMemo(() => {
    if (!goalNumber) return TARGETS;
    return TARGETS.filter(t => {
      const goalPart = parseInt(t.code.split('.')[0], 10);
      return goalPart === goalNumber;
    });
  }, [goalNumber]);

  const [selectedTarget, setSelectedTarget] = useState(() => {
    if (goalNumber) {
      const first = TARGETS.find(t => parseInt(t.code.split('.')[0], 10) === goalNumber);
      return first ? first.code : '13.2';
    }
    return '13.2';
  });

  const [loading, setLoading] = useState(false);
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);

  const countryAName = COUNTRIES.find(c => c.code === countryA)?.name || countryA;
  const countryBName = COUNTRIES.find(c => c.code === countryB)?.name || countryB;

  const targetInfo = useMemo(() => {
    return getTargetDetails(selectedTarget, goalNumber);
  }, [selectedTarget, goalNumber]);

  const getBadgeVariant = (status) => {
    if (!status) return "default";
    const s = status.toLowerCase();
    if (s.includes('track')) return "success";
    if (s.includes('risk')) return "warning";
    if (s.includes('off')) return "destructive";
    return "default";
  };

  const processData = (response) => {
    const { historical_data, predictions, status } = response.data;
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
    
    return { chartData, status };
  };

  const handleCompare = async () => {
    setLoading(true);
    setDataA(null);
    setDataB(null);
    
    const reqA = axios.get(`/api/predict`, {
      params: { country_code: countryA, sdg_target: selectedTarget }
    });
    const reqB = axios.get(`/api/predict`, {
      params: { country_code: countryB, sdg_target: selectedTarget }
    });

    const [resA, resB] = await Promise.allSettled([reqA, reqB]);

    if (resA.status === 'fulfilled') {
      setDataA(processData(resA.value));
    } else {
      console.error("Failed to fetch Country A", resA.reason);
      setDataA({ error: true });
    }

    if (resB.status === 'fulfilled') {
      setDataB(processData(resB.value));
    } else {
      console.error("Failed to fetch Country B", resB.reason);
      setDataB({ error: true });
    }
    
    setLoading(false);
  };

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
      explanation = `${currentLeader} is currently performing better with a lower metric level (${formatMetricValue(leaderVal)} ${targetInfo.unit}) compared to ${trailerName} (${formatMetricValue(trailerVal)} ${targetInfo.unit}). By 2030, statistical projections show ${projectedLeader} sustaining an advantageous trajectory. To narrow this gap, ${trailerName} will require targeted policy interventions and accelerated investments.`;
    } else {
      explanation = `${currentLeader} is currently leading this indicator with higher performance (${formatMetricValue(leaderVal)} ${targetInfo.unit}) vs ${trailerName} (${formatMetricValue(trailerVal)} ${targetInfo.unit}). Projections indicate that ${projectedLeader} will maintain strong momentum through 2030, while ${trailerName} must scale up execution to achieve comparable milestone levels.`;
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

  const renderDashboard = (data, title, color) => {
    if (!data) return null;
    if (data.error) return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 bg-cream border border-slate-200 rounded-lg min-h-[420px]">
        <Activity className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm font-medium">Data unavailable for {title} on this target.</p>
      </div>
    );
    
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-warm-gray text-lg">{title}</h4>
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
                tickFormatter={(val) => formatMetricValue(val)}
                width={65}
                label={{ value: targetInfo.unit, angle: -90, position: 'insideLeft', offset: -5, fill: '#475569', fontSize: 11, fontWeight: 500 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
                formatter={(val) => [`${formatMetricValue(val)} ${targetInfo.unit}`, '']}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line name="Historical Data" type="monotone" dataKey="actualValue" stroke={color} strokeWidth={2.5} dot={{ r: 3.5 }} />
              <Line name="Statistical Forecast (2030)" type="monotone" dataKey="predictedValue" stroke={color} strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-6 h-6 text-navy" />
          <h3 className="text-2xl font-serif font-bold text-warm-gray">Country Benchmarking Tool</h3>
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
            <select 
              className="w-full h-11 px-3 border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-navy rounded-md"
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
            >
              {filteredTargets.map(t => {
                const info = getTargetDetails(t.code, goalNumber);
                return <option key={t.code} value={t.code}>{t.code} — {info.title}</option>;
              })}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-navy block"></span> Country A
            </label>
            <select 
              className="w-full h-11 px-3 border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-navy rounded-md"
              value={countryA}
              onChange={(e) => setCountryA(e.target.value)}
            >
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 block"></span> Country B
            </label>
            <select 
              className="w-full h-11 px-3 border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-navy rounded-md"
              value={countryB}
              onChange={(e) => setCountryB(e.target.value)}
            >
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>

          <Button onClick={handleCompare} disabled={loading} className="w-full h-11" size="lg">
            {loading ? "Fetching Data..." : <><Play className="w-4 h-4 mr-2" /> Compare Trajectories</>}
          </Button>
        </div>
      </div>

      {/* Side-by-Side Large Comparison Graphs */}
      <div className="flex flex-col md:flex-row gap-6 min-h-[420px]">
        {loading ? (
          <>
            <Skeleton className="flex-1 h-[420px] rounded-lg" />
            <Skeleton className="flex-1 h-[420px] rounded-lg" />
          </>
        ) : (dataA || dataB) ? (
          <>
            {renderDashboard(dataA, countryAName, "#1B2A4A")}
            {renderDashboard(dataB, countryBName, "#8b5cf6")}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-3 bg-white border border-slate-200 rounded-lg min-h-[300px]">
            <Scale className="w-12 h-12 opacity-30 text-navy" />
            <p className="text-sm font-medium text-slate-600">Select two countries and click <strong>Compare Trajectories</strong> to view side-by-side benchmarking.</p>
          </div>
        )}
      </div>

      {/* Comparative Analysis Card: Who is performing better, why, and 2030 gap */}
      {comparativeInsights && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-warm-gray text-base">
              Comparative Analysis: {countryAName} vs {countryBName}
            </h4>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block font-medium">{countryAName} (Latest)</span>
              <span className="text-lg font-bold text-navy">{formatMetricValue(comparativeInsights.latestA)} {targetInfo.unit}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block font-medium">{countryAName} (2030 Proj.)</span>
              <span className="text-lg font-bold text-purple-600">{formatMetricValue(comparativeInsights.pred2030A)} {targetInfo.unit}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block font-medium">{countryBName} (Latest)</span>
              <span className="text-lg font-bold text-navy">{formatMetricValue(comparativeInsights.latestB)} {targetInfo.unit}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block font-medium">{countryBName} (2030 Proj.)</span>
              <span className="text-lg font-bold text-purple-600">{formatMetricValue(comparativeInsights.pred2030B)} {targetInfo.unit}</span>
            </div>
          </div>

          {/* Layman Comparative Finding */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-sm text-slate-700 leading-relaxed">
            <strong className="text-emerald-950 font-semibold">Key Finding: </strong>
            {comparativeInsights.explanation}
          </div>
        </div>
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
}
