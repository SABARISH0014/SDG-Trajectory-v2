import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Globe2, ChevronDown, Search } from 'lucide-react';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  // Initialize from localStorage to persist across route changes
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'en';
  });


  const [languages, setLanguages] = useState([
    { code: 'en', label: 'English' } // default fallback
  ]);
  const dropdownRef = useRef(null);

  // Poll for Google Translate options and sync initial state
  useEffect(() => {
    let intervalId;
    const fetchLanguages = () => {
      const select = document.querySelector('.goog-te-combo');
      if (select && select.options.length > 0) {
        const langOptions = Array.from(select.options)
          .filter(opt => opt.value)
          .map(opt => ({
            code: opt.value,
            label: opt.text
          }));
        
        if (!langOptions.find(l => l.code === 'en')) {
           langOptions.unshift({ code: 'en', label: 'English' });
        }
        
        setLanguages(langOptions);
        
        // Sync Google Translate with our saved localStorage state on page mount
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang && savedLang !== 'en' && select.value !== savedLang) {
           select.value = savedLang;
           select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        }
        
        clearInterval(intervalId);
      }
    };
    
    intervalId = setInterval(fetchLanguages, 500);
    return () => clearInterval(intervalId);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('preferredLanguage', langCode);
    setIsOpen(false);

    // Show splash screen to mask network latency and text snapping

    setTimeout(() => {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        if (langCode === 'en') {
          select.value = 'en'; 
        } else {
          select.value = langCode;
        }
        select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      } else {
        console.warn('Google Translate select not found.');
      }
      
      // Give Google Translate API time to fetch and swap text (400ms), then hide splash
    }, 50);
  };

  const selectedLabel = languages.find(l => l.code === currentLang)?.label || 'English';

  const filteredLanguages = languages.filter(lang => 
    lang.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative notranslate" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate max-w-[100px]">{selectedLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-50 overflow-hidden"
             style={{ animation: 'dropdownIn 0.2s ease-out' }}>
          <div className="p-2 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy placeholder:text-slate-400"
              />
            </div>
          </div>
          <ul className="py-1 max-h-56 overflow-y-auto scrollbar-hide">
            {filteredLanguages.length === 0 ? (
              <li className="px-4 py-3 text-xs text-slate-400 text-center">No languages found</li>
            ) : (
              filteredLanguages.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-100 transition-colors ${
                    currentLang === lang.code ? 'text-navy font-bold bg-slate-50' : 'text-slate-700'
                  }`}
                >
                  {lang.label}
                </button>
              </li>
            )))}
          </ul>
        </div>
      )}
    </div>
  );
}
