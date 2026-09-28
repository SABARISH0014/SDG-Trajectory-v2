import React, { useState } from 'react';
import { 
  Download, 
  Sparkles, 
  Zap, 
  WifiOff, 
  Maximize2, 
  ShieldCheck, 
  X, 
  Share2, 
  PlusSquare, 
  Globe2, 
  CheckCircle2,
  Smartphone,
  Laptop
} from 'lucide-react';
import { usePWA } from '../context/PWAContext';
import { sdgColors } from '../data/sdgColors';

export default function PWAInstallPrompt() {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isModalOpen, 
    promptInstall, 
    closeInstallModal 
  } = usePWA();

  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already installed or modal is closed, don't render
  if (isInstalled || !isModalOpen) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    closeInstallModal(dontShowAgain);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative 17-SDG Gradient Bar */}
        <div className="flex h-1.5 w-full overflow-hidden">
          {Array.from({ length: 17 }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              className="flex-1 h-full"
              style={{ backgroundColor: sdgColors[num] }}
            />
          ))}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close install prompt"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 p-0.5 shadow-lg shadow-teal-500/20 flex-shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Globe2 className="w-7 h-7 text-teal-400 animate-pulse" />
            </div>
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-teal-500/10 text-teal-300 border border-teal-500/20 mb-1.5">
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>Progressive Web App</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight leading-snug">
              Install SDG Trajectory
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Enhance your experience by installing our interactive 2030 Global Atlas directly onto your device.
            </p>
          </div>
        </div>

        {/* Key Benefits Grid */}
        <div className="px-6 py-3 space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Why Install SDG Trajectory?
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* Benefit 1: Instant Launch */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white">Instant Launch</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Launches in seconds from your desktop or phone home screen.
                </p>
              </div>
            </div>

            {/* Benefit 2: Standalone Full-Screen */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Maximize2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white">Full-Screen Atlas</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  No browser tabs or address bar clutter. Dedicated workspace.
                </p>
              </div>
            </div>

            {/* Benefit 3: Offline Resilience */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <WifiOff className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white">Offline Resilience</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Cached goal targets and country scorecards load even without internet.
                </p>
              </div>
            </div>

            {/* Benefit 4: Lightweight & Always Updated */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white">Always Up-To-Date</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Uses minimal storage and syncs the latest 2030 predictions seamlessly.
                </p>
              </div>
            </div>
          </div>

          {/* iOS Safari Manual Instructions if detected */}
          {isIOS && (
            <div className="mt-3 p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/30 text-xs text-teal-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-teal-300">
                <Smartphone className="w-4 h-4" />
                <span>How to Install on iPhone / iPad:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11.5px] text-slate-300 pl-1">
                <li>
                  Tap the <Share2 className="w-3.5 h-3.5 inline mx-1 text-teal-400" /> <span className="font-semibold text-white">Share</span> button at the bottom of Safari.
                </li>
                <li>
                  Scroll down and select <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-teal-400" /> <span className="font-semibold text-white">Add to Home Screen</span>.
                </li>
                <li>
                  Tap <span className="font-semibold text-white">Add</span> in the top right to complete.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Modal Footer & Actions */}
        <div className="p-6 pt-3 bg-slate-950/40 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500/30 w-3.5 h-3.5"
            />
            <span>Don't show this prompt again</span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              Maybe Later
            </button>

            {!isIOS ? (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{installing ? 'Installing...' : 'Install App'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Got It</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
