import { API_BASE_URL } from '@/config';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ChevronDown, Globe2, ShieldCheck } from 'lucide-react';
import { sdgGoalsContent } from '../data/sdgGoalsContent';
import { sdgColors } from '../data/sdgColors';
import { COUNTRIES } from '../lib/constants';
import GlobeView from '../components/GlobeView';
import sdgGoalsImage from '../lib/SDG Goals.avif';
import LanguageSwitcher from '../components/LanguageSwitcher';
import SplashScreenOverlay from '../components/SplashScreenOverlay';

export default function HomePage() {
  const navigate = useNavigate();
  const [hoveredGoal, setHoveredGoal] = useState(null);
  const [globeMarkers, setGlobeMarkers] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [loading, setLoading] = useState(true);

  // Custom country dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/globe/markers`);
        setGlobeMarkers(response.data);
      } catch (error) {
        console.error("Failed to fetch globe markers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkers();
  }, []);

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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [dropdownOpen]);

  // COUNTRIES is imported from constants

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (code) => {
    setSelectedCountry(code);
    setDropdownOpen(false);
    setSearchQuery('');
    if (code) {
      navigate(`/country/${code}`);
    }
  };

  const selectedCountryName = COUNTRIES.find(c => c.code === selectedCountry)?.name || '';

  return (
    <div className="min-h-screen bg-cream text-warm-gray font-sans">
      {loading && <SplashScreenOverlay message="Initializing SDG Trajectory..." />}

      {/* ===== SECTION 1: Dark Hero Header with SDG image ===== */}
      <section className="bg-navy text-white relative">
        <div className="absolute top-6 right-6 z-50">
          <LanguageSwitcher />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28 flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left: Text */}
          <div className="lg:w-[50%] flex-shrink-0">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400 mb-4 font-semibold">presents</p>
            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-[1.15] mb-6">
              SDG Trajectory
              <br />
              <span className="font-light text-slate-300 text-4xl md:text-5xl">of Sustainable Development Goals</span>
              <br />
              <span className="text-teal-400 text-5xl md:text-7xl">2030</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed mb-8">
              The SDG Trajectory presents interactive forecasting and data visualizations
              about the 17 Sustainable Development Goals. Explore trajectories, compare
              countries, and simulate policy outcomes toward 2030.
            </p>
            <Link to="/admin" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 hover:text-white transition-all shadow-[0_0_15px_-3px_rgba(225,29,72,0.4)]">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-semibold tracking-wide text-sm">Admin Portal</span>
            </Link>
          </div>

          {/* Right: SDG Goals image */}
          <div className="lg:w-[48%] flex justify-center items-center">
            <img
              src={sdgGoalsImage}
              alt="The 17 Sustainable Development Goals"
              className="w-full max-w-xl lg:max-w-2xl rounded-2xl shadow-2xl border border-white/15 transition-transform duration-300 hover:scale-[1.02]"
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* SDG Color Bar — full width, edge-to-edge, round per segment */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-10">
          <div className="flex">
            {Array.from({ length: 17 }, (_, i) => i + 1).map(num => (
              <Link
                key={num}
                to={`/goal/${num}`}
                className="flex-1 h-5 md:h-6 transition-all duration-200 hover:h-8 rounded-sm"
                style={{ backgroundColor: sdgColors[num] }}
                title={`Goal ${num}: ${sdgGoalsContent[num - 1]?.title}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: SDG Explorer ===== */}
      <section className="bg-cream">
        {/* Extra top padding to account for the overlapping SDG bar */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-16">
          <div className="border-b border-slate-300 pb-4 mb-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-warm-gray">Explore the 17 SDGs</h2>
          </div>

          {/* Globe — centered and properly scaled with no dead padding */}
          <div className="flex justify-center mb-10">
            <GlobeView
              markers={globeMarkers}
              goalNumber={hoveredGoal}
              highlightColor={hoveredGoal ? sdgColors[hoveredGoal] : '#3b82f6'}
              compact={true}
              size={560}
              showRing={true}
            />
          </div>

          {/* Country Selector — custom dropdown, below globe */}
          <div className="flex justify-center mb-12">
            <div className="w-full max-w-xl relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                <Globe2 className="inline w-4 h-4 mr-1 -mt-0.5" />
                <span>Which country interests you most?</span>
              </label>

              {/* Dropdown trigger */}
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full h-12 px-4 border-2 border-navy/20 bg-white text-sm text-left rounded-lg
                  flex items-center justify-between
                  focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10
                  hover:border-navy/40 transition-all duration-200 shadow-sm"
              >
                <span className={selectedCountryName ? 'text-warm-gray font-medium' : 'text-slate-400'}>
                  {selectedCountryName || 'Select a country...'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown panel — opens downward */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white opacity-100 text-slate-900 border border-slate-300 rounded-lg shadow-2xl z-[100] overflow-hidden"
                  style={{ animation: 'dropdownIn 0.2s ease-out' }}
                >
                  {/* Search input */}
                  <div className="p-3 border-b border-slate-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search countries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 border border-slate-300 rounded-md text-sm text-slate-900
                          focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10
                          placeholder:text-slate-400 bg-white"
                      />
                    </div>
                  </div>

                  {/* Country list */}
                  <ul className="max-h-52 overflow-y-auto py-1">
                    {filteredCountries.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-slate-400 text-center bg-white">
                        No countries found
                      </li>
                    ) : (
                      filteredCountries.map(c => (
                        <li key={c.code}>
                          <button
                            type="button"
                            onClick={() => handleCountrySelect(c.code)}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-900 bg-white opacity-100
                              hover:bg-slate-100 hover:text-slate-900
                              focus:outline-none focus:bg-slate-100
                              transition-colors duration-100"
                          >
                            {c.name}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* SDG List — two-column grid: 1–8 | 9–17 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
            {/* Column 1: Goals 1–8 */}
            <div>
              {sdgGoalsContent.filter(g => g.goalNumber <= 8).map((goal) => (
                <Link
                  key={goal.goalNumber}
                  to={`/goal/${goal.goalNumber}`}
                  className="group flex items-start gap-5 py-4 border-b border-slate-200 hover:bg-white/60 transition-colors px-3 -mx-3 rounded-sm"
                  onMouseEnter={() => setHoveredGoal(goal.goalNumber)}
                  onMouseLeave={() => setHoveredGoal(null)}
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <span
                      className="inline-block text-2xl font-bold text-warm-gray pb-1 transition-all duration-150 group-hover:text-white group-hover:px-2 group-hover:py-0.5 rounded"
                      style={{
                        borderBottom: `3px solid ${sdgColors[goal.goalNumber]}`,
                        backgroundColor: hoveredGoal === goal.goalNumber ? sdgColors[goal.goalNumber] : 'transparent',
                        color: hoveredGoal === goal.goalNumber ? '#fff' : undefined,
                      }}
                    >
                      {goal.goalNumber}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-base font-semibold text-warm-gray uppercase tracking-wide leading-snug">
                      {goal.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">{goal.subtitle}</p>
                  </div>
                  <div className="flex-shrink-0 pt-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                    →
                  </div>
                </Link>
              ))}
            </div>

            {/* Column 2: Goals 9–17 */}
            <div>
              {sdgGoalsContent.filter(g => g.goalNumber >= 9).map((goal) => (
                <Link
                  key={goal.goalNumber}
                  to={`/goal/${goal.goalNumber}`}
                  className="group flex items-start gap-5 py-4 border-b border-slate-200 hover:bg-white/60 transition-colors px-3 -mx-3 rounded-sm"
                  onMouseEnter={() => setHoveredGoal(goal.goalNumber)}
                  onMouseLeave={() => setHoveredGoal(null)}
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <span
                      className="inline-block text-2xl font-bold text-warm-gray pb-1 transition-all duration-150 group-hover:text-white group-hover:px-2 group-hover:py-0.5 rounded"
                      style={{
                        borderBottom: `3px solid ${sdgColors[goal.goalNumber]}`,
                        backgroundColor: hoveredGoal === goal.goalNumber ? sdgColors[goal.goalNumber] : 'transparent',
                        color: hoveredGoal === goal.goalNumber ? '#fff' : undefined,
                      }}
                    >
                      {goal.goalNumber}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-base font-semibold text-warm-gray uppercase tracking-wide leading-snug">
                      {goal.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">{goal.subtitle}</p>
                  </div>
                  <div className="flex-shrink-0 pt-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                    →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-300 bg-cream">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 text-center text-sm text-slate-500">
          <p>© 2026 SDG Trajectory — Academic Project Prototype</p>
          <p className="mt-1 text-xs text-slate-400">
            This tool is for educational and research purposes. Data sourced from the United Nations SDG API and Our World in Data.
          </p>
        </div>
      </footer>
    </div>
  );
}
