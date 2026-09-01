import { API_BASE_URL } from '@/config';
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { Scale, Play, Activity, Info, Trophy, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TARGETS, COUNTRIES } from '../lib/constants';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const formatLargeNumber = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
};

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

  useEffect(() => {
    if (!filteredTargets.find(t => t.code === selectedTarget)) {
      setSelectedTarget(filteredTargets[0]?.code || '13.2');
    }
  }, [goalNumber, filteredTargets, selectedTarget]);

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
                tickFormatter={(val) => formatLargeNumber(val)}
                width={65}
                label={{ value: targetInfo.unit, angle: -90, position: 'insideLeft', offset: -5, fill: '#475569', fontSize: 11, fontWeight: 500 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
                formatter={(val) => [`${formatLargeNumber(val)} ${targetInfo.unit}`, '']}
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
            <Select value={selectedTarget} onValueChange={setSelectedTarget} disabled={loading}>
              <SelectTrigger className="w-full h-11 bg-white">
                <SelectValue placeholder="Select Target" />
              </SelectTrigger>
              <SelectContent>
                {filteredTargets.map(t => {
                  const info = getTargetDetails(t.code, goalNumber);
                  return <SelectItem key={t.code} value={t.code}><span className="notranslate">{t.code}</span> <span>— {info.title}</span></SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-navy block"></span> <span>Country A</span>
            </label>
            <Select value={countryA} onValueChange={setCountryA} disabled={loading}>
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
            <Select value={countryB} onValueChange={setCountryB} disabled={loading}>
              <SelectTrigger className="w-full h-11 bg-white">
                <SelectValue placeholder="Select Country B" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleCompare} disabled={loading} className="w-full h-11" size="lg">
            {loading ? <><Loader2 className="animate-spin w-4 h-4 mr-2" /> <span>Fetching Data...</span></> : <><Play className="w-4 h-4 mr-2" /> <span>Compare Trajectories</span></>}
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
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-sm text-slate-700 leading-relaxed">
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
}
