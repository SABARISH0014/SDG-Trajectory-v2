import { API_BASE_URL } from '@/config';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { SlidersHorizontal, Play, Info, Sparkles, BookOpen, HelpCircle, Loader2, Home, ChevronRight, Globe2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/Button';
import ExportDossierButton from '../components/ExportDossierButton';
import SplashScreenOverlay from '../components/SplashScreenOverlay';
import { TARGETS, COUNTRIES } from '../lib/constants';
import { getTargetDetails, generateDynamicLaymanInsight, formatMetricValue } from '../data/sdgTargetsData';
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
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import TargetSelectItem from '../components/TargetSelectItem';
import { Slider } from '../components/ui/slider';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 text-white border border-slate-700 shadow-2xl p-3 rounded-lg z-[100] text-xs pointer-events-none notranslate">
        <p className="font-semibold text-slate-400 border-b border-slate-800 pb-1 mb-1.5">
          Year (X): <span className="text-white font-bold">{label}</span>
        </p>
        {payload.map((entry, index) => {
          if (entry.value === null || entry.value === undefined) return null;
          const isPredicted = entry.dataKey === 'predictedValue';
          return (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {isPredicted ? 'Forecast (Y):' : 'Historical (Y):'}
              </span>
              <span className="font-mono font-bold text-white">
                {new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const formatLargeNumber = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
};

export default function PolicySimulator({ goalNumber, isEmbedded = false }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params initialization
  const urlCountry = searchParams.get('country');
  const urlTarget = searchParams.get('target');
  const urlGoal = searchParams.get('goal');
  const urlMultiplier = parseFloat(searchParams.get('multiplier') || '1.0');

  const effectiveGoalNumber = goalNumber || (urlGoal ? parseInt(urlGoal, 10) : null);

  const [selectedCountry, setSelectedCountry] = useState(() => {
    if (urlCountry && COUNTRIES.some(c => c.code === urlCountry)) return urlCountry;
    return 'IND';
  });

  // Filter targets to this goal if effectiveGoalNumber is provided
  const filteredTargets = useMemo(() => {
    if (!effectiveGoalNumber) return TARGETS;
    return TARGETS.filter(t => {
      const goalPart = parseInt(t.code.split('.')[0], 10);
      return goalPart === effectiveGoalNumber;
    });
  }, [effectiveGoalNumber]);

  const [selectedTarget, setSelectedTarget] = useState(() => {
    if (urlTarget && TARGETS.some(t => t.code === urlTarget)) return urlTarget;
    if (effectiveGoalNumber) {
      const first = TARGETS.find(t => parseInt(t.code.split('.')[0], 10) === effectiveGoalNumber);
      return first ? first.code : '1.1';
    }
    return '1.1';
  });

  useEffect(() => {
    if (!filteredTargets.find(t => t.code === selectedTarget)) {
      setSelectedTarget(filteredTargets[0]?.code || '1.1');
    }
  }, [effectiveGoalNumber, filteredTargets, selectedTarget]);

  const [policyMultiplier, setPolicyMultiplier] = useState(
    !isNaN(urlMultiplier) && urlMultiplier >= 0.5 && urlMultiplier <= 1.5 ? urlMultiplier : 1.0
  );
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [simulatedStatus, setSimulatedStatus] = useState(null);

  const targetInfo = useMemo(() => {
    return getTargetDetails(selectedTarget, effectiveGoalNumber);
  }, [selectedTarget, effectiveGoalNumber]);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/simulate`, {
        params: { 
          country_code: selectedCountry, 
          sdg_target: selectedTarget,
          policy_impact_multiplier: policyMultiplier
        }
      });
      
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

      setData(chartData);
      setSimulatedStatus(status);
    } catch (error) {
      console.error("Simulation failed:", error);
      setData([]);
      setSimulatedStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run simulation on initial load if standalone
  useEffect(() => {
    if (!isEmbedded && !data) {
      handleSimulate();
    }
  }, []);

  const getMultiplierLabel = (val) => {
    if (val === 1.0) return "Baseline Pace (1.0x)";
    if (val > 1.0) return `Accelerated (+${Math.round((val - 1.0) * 100)}% speed)`;
    return `Decelerated (-${Math.round((1.0 - val) * 100)}% speed)`;
  };

  const content = (
    <div className="w-full space-y-6">
      {/* Header & Layman Description */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SlidersHorizontal className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-warm-gray">What-If Policy Simulator</h2>
        </div>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Test how different policy decisions, investments, or disruptions transform future outcomes. 
          Adjust the policy speed slider below to simulate how accelerated implementation or systemic slowdowns 
          shift this country's 2030 results.
        </p>
      </div>

      {/* Target Context Card */}
      <div key={selectedTarget} className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
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

      {/* Controls & Policy Multiplier */}
      <div className="border border-slate-200 bg-white p-6 rounded-lg shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Country</label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={loading}>
              <SelectTrigger className="w-full h-11 bg-white">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
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
            <div className="flex justify-between items-center text-sm font-medium text-slate-700">
              <span>Policy Multiplier</span>
              <span className="text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-xs">
                {getMultiplierLabel(policyMultiplier)}
              </span>
            </div>
            <Slider 
              min={0.5} 
              max={1.5} 
              step={0.1} 
              value={[policyMultiplier]}
              onValueChange={(vals) => setPolicyMultiplier(vals[0])}
              disabled={loading}
              className="w-full py-2"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>Slowdown (0.5x)</span>
              <span>Baseline (1.0x)</span>
              <span>Accelerate (1.5x)</span>
            </div>
          </div>

          <div className="flex gap-2">
            {!isEmbedded && (
              <Button
                variant="outline"
                onClick={() => navigate(`/country/${selectedCountry}`)}
                className="h-11 border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                title="View country profile"
              >
                Profile
              </Button>
            )}
            <Button onClick={handleSimulate} disabled={loading} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white" size="lg">
              {loading ? <><Loader2 className="animate-spin w-4 h-4 mr-2" /> <span>Simulating...</span></> : <><Play className="w-4 h-4 mr-2" /> <span>Run Simulation</span></>}
            </Button>
          </div>
        </div>

        {/* Policy Multiplier Simple Description */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-600 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="leading-relaxed">
            <strong className="text-slate-800">What does the Policy Multiplier do? </strong>
            The multiplier models how government budget allocations, technological transfers, or systemic shocks modify the rate of progress. 
            A value of <strong>1.2x</strong> simulates a <strong>20% acceleration</strong>, 
            while <strong>0.8x</strong> represents a <strong>20% deceleration</strong>.
          </div>
        </div>
      </div>

      {/* Chart & Insights */}
      {loading ? (
        <>
          <SplashScreenOverlay message="Simulating Policy Trajectory..." />
          <div className="border border-slate-200 bg-white p-6 rounded-lg shadow-sm">
            <Skeleton className="w-full h-[350px]" />
          </div>
        </>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Container */}
          <div id="policy-simulator-chart-container" className="lg:col-span-2 border border-slate-200 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-lg font-serif font-semibold text-warm-gray">
                    Policy Scenario Trajectory (2015–2030)
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Y-Axis: {targetInfo.unit}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparing baseline historical trajectory against simulated policy multiplier ({policyMultiplier.toFixed(1)}x).
                </p>
              </div>
              {simulatedStatus && (
                <Badge variant={simulatedStatus.toLowerCase().includes('track') ? 'success' : simulatedStatus.toLowerCase().includes('risk') ? 'warning' : 'destructive'} className="px-3 py-1 text-xs font-semibold">
                  Scenario: {simulatedStatus}
                </Badge>
              )}
            </div>

            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
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
                    width={65}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line name="Historical Baseline" type="monotone" dataKey="actualValue" stroke="#1B2A4A" strokeWidth={2.5} connectNulls={true} dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }} />
                  <Line name={`Simulated Policy Trajectory (${policyMultiplier.toFixed(1)}x)`} type="monotone" dataKey="predictedValue" stroke="#10b981" strokeWidth={2.5} strokeDasharray="5 5" connectNulls={true} dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5, stroke: '#059669', strokeWidth: 2 }} />
                  
                  {targetInfo.benchmarkValue !== null && (
                    <ReferenceLine 
                      y={targetInfo.benchmarkValue} 
                      stroke="#e11d48" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.75}
                      label={{ 
                        value: targetInfo.benchmarkLabel || 'UN 2030 Benchmark', 
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

            {/* 2-line Disclaimer */}
            <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-slate-800">Simulation Method: </strong>
                This simulation dynamically scales the statistical linear regression slope by {policyMultiplier.toFixed(1)}x starting from the latest recorded data point. It provides an illustrative model of potential 2030 development trajectories under varying policy conditions.
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end pdf-hide">
              <ExportDossierButton 
                chartId="policy-simulator-chart-container" 
                context={{
                  countryCode: selectedCountry,
                  countryName: COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry,
                  selectedTarget: selectedTarget,
                  baselineValue: data?.find(d => d.Year === 2015)?.actualValue,
                  projectedValue2030: data?.find(d => d.Year === 2030)?.predictedValue,
                  status: simulatedStatus || 'Unknown',
                }} 
              />
            </div>
          </div>

          {/* Simulation Layman Insight Box */}
          <div className="space-y-6">
            <div className="border border-slate-200 bg-white p-6 rounded-lg shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
              <h4 className="text-sm font-semibold text-warm-gray flex items-center gap-2 mb-3 pl-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> <span>2030 Policy Impact Insight</span>
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed font-medium pl-2 mb-3">
                {generateDynamicLaymanInsight({
                  countryName: COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry,
                  goalNumber: effectiveGoalNumber || targetInfo.goalNumber,
                  goalName: targetInfo.goalName,
                  targetCode: selectedTarget,
                  status: simulatedStatus || 'On-track',
                  chartData: data,
                  policyMultiplier: policyMultiplier,
                })}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 pl-2">
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                  Policy Takeaway:
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {policyMultiplier >= 1.0 
                    ? `Maintaining or exceeding this ${policyMultiplier.toFixed(1)}x policy momentum protects essential public welfare and drives sustainable progress for ${targetInfo.title}.`
                    : `Slowing down to ${policyMultiplier.toFixed(1)}x introduces structural risks that may hinder national SDG achievement by 2030.`
                  }
                </p>
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-6 rounded-lg shadow-sm">
              <h4 className="text-sm font-semibold text-warm-gray flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-slate-400" /> <span>Indicator Breakdown</span>
              </h4>
              <ul className="text-xs text-slate-600 space-y-2">
                <li>• <strong>Target:</strong> {targetInfo.code} — {targetInfo.title}</li>
                <li>• <strong>Indicator:</strong> {targetInfo.indicatorName}</li>
                <li>• <strong>Standard Unit:</strong> {targetInfo.unit}</li>
                <li>• <strong>Target Direction:</strong> {targetInfo.polarity === 'lower_is_better' ? 'Reduction required (Lower is better)' : 'Expansion required (Higher is better)'}</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-lg text-slate-400 space-y-3">
          <SlidersHorizontal className="w-12 h-12 opacity-30 text-navy" />
          <p className="text-sm font-medium text-slate-600">Select a country, target, and policy multiplier, then click <strong>Run Simulation</strong>.</p>
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
      <Navbar />
      
      {/* Breadcrumb Bar */}
      <div className="bg-slate-100 border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-navy flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> <span>Home</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-navy">Policy Simulator</span>
          {selectedCountry && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-700">{COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry}</span>
            </>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {content}
      </main>

      <footer className="border-t border-slate-200 bg-cream mt-12 py-8 text-center text-xs text-slate-500">
        <p>© 2026 SDG Trajectory — What-If Policy Simulation Model</p>
      </footer>
    </div>
  );
}
