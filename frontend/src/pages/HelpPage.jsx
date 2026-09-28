import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  BookOpen, 
  HelpCircle, 
  Search, 
  ExternalLink, 
  Sparkles, 
  SlidersHorizontal, 
  Scale, 
  Globe2, 
  Database, 
  Cpu, 
  Code2, 
  TrendingUp, 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Check, 
  ShieldCheck, 
  Info, 
  Calculator, 
  Compass, 
  GitBranch, 
  Workflow, 
  HeartHandshake,
  ArrowRight
} from 'lucide-react';
import { sdgColors } from '../data/sdgColors';
import { sdgGoalsContent } from '../data/sdgGoalsContent';

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('welcome');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  
  // Interactive Multiplier Calculator state in docs
  const [calcBaseline, setCalcBaseline] = useState(42.5);
  const [calcGrowthRate, setCalcGrowthRate] = useState(1.8);
  const [calcYears, setCalcYears] = useState(6);
  const [calcMultiplier, setCalcMultiplier] = useState(1.25);

  // FAQ open states
  const [openFaq, setOpenFaq] = useState({});

  const toggleFaq = (id) => {
    setOpenFaq(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Nav items definition
  const navSections = [
    {
      id: 'welcome',
      title: 'Welcome & UN SDGs',
      icon: Compass,
      category: 'Overview',
      badge: 'Core Context'
    },
    {
      id: 'user-manual',
      title: 'Interactive User Manual',
      icon: BookOpen,
      category: 'User Guides',
      badge: 'Interactive'
    },
    {
      id: 'data-pipeline',
      title: 'Data Pipeline & Sources',
      icon: Database,
      category: 'Architecture',
      badge: '6 Global APIs'
    },
    {
      id: 'machine-learning',
      title: 'Machine Learning & Models',
      icon: Cpu,
      category: 'Methodology',
      badge: 'AI Forecaster'
    },
    {
      id: 'policy-math',
      title: 'Policy Simulator Formula',
      icon: Calculator,
      category: 'Methodology',
      badge: 'Mathematical Logic'
    },
    {
      id: 'developer-guide',
      title: 'Developer Handbook & APIs',
      icon: Code2,
      category: 'Engineering',
      badge: 'API & Setup'
    },
    {
      id: 'faq',
      title: 'FAQ & Terminology',
      icon: HelpCircle,
      category: 'Reference',
      badge: 'Glossary'
    }
  ];

  // Scroll spy & URL hash updater
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of navSections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Simulated calculations
  const baselineProjection = Math.max(0, calcBaseline + (calcGrowthRate * calcYears));
  const policySimulatedProjection = Math.max(0, calcBaseline + (calcGrowthRate * calcMultiplier * calcYears));
  const diffPercent = (((policySimulatedProjection - baselineProjection) / (baselineProjection || 1)) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-cream text-warm-gray flex flex-col selection:bg-teal-500 selection:text-white">
      <Navbar />

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-b from-navy via-navy to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Knowledge Base & User Manual</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
              SDG Trajectory <span className="text-teal-400">Documentation</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Your single source of truth for global 2030 indicator forecasting, policy simulation mathematics, 
              ETL pipelines, and open-source contribution guidelines.
            </p>
          </div>

          {/* Quick Search in Header */}
          <div className="w-full md:w-80 bg-slate-800/90 border border-slate-700 rounded-xl p-3 shadow-xl backdrop-blur-md">
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Search Documentation</label>
            <div className="relative">
              <Search className="w-4 h-4 text-teal-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, models, APIs..."
                className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>
            {searchQuery && (
              <p className="text-[11px] text-teal-300 mt-2">
                Filtering topics matching "<span className="font-semibold">{searchQuery}</span>"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Sticky Sidebar + Structured Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sticky Sidebar (Desktop) */}
          <aside className="lg:col-span-3 sticky top-20 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-teal-600" /> Table of Contents
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                v2.4
              </span>
            </div>

            <nav className="space-y-1">
              {navSections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left group ${
                      isActive 
                        ? 'bg-navy text-white shadow-md shadow-navy/20 translate-x-1' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-teal-600'}`} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${isActive ? 'text-teal-400 rotate-90' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </nav>

            {/* Developer Note Quick Callout */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-100/80 space-y-2">
              <div className="flex items-center gap-1.5 text-teal-800 text-xs font-bold">
                <HeartHandshake className="w-4 h-4 text-teal-600" />
                <span>Open Science Mission</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                This platform is dedicated to transparency in global SDG forecasting. Built with open-source machine learning and public UN data.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <a 
                  href="https://sdgs.un.org" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 hover:underline"
                >
                  Visit UN SDGs <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </aside>

          {/* Right Main Content Sections */}
          <main className="lg:col-span-9 space-y-12">

            {/* ================= SECTION 1: WELCOME & UN SDGS ================= */}
            <section id="welcome" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-navy">1. Welcome & About the Project</h2>
                    <p className="text-xs text-slate-500">The 2030 Global Agenda & Official Institutional Framework</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">Overview</span>
              </div>

              {/* Note from Developers */}
              <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-teal-500 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-teal-600" /> A Friendly Note from the Developers
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Welcome to <strong>SDG Trajectory</strong>! We engineered this application to solve a critical barrier in sustainable development:
                  <em> how do we transform fragmented, retrospective global indicators into dynamic, forward-looking insights for policymakers and citizens?</em> 
                  By bringing together machine learning, edge databases, and interactive simulations, we hope this manual equips you to explore, analyze, and challenge global trajectory projections with full transparency.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <h3 className="text-base font-bold text-navy">What are the United Nations Sustainable Development Goals (SDGs)?</h3>
                <p>
                  In September 2015, all 193 United Nations Member States unanimously adopted the <strong>2030 Agenda for Sustainable Development</strong>. 
                  At its heart are <strong>17 Sustainable Development Goals (SDGs)</strong>, encompassing <strong>169 quantitative targets</strong> and over 
                  <strong> 230 individual indicators</strong> designed to eliminate extreme poverty, reduce inequalities, tackle climate breakdown, and ensure peace and prosperity for all by 2030.
                </p>

                {/* 17 Goals Interactive Mini-Grid */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-3">
                    Explore the 17 Global Goals Tracked in this Platform
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {sdgGoalsContent.map(goal => (
                      <Link 
                        key={goal.goalNumber}
                        to={`/goal/${goal.goalNumber}`}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-teal-500 hover:shadow-sm transition-all group"
                      >
                        <span 
                          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: sdgColors[goal.goalNumber] }}
                        >
                          {goal.goalNumber}
                        </span>
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-navy truncate">
                          {goal.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <h3 className="text-base font-bold text-navy pt-2">Official UN & Global Organization Portals</h3>
                <p>
                  For primary policy mandates, official treaties, and raw UN documentation, we encourage consulting the authoritative organizations directly:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <a 
                    href="https://sdgs.un.org" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      UN
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-navy group-hover:text-teal-700 flex items-center gap-1">
                        UN SDG Knowledge Platform <ExternalLink className="w-3 h-3" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Official home of the 2030 Agenda and 169 targets.</p>
                    </div>
                  </a>

                  <a 
                    href="https://unstats.un.org/sdgs/dataportal" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      STAT
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-navy group-hover:text-teal-700 flex items-center gap-1">
                        UN SDG Global Indicators API <ExternalLink className="w-3 h-3" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">United Nations Statistics Division Global Database.</p>
                    </div>
                  </a>

                  <a 
                    href="https://sdg-tracker.org" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      OWID
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-navy group-hover:text-teal-700 flex items-center gap-1">
                        Our World in Data SDG Tracker <ExternalLink className="w-3 h-3" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Empirical research and historical tracking repository.</p>
                    </div>
                  </a>

                  <a 
                    href="https://data.worldbank.org" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      WB
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-navy group-hover:text-teal-700 flex items-center gap-1">
                        World Bank Open Data <ExternalLink className="w-3 h-3" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Global economic, poverty, and infrastructure indicators.</p>
                    </div>
                  </a>
                </div>
              </div>
            </section>


            {/* ================= SECTION 2: INTERACTIVE USER MANUAL ================= */}
            <section id="user-manual" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-navy">2. User Manual & Feature Walkthroughs</h2>
                    <p className="text-xs text-slate-500">Step-by-step interactive guide to every module</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">User Guide</span>
              </div>

              <div className="space-y-6">
                {/* Feature 1: 3D Globe */}
                <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-navy flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-indigo-600" /> 1. Interactive 3D Globe Explorer
                    </h3>
                    <Link to="/" className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1">
                      Try Globe <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Rendered with <strong>WebGL / Three.js</strong> on the homepage, the 3D globe plots real-time SDG data points for over 190 nations.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-700">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="font-semibold text-navy block">Hover Over Nations</span>
                      <span className="text-[11px] text-slate-500">Instantly inspect country name, region, and composite SDG health index.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="font-semibold text-navy block">Click to Deep Dive</span>
                      <span className="text-[11px] text-slate-500">Directly redirects to that nation's comprehensive 17-Goal dossier.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="font-semibold text-navy block">Rotate & Zoom</span>
                      <span className="text-[11px] text-slate-500">Left-click and drag to orbit; scroll wheel to zoom into specific archipelagos.</span>
                    </div>
                  </div>
                </div>

                {/* Feature 2: Goal & Indicator Trajectory View */}
                <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-navy flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-600" /> 2. Goal Explorer & AI Trajectory Forecasting
                    </h3>
                    <Link to="/goal/1" className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1">
                      View Goal 1 <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    On every Goal page (e.g. <code>/goal/7</code>), select any country and target to view both historical data (solid line) and the Machine Learning projection to 2030 (dashed line).
                  </p>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span className="font-medium text-slate-700"><strong>On-track</strong>: Expected to meet or surpass 2030 baseline trajectory.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      <span className="font-medium text-slate-700"><strong>At-risk</strong>: Progress is stagnant within ±5% margin.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                      <span className="font-medium text-slate-700"><strong>Off-track</strong>: Deteriorating or severely behind target.</span>
                    </div>
                  </div>
                </div>

                {/* Feature 3: What-If Policy Simulator */}
                <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-navy flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-600" /> 3. What-If Policy Simulator
                    </h3>
                    <Link to="/simulator" className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1">
                      Open Simulator <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Test theoretical policy interventions! Apply an <strong>Impact Multiplier (0.50× to 2.00×)</strong> to simulate what happens if a nation accelerates investments (e.g. +35% in clean energy R&D) or suffers economic shocks.
                  </p>
                  <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-100 text-xs text-teal-900">
                    💡 <strong>Pro Tip</strong>: The simulation immediately recalibrates the slope β from the last confirmed historical year without modifying underlying historical records.
                  </div>
                </div>

                {/* Feature 4: Country Comparison Benchmark */}
                <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-navy flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600" /> 4. Cross-Country Benchmarking
                    </h3>
                    <Link to="/compare" className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1">
                      Compare Nations <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Select two countries (e.g., Sweden vs. Germany) to view side-by-side indicator trajectories, historical growth rates, and peer-to-peer gap analysis across all 17 Goals.
                  </p>
                </div>

                {/* Feature 5: AI Policy Copilot */}
                <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-navy flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> 5. SDG Policy Copilot
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    An integrated AI assistant (powered by state-of-the-art LLMs via OpenRouter) that provides context-aware policy suggestions based on the exact indicator and country you are inspecting. Click the floating <strong>"AI Policy Copilot"</strong> button on any Goal page.
                  </p>
                </div>
              </div>
            </section>


            {/* ================= SECTION 3: DATA PIPELINE & SOURCES ================= */}
            <section id="data-pipeline" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-navy">3. Global Data Pipeline & Ingestion Architecture</h2>
                    <p className="text-xs text-slate-500">6 Premier Data Sources, Standardization, & Automated Edge Sync</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold">ETL Pipeline</span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  The accuracy of our projections depends on robust data stewardship. Our backend integrates and cleans data from <strong>6 premier multilateral organizations</strong>:
                </p>

                {/* 6 Sources Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-xs">WHO (GHO)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">SDG 3</span>
                    </div>
                    <p className="text-[11px] text-slate-500">World Health Organization Global Health Observatory (maternal mortality, disease incidence, universal coverage).</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-xs">World Bank & OWID</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">SDG 1, 7, 8, 13</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Economic growth, extreme poverty lines, renewable energy shares, and carbon intensity.</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-xs">FAOSTAT</span>
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono">SDG 2</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Food and Agriculture Organization (food security, prevalence of undernourishment, agricultural yield).</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-xs">UNICEF</span>
                      <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-mono">SDG 3, 5, 6</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Child survival, immunization coverage, safe sanitation facilities, and gender equality metrics.</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-xs">ILOSTAT</span>
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-mono">SDG 8</span>
                    </div>
                    <p className="text-[11px] text-slate-500">International Labour Organization (youth NEET rate, formal vs informal employment, labour rights).</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-xs">UNESCO (UIS)</span>
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono">SDG 4</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Institute for Statistics (primary/secondary completion rates, minimum proficiency in reading and math).</p>
                  </div>
                </div>

                <h3 className="text-base font-bold text-navy pt-2">ETL Pipeline Stages</h3>
                
                {/* Visual Pipeline Flow */}
                <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-3 font-mono text-xs">
                  <div className="text-teal-400 font-bold flex items-center gap-2">
                    <Workflow className="w-4 h-4" /> Pipeline Lifecycle
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">[1. Ingestion]</span>
                      <span>Raw multi-source extraction → Fuzzy ISO-3 Country Code resolution via <code>pycountry</code></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-teal-400 font-bold">[2. Cleansing]</span>
                      <span>Isolation Forest anomaly screening (`contamination=0.10`) with Protected Latest Year Constraint</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sky-400 font-bold">[3. Imputation]</span>
                      <span>Linear time-series interpolation for isolated gap years + Regional fallback averages</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">[4. Persistence]</span>
                      <span>Sync to Turso (libSQL Distributed Edge DB) triggered asynchronously via GitHub Actions</span>
                    </div>
                  </div>
                </div>

                {/* Serverless GitHub Actions Decoupling explanation */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4 text-indigo-600" /> Decoupled Serverless Ingestion
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Because processing tens of thousands of multilateral records can take several minutes, the sync operation is offloaded to a serverless <strong>GitHub Actions CI/CD workflow</strong> (<code>workflow_dispatch</code> API). This prevents FastAPI event loop blocking and ensures the web application never experiences latency spikes or HTTP 504 Gateway Timeouts.
                  </p>
                </div>
              </div>
            </section>


            {/* ================= SECTION 4: MACHINE LEARNING & MODELS ================= */}
            <section id="machine-learning" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-navy">4. Machine Learning & Forecasting Methodology</h2>
                    <p className="text-xs text-slate-500">Why Isolation Forests & Constrained Linear Models Were Selected</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">Forecasting Engine</span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <h3 className="text-base font-bold text-navy">1. Outlier Removal via Isolation Forests</h3>
                <p>
                  Global country data can contain anomalies caused by shifting statistical definitions, civil disruption, or abrupt census recalibrations. We employ an <strong>Isolation Forest</strong> algorithm (`sklearn.ensemble.IsolationForest`) to isolate abnormal spikes before model training.
                </p>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" /> The Endpoint Safety Constraint
                  </div>
                  <p>
                    A naive anomaly detector might drop the most recent year's data point if a country experienced sudden rapid growth. Our pipeline enforces an explicit safety rule: <em>the most recent chronological year is permanently protected from outlier removal</em>, guaranteeing that 2030 projections emanate from the nation's true latest state.
                  </p>
                </div>

                <h3 className="text-base font-bold text-navy pt-2">2. Why Linear Regression with Zero-Floor Constraints?</h3>
                <p>
                  A common question in AI forecasting is: <em>Why not use deep LSTM or Transformer neural networks?</em>
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <span className="font-bold text-navy text-xs block">Data Scarcity & Overfitting Protection</span>
                    <p className="text-[11px] text-slate-600">Annual country metrics provide 10–25 data points (2000–2024). Deep neural networks quickly overfit on small sample sizes, leading to wild hallucinated trajectories.</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <span className="font-bold text-navy text-xs block">Policy Interpretability & Transparency</span>
                    <p className="text-[11px] text-slate-600">Policymakers need defensible slope coefficients (β) where every simulated percentage point corresponds to quantifiable growth rates.</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <span className="font-bold text-navy text-xs block">Zero-Floor Mathematical Boundary</span>
                    <p className="text-[11px] text-slate-600">Unconstrained polynomial models can project negative values for mortality rates. Our engine applies max(0.0, ŷ) to enforce physical reality.</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <span className="font-bold text-navy text-xs block">Sparse Data Bypass Mechanism</span>
                    <p className="text-[11px] text-slate-600">If a country possesses fewer than 2 valid historical observations, the engine cleanly flags status as <em>"Insufficient Data"</em> instead of guessing.</p>
                  </div>
                </div>

                <h3 className="text-base font-bold text-navy pt-2">3. Target Polarity & Status Classification</h3>
                <p>
                  Progress classification evaluates whether an indicator's value should ideally <strong>decrease</strong> (e.g. poverty, infant deaths) or <strong>increase</strong> (e.g. renewable energy, schooling):
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-navy font-semibold">
                      <tr>
                        <th className="p-2.5 border-b border-slate-200">Polarity Type</th>
                        <th className="p-2.5 border-b border-slate-200">Representative Targets</th>
                        <th className="p-2.5 border-b border-slate-200">On-track Condition</th>
                        <th className="p-2.5 border-b border-slate-200">Off-track Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr>
                        <td className="p-2.5 font-medium text-rose-700">Negative Polarity (Lower is Better)</td>
                        <td className="p-2.5">1.1 (Poverty), 2.1 (Undernourishment), 3.1 (Maternal Mortality), 13.2 (CO2 Emissions)</td>
                        <td className="p-2.5 font-mono text-emerald-700">y_2030 &lt; y_base * 0.95</td>
                        <td className="p-2.5 font-mono text-rose-700">y_2030 &gt; y_base * 1.05</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-emerald-700">Positive Polarity (Higher is Better)</td>
                        <td className="p-2.5">4.1 (Education Completion), 7.2 (Renewable Energy), 9.5 (R&D Spending)</td>
                        <td className="p-2.5 font-mono text-emerald-700">y_2030 &gt; y_base * 1.05</td>
                        <td className="p-2.5 font-mono text-rose-700">y_2030 &lt; y_base * 0.95</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>


            {/* ================= SECTION 5: POLICY SIMULATOR MATH ================= */}
            <section id="policy-math" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-navy">5. Policy Simulator Mathematics & Live Demo</h2>
                    <p className="text-xs text-slate-500">Interactive Formula Breakdown & Multiplier Sandbox</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">Live Sandbox</span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  The policy simulator allows analysts to model counterfactual scenarios using an <strong>Impact Multiplier (m)</strong>.
                  The formula calculates the future trajectory from the latest observed year t_last:
                </p>

                {/* Formula Callout */}
                <div className="p-4 bg-navy text-white rounded-xl space-y-2 text-center font-mono text-xs sm:text-sm">
                  <div className="text-teal-400 font-bold">Mathematical Trajectory Model</div>
                  <div className="text-base sm:text-lg tracking-wide py-1 text-teal-200">
                    y_sim(t) = max( 0.0, y(t_last) + [ m · β ] · (t - t_last) )
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Where <strong>β</strong> is the historical linear slope, <strong>m</strong> is the policy impact multiplier, and <strong>t</strong> is the forecast year (up to 2030).
                  </div>
                </div>

                {/* Interactive Demo Sandbox Widget inside docs */}
                <div className="p-5 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/40 via-white to-indigo-50/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-teal-600" /> Interactive Parameter Sandbox
                    </span>
                    <span className="text-[11px] text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full font-semibold">
                      Live Preview
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Baseline Value (y_last)</label>
                      <input 
                        type="number"
                        value={calcBaseline}
                        onChange={(e) => setCalcBaseline(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs text-navy focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Annual Trend Rate (β)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={calcGrowthRate}
                        onChange={(e) => setCalcGrowthRate(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs text-navy focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Horizon (Years to 2030)</label>
                      <input 
                        type="number"
                        min="1"
                        max="10"
                        value={calcYears}
                        onChange={(e) => setCalcYears(parseInt(e.target.value) || 1)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs text-navy focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">
                        Policy Multiplier (m): <span className="text-teal-700 font-bold">{calcMultiplier}×</span>
                      </label>
                      <input 
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={calcMultiplier}
                        onChange={(e) => setCalcMultiplier(parseFloat(e.target.value))}
                        className="w-full accent-teal-600 mt-2"
                      />
                    </div>
                  </div>

                  {/* Sandbox Result Output */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Standard 2030 Baseline</span>
                      <span className="text-base font-bold text-slate-700 font-mono">{baselineProjection.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-teal-700 font-semibold block">Simulated 2030 Outcome</span>
                      <span className="text-base font-bold text-teal-600 font-mono">{policySimulatedProjection.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-indigo-700 font-semibold block">Net Policy Delta</span>
                      <span className={`text-base font-bold font-mono ${parseFloat(diffPercent) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {parseFloat(diffPercent) >= 0 ? `+${diffPercent}%` : `${diffPercent}%`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>


            {/* ================= SECTION 6: DEVELOPER & CONTRIBUTOR HANDBOOK ================= */}
            <section id="developer-guide" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-navy">6. Developer Handbook & API Reference</h2>
                    <p className="text-xs text-slate-500">Architecture Blueprint, REST Endpoints, & Setup Guide</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold font-mono">Developers</span>
              </div>

              <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div>
                  <h3 className="text-base font-bold text-navy">System Architecture Stack</h3>
                  <p className="mt-1">
                    SDG Trajectory is engineered as a decoupled high-performance application:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-navy text-xs block">Backend (Python 3.10+)</span>
                      <span className="text-[11px] text-slate-600 block mt-1">FastAPI, Scikit-Learn, Pandas, PyJWT, SlowAPI rate limiter, Passlib bcrypt.</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-navy text-xs block">Database & Storage</span>
                      <span className="text-[11px] text-slate-600 block mt-1">Turso (Edge libSQL SQLite distributed database) with SQLAlchemy.</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-navy text-xs block">Frontend (SPA)</span>
                      <span className="text-[11px] text-slate-600 block mt-1">React 18 + Vite, Tailwind CSS, Recharts, React-Globe.gl / Three.js, Lucide icons.</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-navy text-xs block">AI LLM Integration</span>
                      <span className="text-[11px] text-slate-600 block mt-1">OpenRouter API powering the contextual policy copilot and narrative synthesis.</span>
                    </div>
                  </div>
                </div>

                {/* API Reference Snippets */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-navy">Core REST API Endpoints</h3>

                  {/* Endpoint 1 */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold">GET</span>
                        <code className="text-xs font-bold text-navy">/api/goals/{`{goal_number}`}</code>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(`curl -X GET "http://localhost:8000/api/goals/1"`, 'api1')}
                        className="text-xs text-slate-500 hover:text-navy flex items-center gap-1 font-medium"
                      >
                        {copiedCode === 'api1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode === 'api1' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[11px]">
                      <span className="text-slate-500">// Returns historical values, ML 2030 predictions, and narrative summary</span>
                      <pre className="mt-1 text-teal-300 overflow-x-auto">
{`{
  "goal_number": 1,
  "countries": [
    {
      "code": "IND",
      "target": "1.1",
      "baseline_value": 11.2,
      "projected_value_2030": 3.8,
      "status": "On-track"
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>

                  {/* Endpoint 2 */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-bold">POST</span>
                        <code className="text-xs font-bold text-navy">/api/predict/simulate</code>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(`curl -X POST "http://localhost:8000/api/predict/simulate" -H "Content-Type: application/json" -d '{"country_code":"IND","target":"7.2","multiplier":1.25}'`, 'api2')}
                        className="text-xs text-slate-500 hover:text-navy flex items-center gap-1 font-medium"
                      >
                        {copiedCode === 'api2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode === 'api2' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[11px]">
                      <span className="text-slate-500">// Simulates what-if scenarios with custom policy multipliers</span>
                      <pre className="mt-1 text-teal-300 overflow-x-auto">
{`{
  "country_code": "IND",
  "target": "7.2",
  "multiplier": 1.25,
  "baseline_projection_2030": 24.5,
  "simulated_projection_2030": 30.6
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Local Development Commands */}
                <div>
                  <h3 className="text-base font-bold text-navy">Local Setup in 3 Minutes</h3>
                  <div className="mt-2 p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                      <span>Bash / Terminal</span>
                      <button 
                        onClick={() => copyToClipboard(`git clone https://github.com/SABARISH0014/SDG-Trajectory-v2.git\ncd SDG-Trajectory-v2\ncd backend && pip install -r requirements.txt\npython main.py`, 'setup')}
                        className="hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        {copiedCode === 'setup' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy commands</span>
                      </button>
                    </div>
                    <div className="text-slate-300">
                      <p><span className="text-teal-400"># 1. Clone the repository</span></p>
                      <p>git clone https://github.com/SABARISH0014/SDG-Trajectory-v2.git</p>
                      <p className="mt-2"><span className="text-teal-400"># 2. Start Backend</span></p>
                      <p>cd SDG-Trajectory-v2/backend</p>
                      <p>python -m venv .venv && source .venv/bin/activate</p>
                      <p>pip install -r requirements.txt && python main.py</p>
                      <p className="mt-2"><span className="text-teal-400"># 3. Start Frontend (separate terminal)</span></p>
                      <p>cd ../frontend && npm install && npm run dev</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>


            {/* ================= SECTION 7: FAQ & GLOSSARY ================= */}
            <section id="faq" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-navy">7. Frequently Asked Questions & Glossary</h2>
                    <p className="text-xs text-slate-500">Common Questions, Methodology Inquiries & Terminology</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">Reference</span>
              </div>

              {/* Accordion FAQ */}
              <div className="space-y-3">
                {[
                  {
                    id: 'faq1',
                    question: 'How often is global data updated in SDG Trajectory?',
                    answer: 'Data is synced periodically via automated GitHub Actions workflows triggered either through scheduled cron jobs or on-demand by system administrators in the Admin Portal. When multilateral agencies release new annual datasets (such as WHO GHO updates or World Bank Open Data revisions), our ETL pipeline ingests, cleans, and recalculates projections automatically.'
                  },
                  {
                    id: 'faq2',
                    question: 'Why do some countries or indicators show "Insufficient Data"?',
                    answer: 'To protect scientific rigor, our forecasting model refuses to fabricate trajectories when a country has fewer than 2 valid historical observations for an indicator. In these instances, the system flags the indicator as "Insufficient Data" rather than risking misleading policy advice.'
                  },
                  {
                    id: 'faq3',
                    question: 'How is the baseline year established for 2030 projections?',
                    answer: 'For historical comparisons, the baseline is standardized to 2015 (the year the UN 2030 Agenda was formally adopted) whenever available. If a country only began reporting an indicator in subsequent years (e.g. 2017), the earliest confirmed historical data point serves as the reference baseline.'
                  },
                  {
                    id: 'faq4',
                    question: 'Can I export policy simulation charts and data for my research paper?',
                    answer: 'Yes! On Goal and Country pages, you can click the "Export Policy Dossier" button to download high-resolution summaries and tabular data formatted for academic research, government briefings, or policy whitepapers.'
                  }
                ].map(faq => (
                  <div key={faq.id} className="border border-slate-200 rounded-xl overflow-hidden transition-all">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-navy bg-slate-50 hover:bg-slate-100 flex items-center justify-between gap-4 transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq[faq.id] ? 'rotate-180 text-teal-600' : ''}`} />
                    </button>
                    {openFaq[faq.id] && (
                      <div className="p-4 bg-white text-xs sm:text-sm text-slate-600 border-t border-slate-200 leading-relaxed animate-in fade-in duration-150">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* SDG Glossary Cards */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-sm font-bold text-navy uppercase tracking-wider">SDG Key Terminology Glossary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <strong className="text-navy block">ISO-3 Alpha-3 Code</strong>
                    <span className="text-slate-600 text-[11px]">The three-letter country identifier standard established by ISO 3166-1 (e.g., USA, IND, DEU, GHA).</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <strong className="text-navy block">Target Polarity</strong>
                    <span className="text-slate-600 text-[11px]">The directional goal of an indicator (Positive polarity = increase is desirable; Negative polarity = reduction is desirable).</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <strong className="text-navy block">Contamination Ratio</strong>
                    <span className="text-slate-600 text-[11px]">The expected proportion of outliers in the dataset used by the Isolation Forest anomaly detector.</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <strong className="text-navy block">Linear Slope (β)</strong>
                    <span className="text-slate-600 text-[11px]">The rate of change per calendar year calculated through ordinary least squares regression over historical points.</span>
                  </div>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-300 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-navy">© 2026 SDG Trajectory — Open-Source Global Insights</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Empowering researchers, educators, and policymakers worldwide toward the 2030 Agenda.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
            <Link to="/simulator" className="hover:text-teal-600 transition-colors">Simulator</Link>
            <Link to="/countries" className="hover:text-teal-600 transition-colors">Countries</Link>
            <Link to="/admin" className="hover:text-teal-600 transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
