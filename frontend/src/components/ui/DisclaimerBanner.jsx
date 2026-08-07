import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './Button';

export default function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 p-4 animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-7xl mx-auto bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <strong className="text-white">Disclaimer:</strong> The data presented in this application is sourced from free and open-source datasets (like UN API and Our World in Data). 
            Please be aware that open-source data and AI-generated trajectory forecasts are not always 100% accurate or up-to-date. 
            Do not rely solely on this tool for critical policy decisions without independent verification.
          </div>
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsVisible(false)}
            className="text-white border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            I Understand
          </Button>
          <button 
            onClick={() => setIsVisible(false)} 
            className="ml-4 text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
