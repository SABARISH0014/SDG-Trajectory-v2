import { API_BASE_URL } from '@/config';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Loader2, 
  ArrowLeft, 
  Target, 
  AlertCircle, 
  Search, 
  ChevronDown, 
  Globe2, 
  HelpCircle, 
  TrendingUp, 
  Info, 
  Home, 
  ChevronRight, 
  SlidersHorizontal, 
  Scale 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Badge } from '../components/ui/Badge';
import { sdgColors } from '../data/sdgColors';
import { sdgGoalsContent } from '../data/sdgGoalsContent';
import { COUNTRIES } from '../lib/constants';
import CopilotDrawer from '../components/CopilotDrawer';
import SplashScreenOverlay from '../components/SplashScreenOverlay';
import { formatMetricValue, getTargetDetails } from '../data/sdgTargetsData';

const SDG_NAMES = {
  1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health and Well-being',
  4: 'Quality Education', 5: 'Gender Equality', 6: 'Clean Water and Sanitation',
  7: 'Affordable and Clean Energy', 8: 'Decent Work and Economic Growth',
  9: 'Industry, Innovation and Infrastructure', 10: 'Reduced Inequalities',
  11: 'Sustainable Cities and Communities', 12: 'Responsible Consumption and Production',
  13: 'Climate Action', 14: 'Life Below Water', 15: 'Life on Land',
  16: 'Peace, Justice and Strong Institutions', 17: 'Partnerships for the Goals',
};

export default function CountryDataPage() {
  const { countryCode } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Country dropdown search state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Resolve country code to full name
  const countryName = COUNTRIES.find(c => c.code === countryCode)?.name || countryCode;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [countryCode]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/country/${countryCode}/profile`);
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [dropdownOpen]);

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (code) => {
    setDropdownOpen(false);
    setSearchQuery('');
    if (code && code !== countryCode) {
      navigate(`/country/${code}`);
    }
  };

  const getStatusBadge = (status, onDark = false) => {
    switch (status) {
      case "On-track":
        return (
          <Badge className={onDark
            ? "bg-emerald-500 text-white border-emerald-400 font-semibold shadow-sm"
            : "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
          }>On-track</Badge>
        );
      case "At-risk":
        return (
          <Badge className={onDark
            ? "bg-amber-500 text-white border-amber-400 font-semibold shadow-sm"
            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"
          }>At-risk</Badge>
        );
      case "Off-track":
        return (
          <Badge className={onDark
            ? "bg-rose-500 text-white border-rose-400 font-semibold shadow-sm"
            : "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
          }>Off-track</Badge>
        );
      default:
        return (
          <Badge className={onDark
            ? "bg-white/20 text-white/90 border-white/30"
            : "bg-slate-100 text-slate-600 border-slate-200"
          }>No Data</Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-cream text-warm-gray font-sans flex flex-col">
      <Navbar />

      {/* Breadcrumbs Bar */}
      <div className="bg-slate-100 border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-navy flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link to="/countries" className="hover:text-navy">
              Countries Directory
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-navy">{countryName}</span>
          </div>

          {/* Quick Country Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm focus:outline-none transition-colors"
            >
              <Globe2 className="w-3.5 h-3.5 text-teal-600" />
              <span className="font-semibold">{countryName}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white text-slate-900 border border-slate-300 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2.5 border-b border-slate-200 bg-slate-50">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search countries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-navy bg-white text-slate-900"
                    />
                  </div>
                </div>
                <ul className="max-h-60 overflow-y-auto py-1 text-xs">
                  {filteredCountries.length === 0 ? (
                    <li className="px-3 py-2 text-slate-400 text-center">No countries found</li>
                  ) : (
                    filteredCountries.map(c => (
                      <li key={c.code}>
                        <button
                          type="button"
                          onClick={() => handleCountrySelect(c.code)}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors flex items-center justify-between ${c.code === countryCode ? 'bg-indigo-50 font-bold text-indigo-900' : 'text-slate-800'}`}
                        >
                          <span>{c.name}</span>
                          {c.code === countryCode && <span className="text-[10px] text-indigo-600 font-semibold">Active</span>}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-0">
        
        {/* Title & Overview Banner */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-300 pb-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-slate-500 block mb-1">
                National SDG Intelligence Overview
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-warm-gray tracking-tight">
                SDG Profile: <span className="text-navy">{countryName}</span>
                <span className="ml-3 text-sm font-mono font-medium px-2.5 py-1 rounded bg-slate-200 text-slate-700">
                  {countryCode}
                </span>
              </h1>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                to={`/simulator?country=${countryCode}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Simulate Policy</span>
              </Link>
              <Link
                to={`/compare?countryA=${countryCode}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Benchmark Nation</span>
              </Link>
            </div>
          </div>

          <p className="mt-4 text-base text-slate-600 max-w-4xl leading-relaxed">
            A comprehensive profile of <strong>{countryName}</strong> across all 17 Sustainable Development Goals. 
            Review baseline progress, statistical 2030 projections, and identify areas requiring policy intervention.
          </p>

          {/* Context Explainer Box: What the numbers mean */}
          <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-3.5">
            <Info className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong className="text-slate-800 font-semibold block mb-0.5">How to read these metrics:</strong>
              Scores reflect the national primary indicator for each SDG goal. For index scores (0–100), <strong>100 represents full achievement</strong> of the 2030 SDG benchmark, and 0 represents baseline deprivation. Click on any goal card below to open its dedicated forecast with <strong>{countryName}</strong> pre-selected.
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <SplashScreenOverlay message={`Analyzing trajectory data for ${countryName}...`} />
        )}

        {/* Error Alert */}
        {error && (
          <div className="border border-red-200 bg-red-50 max-w-2xl p-6 rounded-lg flex items-start gap-4 shadow-sm">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Connection Error</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* 17 SDG Cards Grid */}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
            {data.goals.map((goal) => {
              const goalNum = parseInt(goal.goal, 10);
              const goalColor = sdgColors[goalNum] || '#1B2A4A';
              const goalName = goal.name || SDG_NAMES[goalNum] || `Goal ${goal.goal}`;
              const targetDetail = getTargetDetails(`${goalNum}.1`, goalNum);

              return (
                <div
                  key={goal.goal}
                  className="flex flex-col border border-slate-200 transition-all duration-200 overflow-hidden bg-white rounded-xl shadow-sm hover:shadow-md hover:border-slate-300"
                >
                  {/* Themed Card Header */}
                  <div
                    className="p-4 flex items-center justify-between gap-4 text-white"
                    style={{ backgroundColor: goalColor }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-white/80" />
                        <span className="text-xs uppercase tracking-wider font-bold text-white/90">Goal {goal.goal}</span>
                      </div>
                      <h3 className="text-base font-serif font-bold text-white truncate" title={goalName}>
                        {goalName}
                      </h3>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(goal.status, true)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-white">
                    {goal.status === "No Data" || goal.status === "Insufficient Data" ? (
                      <div className="text-center text-slate-400 text-xs italic py-6">
                        Insufficient historical data for a reliable 2030 projection.
                      </div>
                    ) : (
                      <>
                        {/* Values grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 p-3 border border-slate-100 rounded-lg">
                            <span className="block text-[11px] font-medium text-slate-500 mb-1">Latest Actual</span>
                            <span className="text-xl font-bold text-navy block">
                              {goal.current_value != null ? formatMetricValue(goal.current_value) : '--'}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-1 leading-tight">
                              {targetDetail.unit}
                            </span>
                          </div>

                          <div className="bg-purple-50/60 p-3 border border-purple-100 rounded-lg">
                            <span className="block text-[11px] font-medium text-purple-700 mb-1">2030 Projection</span>
                            <span className="text-xl font-bold text-purple-900 block">
                              {goal.projected_value != null ? formatMetricValue(goal.projected_value) : '--'}
                            </span>
                            <span className="block text-[10px] text-purple-500 mt-1 leading-tight">
                              Statistical Forecast
                            </span>
                          </div>
                        </div>

                        {/* Impact description snippet */}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {targetDetail.impactOnGoal}
                        </p>
                      </>
                    )}

                    {/* Action Navigation Link - passes countryCode in query parameter */}
                    <div className="pt-2 border-t border-slate-100">
                      <Link
                        to={`/goal/${goal.goal}?country=${countryCode}`}
                        className="text-xs font-semibold text-navy hover:text-teal-600 flex items-center justify-between group py-1 transition-colors"
                      >
                        <span>Explore Goal {goal.goal} Forecast for {countryName}</span>
                        <span className="transition-transform group-hover:translate-x-1 font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-cream mt-12 py-8 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>© 2026 SDG Trajectory — Academic Project Prototype</p>
          <p className="text-xs text-slate-400">Data synthesized from United Nations SDG Indicators and World Bank Open Data.</p>
        </div>
      </footer>

      <CopilotDrawer 
        context={{
          countryCode: countryCode,
          countryName: countryName,
          selectedTarget: 'All Goals (Macro National Profile)',
          status: 'Mixed',
          historicalData: data?.goals?.map(g => ({ Goal: g.goal, Status: g.status, ProjectedValue: g.projected_value })) || []
        }} 
      />
    </div>
  );
}
