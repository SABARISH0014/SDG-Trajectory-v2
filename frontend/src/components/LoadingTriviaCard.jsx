import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  Globe2, 
  BarChart2, 
  HelpCircle, 
  RefreshCw, 
  ArrowRight,
  Droplet,
  Sliders,
  FileText,
  Zap,
  Compass,
  Flame,
  Scale,
  Target,
  Users,
  Building
} from 'lucide-react';
import { getActiveTriviaList, getLoadingConfig, DEFAULT_TRIVIA_ITEMS } from '../lib/triviaService';

const ICON_MAP = {
  Sparkles: Sparkles,
  Lightbulb: Lightbulb,
  Globe: Globe2,
  Globe2: Globe2,
  BarChart2: BarChart2,
  Droplet: Droplet,
  Sliders: Sliders,
  FileText: FileText,
  Zap: Zap,
  Compass: Compass,
  Flame: Flame,
  Scale: Scale,
  Target: Target,
  Users: Users,
  Building: Building,
};

const CATEGORY_STYLES = {
  'Website Tip': 'bg-teal-50 text-teal-700 border-teal-200',
  'SDG Fact': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'UN Trivia': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Pro Feature': 'bg-purple-50 text-purple-700 border-purple-200'
};

export default function LoadingTriviaCard({ 
  message = "Calculating 2030 statistical projection...",
  submessage = "Filtering outliers with Isolation Forests & estimating trend slope",
  isScoped = true,
  customInterval = null,
  overrideTriviaList = null
}) {
  const [triviaList, setTriviaList] = useState(overrideTriviaList || DEFAULT_TRIVIA_ITEMS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [intervalSec, setIntervalSec] = useState(customInterval || 3.5);

  useEffect(() => {
    if (customInterval) {
      setIntervalSec(customInterval);
    }
  }, [customInterval]);

  useEffect(() => {
    if (overrideTriviaList && overrideTriviaList.length > 0) {
      setTriviaList(overrideTriviaList);
      return;
    }
    let mounted = true;
    Promise.all([getActiveTriviaList(), getLoadingConfig()]).then(([list, config]) => {
      if (!mounted) return;
      if (config && config.rotation_interval && !customInterval) {
        setIntervalSec(config.rotation_interval);
      }
      if (list && list.length > 0) {
        let filtered = list;
        if (config && Array.isArray(config.active_categories) && config.active_categories.length > 0) {
          const allowed = new Set(config.active_categories);
          const matched = list.filter(item => allowed.has(item.category));
          if (matched.length > 0) filtered = matched;
        }
        setTriviaList(filtered);
      }
    });
    return () => { mounted = false; };
  }, [overrideTriviaList, customInterval]);

  // Cycle trivia according to configured duration
  useEffect(() => {
    if (!triviaList.length) return;
    const ms = Math.max(2000, intervalSec * 1000);
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % triviaList.length);
      setFadeKey(k => k + 1);
    }, ms);
    return () => clearInterval(timer);
  }, [triviaList.length, intervalSec]);

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % triviaList.length);
    setFadeKey(k => k + 1);
  };

  const currentItem = triviaList[currentIndex] || DEFAULT_TRIVIA_ITEMS[0];
  const IconComponent = ICON_MAP[currentItem.icon] || Sparkles;
  const categoryStyle = CATEGORY_STYLES[currentItem.category] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className={`w-full bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden ${isScoped ? 'min-h-[420px]' : ''}`}>
      <style>
        {`
        .sdg-ring {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: conic-gradient(
            #E5243B 0% 5.88%, #DDA63A 5.88% 11.76%, #4C9F38 11.76% 17.64%, 
            #C5192D 17.64% 23.52%, #FF3A21 23.52% 29.40%, #26BDE2 29.40% 35.28%, 
            #FCC30B 35.28% 41.16%, #A21942 41.16% 47.04%, #FD6925 47.04% 52.92%, 
            #DD1367 52.92% 58.80%, #FD9D24 58.80% 64.68%, #BF8B2E 64.68% 70.56%, 
            #3F7E44 70.56% 76.44%, #0A97D9 76.44% 82.32%, #56C02B 82.32% 88.20%, 
            #00689D 88.20% 94.08%, #19486A 94.08% 100%
          );
          animation: sdg-spin 1.8s linear infinite;
          position: relative;
        }
        .sdg-ring-inner {
          position: absolute;
          inset: 6px;
          background: #ffffff;
          border-radius: 50%;
        }
        @keyframes sdg-spin {
          100% { transform: rotate(360deg); }
        }
        @keyframes progress-fill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .trivia-progress-bar {
          animation: progress-fill ${intervalSec}s linear infinite;
        }
        `}
      </style>

      {/* Animated SDG Ring Spinner */}
      <div className="relative mb-4">
        <div className="sdg-ring">
          <div className="sdg-ring-inner flex items-center justify-center">
            <span className="text-[10px] font-bold text-navy">2030</span>
          </div>
        </div>
      </div>

      {/* Main Status Text */}
      <h3 className="text-base sm:text-lg font-serif font-bold text-warm-gray mb-1">
        {message}
      </h3>
      <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-6">
        {submessage}
      </p>

      {/* Dynamic Trivia Card */}
      <div className="w-full max-w-lg bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/90 rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all duration-300">
        {/* Animated progress stripe for the current trivia timer */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
          <div key={fadeKey} className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 trivia-progress-bar" />
        </div>

        {/* Trivia Category & Action */}
        <div className="flex items-center justify-between gap-2 mb-3 pt-1">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryStyle}`}>
            <IconComponent className="w-3.5 h-3.5" />
            <span>{currentItem.category || "SDG Fact"}</span>
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-navy font-medium px-2 py-0.5 rounded-md hover:bg-white/80 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Show next tip"
          >
            <span>Next Tip</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Rotating Trivia Text */}
        <div key={`text-${fadeKey}`} className="min-h-[48px] flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            "{currentItem.text}"
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
          <span>Tip {currentIndex + 1} of {triviaList.length}</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            Knowledge-Powered Waiting
          </span>
        </div>
      </div>
    </div>
  );
}
