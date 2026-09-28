import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PWAContext = createContext(null);

const STORAGE_KEY_PROMPT_DISMISSED = 'sdg_pwa_prompt_dismissed_until';
const STORAGE_KEY_DONT_SHOW_AGAIN = 'sdg_pwa_dont_show_again';

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasPromptedThisSession, setHasPromptedThisSession] = useState(false);

  // Check if currently running in standalone PWA mode
  const checkIsStandalone = useCallback(() => {
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    const isAndroidStandalone = document.referrer.includes('android-app://');
    return Boolean(isStandaloneDisplay || isIOSStandalone || isAndroidStandalone);
  }, []);

  useEffect(() => {
    // 1. Initial Standalone Check
    const standalone = checkIsStandalone();
    setIsInstalled(standalone);

    // 2. Detect iOS / iPadOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|android/.test(ua);
    const isIOSSafari = isIosDevice && isSafari;
    setIsIOS(isIOSSafari);

    // If iOS and not in standalone mode, mark as installable (manual guide)
    if (isIosDevice && !standalone) {
      setIsInstallable(true);
    }

    // 3. Listen for standard PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent standard mini-infobar on mobile Chrome
      e.preventDefault();
      // Stash event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Auto-trigger prompt if eligible
      triggerAutoPromptIfEligible();
    };

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('[PWA] Application was successfully installed.');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsModalOpen(false);
      localStorage.setItem('sdg_pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Auto-prompt check for iOS or desktop browsers after component mounts
    const timer = setTimeout(() => {
      triggerAutoPromptIfEligible();
    }, 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [checkIsStandalone]);

  // Check whether we should auto-prompt on first open
  const triggerAutoPromptIfEligible = () => {
    if (checkIsStandalone()) return;
    if (localStorage.getItem('sdg_pwa_installed') === 'true') return;
    if (localStorage.getItem(STORAGE_KEY_DONT_SHOW_AGAIN) === 'true') return;

    const dismissedUntil = localStorage.getItem(STORAGE_KEY_PROMPT_DISMISSED);
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // Only prompt once per initial session automatically
    setHasPromptedThisSession((prev) => {
      if (!prev) {
        setIsModalOpen(true);
        return true;
      }
      return prev;
    });
  };

  // Trigger browser native install flow
  const promptInstall = async () => {
    if (!deferredPrompt) {
      // If iOS or native prompt not triggered yet, open the modal for instructions
      setIsModalOpen(true);
      return { outcome: 'manual_guide' };
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      // Wait for user choice
      const choiceResult = await deferredPrompt.userChoice;
      console.log(`[PWA] User response to install prompt: ${choiceResult.outcome}`);

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setIsModalOpen(false);
      } else {
        // If dismissed, set a 3-day quiet period
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY_PROMPT_DISMISSED, (Date.now() + threeDaysMs).toString());
      }

      setDeferredPrompt(null);
      return choiceResult;
    } catch (err) {
      console.error('[PWA] Error displaying install prompt:', err);
      return { outcome: 'error', error: err };
    }
  };

  const openInstallModal = () => {
    setIsModalOpen(true);
  };

  const closeInstallModal = (dontShowAgain = false) => {
    setIsModalOpen(false);
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY_DONT_SHOW_AGAIN, 'true');
    } else {
      // Snooze for 7 days
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY_PROMPT_DISMISSED, (Date.now() + sevenDaysMs).toString());
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIOS,
        isModalOpen,
        deferredPrompt,
        promptInstall,
        openInstallModal,
        closeInstallModal
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}
