import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone || 
                             document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    
    const canShowPrompt = Date.now() - dismissedTime > oneWeekMs;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (canShowPrompt) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If it's iOS and not standalone, we might want to show the manual prompt
    // only if they haven't dismissed it recently
    if (isIosDevice && canShowPrompt && !isStandaloneMode) {
      // Delay prompt slightly to not interrupt immediate loading
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <img src="/pwa-192x192.png" alt="Maestro Arena" className="w-12 h-12 rounded-xl shadow-sm border border-gray-100" />
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">Install Maestro Arena</h3>
              <p className="text-sm text-gray-500 mt-0.5">Get faster access and the full mobile app experience.</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="mt-4 flex flex-col space-y-2">
          {isIOS && !deferredPrompt ? (
            <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-xl flex items-center justify-center space-x-2 text-center">
              <span>Tap</span>
              <Share size={16} className="text-blue-600" />
              <span>then <strong>Add to Home Screen</strong></span>
              <PlusSquare size={16} className="text-blue-600" />
            </div>
          ) : (
            <button 
              onClick={handleInstall}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
            >
              Install App
            </button>
          )}
          
          <button 
            onClick={handleDismiss}
            className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 text-sm transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
