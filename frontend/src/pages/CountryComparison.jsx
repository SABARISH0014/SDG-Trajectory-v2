import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Scale, ArrowRight, Activity, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { COUNTRIES, TARGETS } from '../lib/constants';
import { Skeleton } from '../components/ui/Skeleton';
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

export default function CountryComparison() {
  const [countryA, setCountryA] = useState('IND');
  const [countryB, setCountryB] = useState('USA');
  const [selectedTarget, setSelectedTarget] = useState('13.2');
  const [loading, setLoading] = useState(false);
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);

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
    
    const reqA = axios.get(`http://localhost:8000/api/predict`, {
      params: { country_code: countryA, sdg_target: selectedTarget }
    });
    const reqB = axios.get(`http://localhost:8000/api/predict`, {
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

  const renderDashboard = (data, title, color) => {
    if (!data) return null;
    if (data.error) return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <Activity className="w-8 h-8 mb-2 opacity-50" />
        <p>Data unavailable or request failed.</p>
      </div>
    );
    
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-semibold text-slate-800">{title}</h4>
          <Badge variant={getBadgeVariant(data.status)} className="shadow-sm">{data.status}</Badge>
        </div>
        
        <div className="flex-1 min-h-0 h-[250px] md:h-auto">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="Year" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
              <YAxis tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line name="Actual" type="monotone" dataKey="actualValue" stroke={color} strokeWidth={2} dot={{ r: 3 }} />
              <Line name="Predicted" type="monotone" dataKey="predictedValue" stroke={color} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col p-6 space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700 min-h-0 overflow-hidden">
      <Card className="border-slate-200 shadow-md flex-shrink-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" />
            Country Benchmarking Tool
          </CardTitle>
          <p className="text-sm text-slate-500">Compare SDG trajectories side-by-side. Uses independent fetching to ensure resilience.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
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
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 block"></span> Country A
              </label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={countryB}
                onChange={(e) => setCountryB(e.target.value)}
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>

            <Button onClick={handleCompare} disabled={loading} className="w-full h-10 shadow-sm">
              {loading ? "Fetching Data..." : <><Play className="w-4 h-4 mr-2" /> Compare Trajectories</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden">
        {loading ? (
          <>
            <Skeleton className="flex-1 h-full rounded-xl" />
            <Skeleton className="flex-1 h-full rounded-xl" />
          </>
        ) : (dataA || dataB) ? (
          <>
            {renderDashboard(dataA, COUNTRIES.find(c => c.code === countryA)?.name || countryA, "#3b82f6")}
            {renderDashboard(dataB, COUNTRIES.find(c => c.code === countryB)?.name || countryB, "#a855f7")}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            <Scale className="w-12 h-12 opacity-20" />
            <p>Select countries and click compare to view side-by-side trajectories.</p>
          </div>
        )}
      </div>
    </div>
  );
}
