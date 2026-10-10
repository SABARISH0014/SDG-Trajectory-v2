import React from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Target, 
  BarChart3, 
  ShieldCheck, 
  Cpu, 
  ArrowRight,
  Info
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

export default function ForecastPreviewPlaceholder({
  countryName,
  countryCode,
  targetInfo,
  goalColor = '#1B2A4A',
  goalNumber = 1,
  onGenerateForecast,
  loading = false
}) {
  // Generate an illustrative sample trajectory curve for the placeholder chart
  const sampleData = [
    { Year: 2015, sampleActual: 24.2, samplePred: null },
    { Year: 2017, sampleActual: 22.8, samplePred: null },
    { Year: 2019, sampleActual: 21.1, samplePred: null },
    { Year: 2021, sampleActual: 19.5, samplePred: null },
    { Year: 2023, sampleActual: 18.0, samplePred: null },
    { Year: 2024, sampleActual: 17.2, samplePred: 17.2 },
    { Year: 2026, sampleActual: null, samplePred: 15.6 },
    { Year: 2028, sampleActual: null, samplePred: 14.1 },
    { Year: 2030, sampleActual: null, samplePred: 12.5 },
  ];

  const unitLabel = targetInfo?.unit || 'Score / Rate';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 lg:p-8 space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              On-Demand Machine Learning
            </span>
            <span className="text-xs font-medium text-slate-500">
              Target {targetInfo?.code || `${goalNumber}.1`}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-serif font-bold text-warm-gray">
            Trajectory Forecast Preview ({countryName})
          </h3>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-2xl">
            Forecasts are calculated on demand to preserve maximum page speed. Click below to execute statistical linear regression and generate official 2030 projections for <strong className="text-slate-700">{countryName}</strong>.
          </p>
        </div>

        {/* Generate CTA Button */}
        <div className="flex-shrink-0">
          <Button
            onClick={onGenerateForecast}
            disabled={loading}
            size="lg"
            className="w-full md:w-auto h-12 px-6 bg-navy text-white hover:bg-slate-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>{loading ? "Generating 2030 Model..." : "Generate 2030 Forecast"}</span>
            <ArrowRight className="w-4 h-4 text-slate-300 ml-1" />
          </Button>
        </div>
      </div>

      {/* Target Parameters Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
            Target Indicator
          </span>
          <span className="text-xs font-bold text-slate-800 line-clamp-1" title={targetInfo?.indicatorName}>
            {targetInfo?.indicatorName || 'Core SDG Indicator'}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Unit: <strong>{unitLabel}</strong>
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
            Target Benchmark
          </span>
          <span className="text-xs font-bold text-navy line-clamp-1">
            {targetInfo?.benchmarkLabel || (targetInfo?.benchmarkValue !== null ? `UN 2030 Target: ${targetInfo?.benchmarkValue}` : 'Standard Global Target')}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Polarity: <strong>{targetInfo?.polarity === 'lower_is_better' ? 'Lower is better' : 'Higher is better'}</strong>
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
            Forecast Horizon
          </span>
          <span className="text-xs font-bold text-purple-700 block">
            2015 → 2030 Milestone
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Historical Actuals + 2030 Projection
          </span>
        </div>
      </div>

      {/* Illustrative Sample Chart Area with Overlay */}
      <div className="relative border border-slate-200 rounded-xl bg-slate-50/50 p-4 pt-6 overflow-hidden">
        {/* Sample Watermark & Axis Indicators */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
          <div className="inline-flex items-center gap-2 bg-white/90 border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-600">
            <span className="text-slate-400 uppercase text-[9px] font-bold">Preview Axis:</span>
            <span>X: Year | Y: {unitLabel}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 bg-white/80 px-2 py-0.5 rounded border border-slate-200/60">
            ✦ Illustrative Trajectory Preview
          </span>
        </div>

        <div className="h-[280px] w-full opacity-60 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampleData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="Year" 
                tickLine={false} 
                axisLine={{ stroke: '#cbd5e1' }} 
                tick={{ fill: '#64748b', fontSize: 11 }} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={{ stroke: '#cbd5e1' }} 
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={['auto', 'auto']}
              />
              <Line 
                name="Historical Baseline (Sample)" 
                type="monotone" 
                dataKey="sampleActual" 
                stroke={goalColor} 
                strokeWidth={2.5} 
                dot={{ r: 3.5, fill: '#fff', strokeWidth: 2 }} 
                connectNulls={true}
              />
              <Line 
                name="Statistical Trend (Sample)" 
                type="monotone" 
                dataKey="samplePred" 
                stroke="#8b5cf6" 
                strokeWidth={2.5} 
                strokeDasharray="5 5" 
                dot={{ r: 3.5, fill: '#fff', strokeWidth: 2 }} 
                connectNulls={true}
              />
              {targetInfo?.benchmarkValue !== null && targetInfo?.benchmarkValue !== undefined && (
                <ReferenceLine 
                  y={targetInfo.benchmarkValue} 
                  stroke="#e11d48" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Floating Call to Action in Center */}
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1.5px] flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white/95 border border-slate-200 shadow-xl rounded-2xl p-6 max-w-md w-full space-y-3">
            <div className="w-12 h-12 rounded-xl bg-navy text-white flex items-center justify-center mx-auto shadow-md">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-navy">
                Execute 2030 Trajectory Model
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Run statistical regression on official UN and World Bank indicator actuals for <strong className="text-slate-800">{countryName}</strong>.
              </p>
            </div>
            <Button
              onClick={onGenerateForecast}
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{loading ? "Generating..." : "Generate Forecast Now"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Isolation Forest anomaly filtering</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <span>Multilateral UN &amp; World Bank series</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Automated AI strategic diagnosis</span>
        </div>
      </div>
    </div>
  );
}
