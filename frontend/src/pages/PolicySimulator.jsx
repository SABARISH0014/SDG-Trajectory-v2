import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { SlidersHorizontal, ArrowRight, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { COUNTRIES, TARGETS } from '../lib/constants';
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

export default function PolicySimulator() {
  const [selectedCountry, setSelectedCountry] = useState('IND');
  const [selectedTarget, setSelectedTarget] = useState('13.2');
  const [policyMultiplier, setPolicyMultiplier] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      console.log("Sending simulation request to backend...");
      const response = await axios.get(`http://localhost:8000/api/simulate`, {
        params: { 
          country_code: selectedCountry, 
          sdg_target: selectedTarget,
          policy_impact_multiplier: policyMultiplier
        }
      });
      
      console.log("Received simulation response:", response.data);
      const { historical_data, predictions } = response.data;
      const chartData = [];
      
      historical_data.forEach(d => {
        chartData.push({ Year: d.Year, actualValue: d.IndicatorValue, predictedValue: null });
      });

      if (historical_data.length > 0 && predictions.length > 0) {
        // find the last actual data point that is not null to bridge the line
        const validHistorical = historical_data.filter(d => d.IndicatorValue !== null);
        if (validHistorical.length > 0) {
            const lastActual = validHistorical[validHistorical.length - 1];
            // find the index in chartData
            const chartIndex = chartData.findIndex(d => d.Year === lastActual.Year);
            if (chartIndex !== -1) {
                chartData[chartIndex].predictedValue = lastActual.IndicatorValue;
            }
        }
      }
      
      predictions.forEach(p => {
        chartData.push({ Year: p.Year, actualValue: null, predictedValue: p.PredictedValue });
      });

      console.log("Processed chartData:", chartData);
      setData(chartData);
    } catch (error) {
      console.error("Simulation failed. Details:", error);
      setData([]); // fallback empty array to show "no data" or handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col p-6 space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700 min-h-0 overflow-hidden">
      <Card className="border-slate-200 shadow-md flex-shrink-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-primary" />
            What-If Policy Simulator
          </CardTitle>
          <p className="text-sm text-slate-500">Adjust the policy impact multiplier to scale the rate of change and simulate alternative 2030 trajectories.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Country</label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Target</label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
              >
                {TARGETS.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex justify-between">
                <span>Policy Multiplier</span>
                <span className="text-primary font-bold">{policyMultiplier.toFixed(1)}x</span>
              </label>
              <input 
                type="range" 
                min="0.5" 
                max="1.5" 
                step="0.1" 
                value={policyMultiplier}
                onChange={(e) => setPolicyMultiplier(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>Slower (0.5x)</span>
                <span>Baseline (1.0x)</span>
                <span>Faster (1.5x)</span>
              </div>
            </div>

            <Button onClick={handleSimulate} disabled={loading} className="w-full h-10 shadow-sm">
              {loading ? "Simulating..." : <><Play className="w-4 h-4 mr-2" /> Run Simulation</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chart Section */}
      <Card className="flex-1 border-slate-200 shadow-md min-h-0 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-6 flex flex-col min-h-0">
          {loading ? (
            <Skeleton className="w-full h-full rounded-xl" />
          ) : data && data.length > 0 ? (
            <div className="w-full" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="Year" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line name="Historical Data" type="monotone" dataKey="actualValue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  <Line name={`Simulated Forecast (${policyMultiplier.toFixed(1)}x)`} type="monotone" dataKey="predictedValue" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <SlidersHorizontal className="w-12 h-12 opacity-20" />
              <p>Configure settings and run simulation to view trajectory.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
