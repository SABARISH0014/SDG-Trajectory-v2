import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Copy, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Table, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatMetricValue } from '../../data/sdgTargetsData';

export default function DataTableTab({ 
  dashboardData, 
  countryName, 
  countryCode, 
  targetInfo, 
  goalColor,
  onGenerateForecast,
  loading 
}) {
  const [copied, setCopied] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  if (!dashboardData || !dashboardData.chart_data || dashboardData.chart_data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
        <Table className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-serif font-bold text-warm-gray">No Forecast Data Loaded</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Generate a 2030 trajectory forecast above to view the full year-by-year statistical breakdown, historical actuals, and projected milestone figures for {countryName}.
        </p>
        <Button 
          onClick={onGenerateForecast} 
          disabled={loading}
          className="bg-navy text-white hover:bg-slate-800"
        >
          {loading ? "Generating Data..." : "Generate Trajectory Data"}
        </Button>
      </div>
    );
  }

  const rawRows = dashboardData.chart_data.map((row, idx, arr) => {
    const isActual = row.actualValue !== null && row.actualValue !== undefined;
    const value = isActual ? row.actualValue : row.predictedValue;
    
    // Calculate YoY Delta from previous row
    let yoyChange = null;
    if (idx > 0) {
      const prevVal = arr[idx - 1].actualValue !== null && arr[idx - 1].actualValue !== undefined 
        ? arr[idx - 1].actualValue 
        : arr[idx - 1].predictedValue;
      if (prevVal !== null && prevVal !== undefined && prevVal !== 0 && value !== null && value !== undefined) {
        yoyChange = ((value - prevVal) / Math.abs(prevVal)) * 100;
      }
    }

    return {
      year: row.Year,
      isActual,
      type: isActual ? 'Historical Actual' : 'Statistical Forecast (2030)',
      value: value,
      yoyChange: yoyChange
    };
  });

  const sortedRows = sortAsc ? rawRows : [...rawRows].reverse();

  // Metrics summary
  const baseline = rawRows[0]?.value;
  const latestHistorical = [...rawRows].filter(r => r.isActual).pop()?.value;
  const projection2030 = rawRows[rawRows.length - 1]?.value;
  const netDelta = (baseline && projection2030) ? ((projection2030 - baseline) / Math.abs(baseline)) * 100 : null;

  const handleCopy = () => {
    const headers = ['Year', 'Data Type', 'Value', 'Unit', 'YoY Delta (%)'];
    const lines = [headers.join('\t')];
    rawRows.forEach(r => {
      lines.push([
        r.year,
        r.type,
        r.value != null ? r.value.toFixed(3) : 'N/A',
        targetInfo.unit,
        r.yoyChange != null ? `${r.yoyChange.toFixed(2)}%` : '--'
      ].join('\t'));
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportCSV = () => {
    const headers = ['Year', 'DataType', 'Value', 'Unit', 'YoYChangePercent'];
    const lines = [headers.join(',')];
    rawRows.forEach(r => {
      lines.push([
        r.year,
        `"${r.type}"`,
        r.value != null ? r.value : '',
        `"${targetInfo.unit}"`,
        r.yoyChange != null ? r.yoyChange.toFixed(2) : ''
      ].join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sdg_table_${countryCode}_${targetInfo.code}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            2015 Baseline
          </span>
          <span className="text-2xl font-serif font-bold text-navy block">
            {baseline != null ? formatMetricValue(baseline) : '--'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block truncate">
            {targetInfo.unit}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Latest Recorded Actual
          </span>
          <span className="text-2xl font-serif font-bold text-slate-900 block">
            {latestHistorical != null ? formatMetricValue(latestHistorical) : '--'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block truncate">
            UN / World Bank Data
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block mb-1">
            2030 Forecast Milestone
          </span>
          <span className="text-2xl font-serif font-bold text-purple-900 block">
            {projection2030 != null ? formatMetricValue(projection2030) : '--'}
          </span>
          <span className="text-[11px] text-purple-500 mt-1 block truncate">
            Statistical Regression
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Projected 2015-2030 Delta
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {netDelta != null && netDelta > 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            ) : netDelta != null && netDelta < 0 ? (
              <TrendingDown className="w-5 h-5 text-rose-600" />
            ) : (
              <Minus className="w-5 h-5 text-slate-400" />
            )}
            <span className="text-2xl font-serif font-bold text-slate-900">
              {netDelta != null ? `${netDelta > 0 ? '+' : ''}${netDelta.toFixed(1)}%` : '--'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Status: <strong className="text-navy">{dashboardData.status || 'Active'}</strong>
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Table Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-serif font-bold text-lg text-warm-gray">
              Year-by-Year Indicator Series ({countryName})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Target {targetInfo.code}: {targetInfo.title} • Standard Metric: {targetInfo.indicatorName} ({targetInfo.unit})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortAsc(!sortAsc)}
              className="text-xs border-slate-200 h-9"
            >
              <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
              <span>{sortAsc ? 'Year: 2015 → 2030' : 'Year: 2030 → 2015'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs border-slate-200 h-9"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              <span>{copied ? "Copied!" : "Copy Table"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs border-slate-200 h-9 text-teal-700 bg-teal-50/50 hover:bg-teal-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
                <th className="py-3 px-4 sm:px-6">Year</th>
                <th className="py-3 px-4">Series Classification</th>
                <th className="py-3 px-4 text-right">Indicator Value</th>
                <th className="py-3 px-4 text-right">Metric Unit</th>
                <th className="py-3 px-4 sm:px-6 text-right">Year-over-Year Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {sortedRows.map((row) => (
                <tr 
                  key={row.year} 
                  className={`hover:bg-slate-50/80 transition-colors ${
                    !row.isActual ? 'bg-purple-50/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-900 text-sm">
                    {row.year}
                  </td>
                  <td className="py-3.5 px-4">
                    {row.isActual ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: goalColor }} />
                        Historical Actual
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100/70 text-purple-800 border border-purple-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                        Statistical Forecast (2030)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 text-sm">
                    {row.value != null ? formatMetricValue(row.value) : '--'}
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                    {targetInfo.unit}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-mono text-xs">
                    {row.yoyChange != null ? (
                      <span className={`inline-flex items-center gap-0.5 font-semibold ${
                        row.yoyChange > 0 
                          ? 'text-emerald-600' 
                          : row.yoyChange < 0 
                            ? 'text-rose-600' 
                            : 'text-slate-400'
                      }`}>
                        {row.yoyChange > 0 ? '+' : ''}{row.yoyChange.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
