import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { SlidersHorizontal, Play, Info, Sparkles, BookOpen, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { COUNTRIES, TARGETS } from '../lib/constants';
import { getTargetDetails, generateLaymanInsight, generateDynamicLaymanInsight, formatMetricValue } from '../data/sdgTargetsData';
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
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';

export default function PolicySimulator({ goalNumber }) {
  const [selectedCountry, setSelectedCountry] = useState('IND');

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

  const [policyMultiplier, setPolicyMultiplier] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [simulatedStatus, setSimulatedStatus] = useState(null);

  const targetInfo = useMemo(() => {
    return getTargetDetails(selectedTarget, goalNumber);
  }, [selectedTarget, goalNumber]);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/simulate`, {
        params: { 
          country_code: selectedCountry, 
          sdg_target: selectedTarget,
          policy_impact_multiplier: policyMultiplier
        }
      });
      
      const { historical_data, predictions, status } = response.data;
      const chartData = [];
      
      historical_data.forEach(d => {
        chartData.push({ Year: d.Year, actualValue: d.IndicatorValue, predictedValue: null });
      });

      if (historical_data.length > 0 && predictions.length > 0) {
        const validHistorical = historical_data.filter(d => d.IndicatorValue !== null);
        if (validHistorical.length > 0) {
          const lastActual = validHistorical[validHistorical.length - 1];
          const chartIndex = chartData.findIndex(d => d.Year === lastActual.Year);
          if (chartIndex !== -1) {
            chartData[chartIndex].predictedValue = lastActual.IndicatorValue;
          }
        }
      }
      
      predictions.forEach(p => {
        chartData.push({ Year: p.Year, actualValue: null, predictedValue: p.PredictedValue });
      });

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

  const getMultiplierLabel = (val) => {
    if (val === 1.0) return "Baseline Pace (1.0x)";
    if (val > 1.0) return `Accelerated (+${Math.round((val - 1.0) * 100)}% speed)`;
    return `Decelerated (-${Math.round((1.0 - val) * 100)}% speed)`;
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Header & Layman Description */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SlidersHorizontal className="w-6 h-6 text-navy" />
          <h3 className="text-2xl font-serif font-bold text-warm-gray">What-If Policy Simulator</h3>
        </div>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Test how different policy decisions, investments, or disruptions could transform future outcomes. 
          Adjust the policy speed slider below to simulate how accelerated implementation or systemic slowdowns 
          will shift this country's 2030 results.
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

      {/* Controls & Policy Multiplier */}
      <div className="border border-slate-200 bg-white p-6 rounded-lg shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Country</label>
            <select 
              className="w-full h-11 px-3 border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-navy rounded-md"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          
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
            <div className="flex justify-between items-center text-sm font-medium text-slate-700">
              <span>Policy Multiplier</span>
              <span className="text-navy font-bold px-2 py-0.5 rounded bg-navy/10 text-xs">
                {getMultiplierLabel(policyMultiplier)}
              </span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="1.5" 
              step="0.1" 
              value={policyMultiplier}
              onChange={(e) => setPolicyMultiplier(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-navy"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>Slowdown (0.5x)</span>
              <span>Baseline (1.0x)</span>
              <span>Accelerate (1.5x)</span>
            </div>
          </div>

          <Button onClick={handleSimulate} disabled={loading} className="w-full h-11" size="lg">
            {loading ? "Simulating..." : <><Play className="w-4 h-4 mr-2" /> Run Simulation</>}
          </Button>
        </div>

        {/* Policy Multiplier Simple Description */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-600 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="leading-relaxed">
            <strong className="text-slate-800">What does the Policy Multiplier do? </strong>
            The multiplier simulates how government funding, law enforcement, or external crises alter the velocity of change. 
            A setting of <strong>1.2x</strong> simulates a <strong>20% speedup</strong> (e.g. increased budget, technology transfer, or policy reforms), 
            while <strong>0.8x</strong> simulates a <strong>20% slowdown</strong> (e.g. austerity, supply bottlenecks, or delayed implementation).
          </div>
        </div>
      </div>

      {/* Chart & Insights */}
      {loading ? (
        <div className="border border-slate-200 bg-white p-6 rounded-lg shadow-sm">
          <Skeleton className="w-full h-[350px]" />
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Container */}
          <div className="lg:col-span-2 border border-slate-200 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h4 className="text-lg font-serif font-semibold text-warm-gray">
                  Policy Scenario Trajectory (2015–2030)
                </h4>
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
                  <Line name="Historical Baseline" type="monotone" dataKey="actualValue" stroke="#1B2A4A" strokeWidth={2.5} dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }} />
                  <Line name={`Simulated Policy Trajectory (${policyMultiplier.toFixed(1)}x)`} type="monotone" dataKey="predictedValue" stroke="#10b981" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5, stroke: '#059669', strokeWidth: 2 }} />
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
          </div>

          {/* Simulation Layman Insight Box */}
          <div className="space-y-6">
            <div className="border border-slate-200 bg-white p-6 rounded-lg shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
              <h4 className="text-sm font-semibold text-warm-gray flex items-center gap-2 mb-3 pl-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> 2030 Policy Impact Insight
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed font-medium pl-2 mb-3">
                {generateDynamicLaymanInsight({
                  countryName: COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry,
                  goalNumber: goalNumber || targetInfo.goalNumber,
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
                <BookOpen className="w-4 h-4 text-slate-400" /> Indicator Breakdown
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
}
