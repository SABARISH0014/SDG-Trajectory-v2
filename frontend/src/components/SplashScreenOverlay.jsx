import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { getActiveTriviaList, getLoadingConfig, DEFAULT_TRIVIA_ITEMS } from '../lib/triviaService';

export default function SplashScreenOverlay({ message = "Initializing Global Data..." }) {
  const [triviaList, setTriviaList] = useState(DEFAULT_TRIVIA_ITEMS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [intervalSec, setIntervalSec] = useState(3.5);

  useEffect(() => {
    let mounted = true;
    Promise.all([getActiveTriviaList(), getLoadingConfig()]).then(([list, config]) => {
      if (!mounted) return;
      if (config && config.rotation_interval) {
        setIntervalSec(config.rotation_interval);
      }
      if (list && list.length > 0) {
        setTriviaList(list);
      }
    });
    return () => { mounted = false; };
  }, []);

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

  const overlay = (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
      <style>
        {`
        .sdg-spinner-wrapper {
          position: relative;
          width: 64px;
          height: 64px;
          margin-bottom: 20px;
        }
        .sdg-spinner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: conic-gradient(
            #E5243B 0% 5.88%, #DDA63A 5.88% 11.76%, #4C9F38 11.76% 17.64%, 
            #C5192D 17.64% 23.52%, #FF3A21 23.52% 29.40%, #26BDE2 29.40% 35.28%, 
            #FCC30B 35.28% 41.16%, #A21942 41.16% 47.04%, #FD6925 47.04% 52.92%, 
            #DD1367 52.92% 58.80%, #FD9D24 58.80% 64.68%, #BF8B2E 64.68% 70.56%, 
            #3F7E44 70.56% 76.44%, #0A97D9 76.44% 82.32%, #56C02B 82.32% 88.20%, 
            #00689D 88.20% 94.08%, #19486A 94.08% 100%
          );
          animation: sdg-spin 2s linear infinite;
        }
        .sdg-spinner-inner {
          position: absolute;
          top: 8px; left: 8px; right: 8px; bottom: 8px;
          background-color: #ffffff;
          border-radius: 50%;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }
        @keyframes sdg-spin {
          100% { transform: rotate(360deg); }
        }
        @keyframes trivia-fill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .splash-trivia-bar {
          animation: trivia-fill ${intervalSec}s linear infinite;
        }
        `}
      </style>
      
      <div className="bg-white/95 border border-slate-200/90 shadow-2xl rounded-2xl p-6 sm:p-8 max-w-lg w-full flex flex-col items-center text-center space-y-4">
        <div className="sdg-spinner-wrapper">
          <div className="sdg-spinner"></div>
          <div className="sdg-spinner-inner flex items-center justify-center">
            <span className="text-[10px] font-bold text-navy">SDG</span>
          </div>
        </div>

        <div>
          <div className="text-lg font-serif font-bold text-navy">SDG Trajectory Forecaster</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">{message}</div>
        </div>

        {/* Dynamic Trivia Box inside overlay */}
        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-200 overflow-hidden">
            <div key={fadeKey} className="h-full bg-teal-500 splash-trivia-bar" />
          </div>

          <div className="flex items-center justify-between gap-2 mb-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full">
              {currentItem.category || "SDG Fact"}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="text-[10px] font-medium text-slate-400 hover:text-navy flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          <div key={`splash-${fadeKey}`} className="min-h-[40px] flex items-center animate-in fade-in duration-200">
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              "{currentItem.text}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
