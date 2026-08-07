import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ArrowLeft, Target, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function CountryDataPage() {
  const { countryCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:8000/api/country/${countryCode}/profile`);
        setData(response.data);
      } catch (err) {
        setError("Failed to load country profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    if (countryCode) {
      fetchProfile();
    }
  }, [countryCode]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "On-track":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">On-track</Badge>;
      case "At-risk":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">At-risk</Badge>;
      case "Off-track":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">Off-track</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200">No Data</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="flex items-center text-sm font-medium text-slate-600 hover:text-blue-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-0">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            SDG Profile: <span className="text-blue-900 uppercase">{countryCode}</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl">
            A comprehensive overview of the country's trajectory across all 17 Sustainable Development Goals by 2030.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Analyzing trajectory data...</p>
          </div>
        )}

        {error && (
          <Card className="border-red-200 shadow-sm bg-red-50 max-w-2xl">
            <CardContent className="p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800">Connection Error</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
            {data.goals.map((goal) => (
              <Card key={goal.goal} className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden min-h-0 bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-blue-700 opacity-70" />
                      <span className="text-sm font-semibold text-blue-900">Goal {goal.goal}</span>
                    </div>
                    <CardTitle className="text-base text-slate-800 truncate" title={goal.name}>
                      {goal.name}
                    </CardTitle>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(goal.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-5 flex-1 flex flex-col justify-center min-h-0 bg-white">
                  {goal.status === "No Data" || goal.status === "Insufficient Data" ? (
                    <div className="text-center text-slate-400 text-sm italic">
                      Insufficient historical data for a reliable 2030 projection.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <span className="block text-xs font-medium text-slate-500 mb-1">Latest Value</span>
                        <span className="text-lg font-bold text-slate-700">
                          {goal.current_value != null ? goal.current_value.toFixed(2) : '--'}
                        </span>
                      </div>
                      <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                        <span className="block text-xs font-medium text-slate-500 mb-1">2030 Projection</span>
                        <span className="text-lg font-bold text-blue-900">
                          {goal.projected_value != null ? goal.projected_value.toFixed(2) : '--'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
