import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Globe2, 
  Sparkles, 
  SlidersHorizontal, 
  Scale, 
  ShieldCheck, 
  Search, 
  ChevronDown, 
  Menu, 
  X, 
  Grid, 
  Home, 
  ArrowRight,
  Command,
  BookOpen,
  HelpCircle,
  Download
} from 'lucide-react';
import { sdgColors } from '../data/sdgColors';
import { sdgGoalsContent } from '../data/sdgGoalsContent';
import { COUNTRIES } from '../lib/constants';
import LanguageSwitcher from './LanguageSwitcher';
import { usePWA } from '../context/PWAContext';

export default function Navbar({ activeGoal = null, onGoalChange = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { openInstallModal, isInstalled } = usePWA();

  const [goalsDropdownOpen, setGoalsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const goalsRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (goalsRef.current && !goalsRef.current.contains(e.target)) {
        setGoalsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Ctrl+K or Cmd+K) for Quick Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setGoalsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (searchModalOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [searchModalOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setGoalsDropdownOpen(false);
    setSearchModalOpen(false);
  }, [location.pathname]);

  // Filtered search results
  const filteredCountries = searchQuery.trim() === '' ? [] : COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 6);

  const filteredGoals = searchQuery.trim() === '' ? [] : sdgGoalsContent.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `goal ${g.goalNumber}`.includes(searchQuery.toLowerCase())
  ).slice(0, 4);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 left-0 w-full h-16 bg-navy/95 backdrop-blur-md z-50 border-b border-white/10 shadow-lg select-none text-white">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Navigation */}
          <div className="flex items-center gap-4 xl:gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Globe2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-serif font-bold text-base tracking-tight text-white block leading-tight whitespace-nowrap">
                  SDG <span className="text-teal-400">Trajectory</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block leading-none whitespace-nowrap">
                  Global 2030 Insights
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
              <Link 
                to="/" 
                className={`px-2.5 xl:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive('/') ? 'bg-white/15 text-teal-300' : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Home
              </Link>

              {/* Goals Mega Dropdown */}
              <div className="relative" ref={goalsRef}>
                <button
                  type="button"
                  onClick={() => setGoalsDropdownOpen(!goalsDropdownOpen)}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    isActive('/goal') || goalsDropdownOpen
                      ? 'bg-white/15 text-teal-300' 
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>17 Goals</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${goalsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Goals Dropdown Menu */}
                {goalsDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-[520px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Select an SDG to Explore</span>
                      <Link 
                        to="/goal/1" 
                        onClick={() => setGoalsDropdownOpen(false)}
                        className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
                      >
                        <span>Start at Goal 1</span> <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-[380px] overflow-y-auto pr-1">
                      {sdgGoalsContent.map(g => (
                        <Link
                          key={g.goalNumber}
                          to={`/goal/${g.goalNumber}`}
                          onClick={() => setGoalsDropdownOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 transition-colors group text-left"
                        >
                          <span 
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: sdgColors[g.goalNumber] }}
                          >
                            {g.goalNumber}
                          </span>
                          <span className="text-xs text-slate-200 group-hover:text-white font-medium truncate">
                            {g.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link 
                to="/countries" 
                className={`px-2.5 xl:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive('/countries') || isActive('/country')
                    ? 'bg-white/15 text-teal-300' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Countries</span>
              </Link>

              <Link 
                to="/simulator" 
                className={`px-2.5 xl:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive('/simulator') 
                    ? 'bg-white/15 text-teal-300' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Policy Simulator</span>
              </Link>

              <Link 
                to="/compare" 
                className={`px-2.5 xl:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive('/compare') 
                    ? 'bg-white/15 text-teal-300' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-purple-400" />
                <span>Country Benchmark</span>
              </Link>

              <Link 
                to="/help" 
                className={`px-2.5 xl:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive('/help') || isActive('/docs')
                    ? 'bg-white/15 text-teal-300' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>Docs</span>
              </Link>
            </nav>
          </div>

          {/* Right: Quick Search Omnibox, Language, Admin */}
          <div className="flex items-center gap-3">
            
            {/* Quick Search Icon Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow-inner flex items-center justify-center flex-shrink-0"
              title="Search Countries & Goals (Ctrl+K)"
              aria-label="Quick Search"
            >
              <Search className="w-4 h-4 text-teal-400" />
            </button>

            {/* Install PWA Button (Visible when not already in standalone app) */}
            {!isInstalled && (
              <button
                type="button"
                onClick={openInstallModal}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 hover:text-white text-xs font-semibold whitespace-nowrap transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                title="Install SDG Trajectory App"
                aria-label="Install App"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Admin Portal Link */}
            <Link
              to="/admin"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                isActive('/admin')
                  ? 'bg-rose-600/30 text-rose-300 border-rose-500/50 shadow-sm'
                  : 'bg-rose-600/10 text-rose-300 border-rose-500/20 hover:bg-rose-600/20 hover:text-white'
              }`}
              title="Admin Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>Admin</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 17 SDG Color Mini Strip under header */}
        <div className="flex h-1.5 w-full overflow-hidden bg-slate-950">
          {Array.from({ length: 17 }, (_, i) => i + 1).map(num => {
            const isSelected = activeGoal === num;
            return (
              <Link
                key={num}
                to={`/goal/${num}`}
                onClick={(e) => {
                  if (onGoalChange) {
                    e.preventDefault();
                    onGoalChange(num);
                  }
                }}
                onMouseEnter={() => {
                  if (onGoalChange) {
                    onGoalChange(num);
                  }
                }}
                className={`flex-1 transition-all duration-200 origin-bottom ${
                  onGoalChange ? 'cursor-pointer' : ''
                } ${
                  isSelected 
                    ? 'scale-y-[2.2] brightness-125 opacity-100 z-10 shadow-[0_0_8px_rgba(255,255,255,0.6)]' 
                    : 'opacity-80 hover:opacity-100 hover:scale-y-[1.8]'
                }`}
                style={{ backgroundColor: sdgColors[num] }}
                title={`Goal ${num}: ${sdgGoalsContent[num - 1]?.title}${onGoalChange ? ' (Hover/Click to switch Globe)' : ''}`}
              />
            );
          })}
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 text-sm">
            <Link 
              to="/" 
              className={`flex items-center gap-2 p-2.5 rounded-lg ${isActive('/') ? 'bg-white/15 text-teal-300' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link 
              to="/countries" 
              className={`flex items-center gap-2 p-2.5 rounded-lg ${isActive('/countries') ? 'bg-white/15 text-teal-300' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Globe2 className="w-4 h-4" /> Country Profiles Hub
            </Link>
            <Link 
              to="/simulator" 
              className={`flex items-center gap-2 p-2.5 rounded-lg ${isActive('/simulator') ? 'bg-white/15 text-teal-300' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" /> What-If Policy Simulator
            </Link>
            <Link 
              to="/compare" 
              className={`flex items-center gap-2 p-2.5 rounded-lg ${isActive('/compare') ? 'bg-white/15 text-teal-300' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Scale className="w-4 h-4 text-purple-400" /> Country Benchmarking
            </Link>
            <Link 
              to="/help" 
              className={`flex items-center gap-2 p-2.5 rounded-lg ${isActive('/help') || isActive('/docs') ? 'bg-white/15 text-teal-300' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <BookOpen className="w-4 h-4 text-teal-400" /> Docs & User Manual
            </Link>
            <Link 
              to="/admin" 
              className={`flex items-center gap-2 p-2.5 rounded-lg ${isActive('/admin') ? 'bg-rose-600/30 text-rose-300' : 'text-rose-400 hover:bg-slate-800'}`}
            >
              <ShieldCheck className="w-4 h-4" /> Admin Portal
            </Link>

            {!isInstalled && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openInstallModal();
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 font-medium"
              >
                <Download className="w-4 h-4 text-teal-400" />
                <span>Install SDG App (PWA)</span>
              </button>
            )}

            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Explore 17 SDGs
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 17 }, (_, i) => i + 1).map(num => (
                  <Link
                    key={num}
                    to={`/goal/${num}`}
                    className="flex items-center gap-2 p-1.5 rounded bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-200"
                  >
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: sdgColors[num] }}>
                      {num}
                    </span>
                    <span className="truncate">SDG {num}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Quick Search Modal (Ctrl+K) */}
      {searchModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-20 animate-in fade-in duration-150">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Input bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search any country (e.g., India, Brazil) or SDG (e.g., Poverty, Climate)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Area */}
            <div className="p-3 max-h-96 overflow-y-auto space-y-4">
              {searchQuery.trim() === '' ? (
                <div className="py-6 text-center text-slate-400 text-xs space-y-2">
                  <p>Type a country name or SDG keyword to navigate instantly.</p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <button 
                      onClick={() => setSearchQuery('India')} 
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs"
                    >
                      India
                    </button>
                    <button 
                      onClick={() => setSearchQuery('United States')} 
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs"
                    >
                      United States
                    </button>
                    <button 
                      onClick={() => setSearchQuery('Climate')} 
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs"
                    >
                      Climate Action
                    </button>
                    <button 
                      onClick={() => setSearchQuery('Health')} 
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs"
                    >
                      Good Health
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Matching Countries */}
                  {filteredCountries.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                        Countries
                      </span>
                      <div className="space-y-1">
                        {filteredCountries.map(c => (
                          <div 
                            key={c.code}
                            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Link
                              to={`/country/${c.code}`}
                              className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white hover:text-teal-600"
                            >
                              <Globe2 className="w-4 h-4 text-teal-500" />
                              <span>{c.name}</span>
                              <span className="text-xs text-slate-400 font-normal">({c.code})</span>
                            </Link>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/country/${c.code}`}
                                className="text-xs px-2.5 py-1 rounded bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 font-medium hover:bg-teal-100"
                              >
                                Profile
                              </Link>
                              <Link
                                to={`/simulator?country=${c.code}`}
                                className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200"
                              >
                                Simulator
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Goals */}
                  {filteredGoals.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                        Sustainable Development Goals
                      </span>
                      <div className="space-y-1">
                        {filteredGoals.map(g => (
                          <Link
                            key={g.goalNumber}
                            to={`/goal/${g.goalNumber}`}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                          >
                            <span 
                              className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                              style={{ backgroundColor: sdgColors[g.goalNumber] }}
                            >
                              {g.goalNumber}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-teal-600 truncate">
                                Goal {g.goalNumber}: {g.title}
                              </h4>
                              <p className="text-xs text-slate-500 truncate">{g.subtitle}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredCountries.length === 0 && filteredGoals.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      No countries or goals match "{searchQuery}".
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Press <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">ESC</kbd> to close</span>
              <span>SDG Trajectory 2030</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
