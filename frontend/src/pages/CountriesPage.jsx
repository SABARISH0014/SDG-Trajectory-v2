import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Globe2, 
  Search, 
  ArrowRight, 
  SlidersHorizontal, 
  Scale, 
  Activity, 
  Sparkles,
  BarChart3,
  Filter
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { COUNTRIES } from '../lib/constants';
import { Button } from '../components/ui/Button';

export default function CountriesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Available starting letters
  const alphabet = ['ALL', ...Array.from(new Set(COUNTRIES.map(c => c.name[0].toUpperCase()))).sort()];

  // Filter countries
  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLetter = selectedLetter === 'ALL' || c.name[0].toUpperCase() === selectedLetter;
      return matchesSearch && matchesLetter;
    });
  }, [searchQuery, selectedLetter]);

  return (
    <div className="min-h-screen bg-cream text-warm-gray font-sans flex flex-col">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-navy text-white py-14 px-6 md:px-12 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-300 text-xs font-semibold mb-4">
              <Globe2 className="w-3.5 h-3.5" />
              <span>National SDG Intelligence Directory</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3">
              Explore Countries & Territories
            </h1>
            <p className="text-slate-300 max-w-2xl text-base leading-relaxed">
              Explore national SDG profiles, trajectory projections toward 2030, and policy scenarios for 250+ nations and territories across all 17 Sustainable Development Goals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center min-w-[120px]">
              <span className="block text-3xl font-bold text-teal-400 font-serif">{COUNTRIES.length}</span>
              <span className="text-xs text-slate-400">Total Territories</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center min-w-[120px]">
              <span className="block text-3xl font-bold text-purple-400 font-serif">17</span>
              <span className="text-xs text-slate-400">SDGs Tracked</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center min-w-[120px]">
              <span className="block text-3xl font-bold text-emerald-400 font-serif">2030</span>
              <span className="text-xs text-slate-400">Target Year</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 z-20 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 md:p-6 space-y-4">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by country name or 3-letter ISO code (e.g., India, IND, Germany, DEU)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-navy focus:bg-white focus:ring-2 focus:ring-navy/10 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Letter filter bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-2">
              <Filter className="w-3.5 h-3.5" /> Letter:
            </span>
            {alphabet.map(letter => (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedLetter(letter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                  selectedLetter === letter
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Countries Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Results count */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
          <p className="text-sm font-medium text-slate-600">
            Showing <strong className="text-navy">{filteredCountries.length}</strong> countries
            {selectedLetter !== 'ALL' && ` starting with "${selectedLetter}"`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>

          <Link to="/compare" className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" />
            <span>Benchmark two countries</span>
          </Link>
        </div>

        {/* Empty state */}
        {filteredCountries.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
            <Globe2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-serif font-bold text-warm-gray">No countries found</h3>
            <p className="text-xs text-slate-500">
              No country matches "{searchQuery}". Try a different spelling or reset the filter.
            </p>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(''); setSelectedLetter('ALL'); }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Country Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredCountries.map(country => (
            <div
              key={country.code}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-inner flex-shrink-0">
                    {country.code}
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    ISO-3
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base text-slate-900 leading-snug group-hover:text-navy transition-colors mb-2 line-clamp-2" title={country.name}>
                  {country.name}
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-2 mt-3">
                <Link
                  to={`/country/${country.code}`}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <span>View SDG Profile</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    to={`/simulator?country=${country.code}`}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-medium border border-emerald-200 transition-colors"
                    title="Run policy simulator for this country"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-emerald-600" />
                    <span>Simulate</span>
                  </Link>

                  <Link
                    to={`/compare?countryA=${country.code}`}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-medium border border-purple-200 transition-colors"
                    title="Benchmark this country against another"
                  >
                    <Scale className="w-3 h-3 text-purple-600" />
                    <span>Benchmark</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-cream mt-12 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>© 2026 SDG Trajectory — Academic Project Prototype</p>
          <p className="text-slate-400">Data synthesized from United Nations SDG Indicators and World Bank Open Data.</p>
        </div>
      </footer>
    </div>
  );
}
