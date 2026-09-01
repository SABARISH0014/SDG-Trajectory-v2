import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Globe2, ChevronDown } from 'lucide-react';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize from localStorage to persist across route changes
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'en';
  });
  
  // Anti-flash mechanism: Hide the page very briefly during client-side navigation
  // to give Google Translate's MutationObserver time to translate the new DOM nodes.
  useLayoutEffect(() => {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && savedLang !== 'en') {
      document.body.style.opacity = '0'; // Hide synchronously before paint
      
      const timer = setTimeout(() => {
        document.body.style.transition = 'opacity 0.2s ease-in';
        document.body.style.opacity = '1'; // Fade in after Google has translated
        
        setTimeout(() => {
          document.body.style.transition = '';
        }, 200);
      }, 150); 
      
      return () => {
        clearTimeout(timer);
        document.body.style.opacity = '1';
        document.body.style.transition = '';
      };
    }
  }, []);

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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('preferredLanguage', langCode);
    setIsOpen(false);

    // Elegant Transition: Fade out the page first to mask the network latency and text snapping
    document.body.style.transition = 'opacity 0.15s ease-out';
    document.body.style.opacity = '0';

    // Wait for the fade-out to complete before triggering the heavy translation engine
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
      
      // Give Google Translate API time to fetch and swap text (350ms), then fade back in
      setTimeout(() => {
         document.body.style.transition = 'opacity 0.3s ease-in';
         document.body.style.opacity = '1';
         
         // Cleanup inline styles
         setTimeout(() => {
           document.body.style.transition = '';
         }, 300);
      }, 350);
    }, 150);
  };

  const selectedLabel = languages.find(l => l.code === currentLang)?.label || 'English';

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
          <ul className="py-1 max-h-64 overflow-y-auto scrollbar-hide">
            {languages.map((lang) => (
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
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
