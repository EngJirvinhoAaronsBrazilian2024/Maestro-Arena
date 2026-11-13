import React, { useEffect, useState, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { WifiOff, RefreshCw, Sparkles, X, Radio } from 'lucide-react';
import { toast } from 'sonner';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const wasOfflineRef = useRef<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        toast.success('Back online — Live scores & news syncing', { duration: 2500 });
      }
    };
    const handleOffline = () => {
      wasOfflineRef.current = true;
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function PWAStatusBanners() {
  const isOnline = useOnlineStatus();
  const [dismissedUpdate, setDismissedUpdate] = useState(false);
  const [cachedCount, setCachedCount] = useState(0);

  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        swRegRef.current = registration;
      }
    },
    onRegisterError() {
      // Ignore harmless SW registration issues in restricted environments
    },
  });

  useEffect(() => {
    const checkUpdate = () => {
      if (navigator.onLine && swRegRef.current) {
        swRegRef.current.update().catch(() => {});
      }
    };
    const interval = setInterval(checkUpdate, 60 * 1000);
    const onVis = () => {
      if (document.visibilityState === 'visible') checkUpdate();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      try {
        const saved = localStorage.getItem('sportshub_matches_cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed?.matches)) {
            setCachedCount(parsed.matches.length);
            return;
          }
        }
      } catch {
        // ignore
      }
      setCachedCount(0);
    }
  }, [isOnline]);

  const handleApplyUpdate = async () => {
    try {
      await updateServiceWorker(true);
    } catch {
      window.location.reload();
    }
  };

  return (
    <>
      {/* Offline Scoreboard Banner */}
      {!isOnline && (
        <div
          role="status"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-xl animate-in slide-in-from-top-3 duration-300"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/95 backdrop-blur-md px-3.5 py-2.5 text-amber-950 shadow-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black leading-tight flex items-center gap-1.5">
                  <span>Offline Mode — Cached Scoreboard Active</span>
                </p>
                <p className="text-[11px] font-medium text-amber-800 truncate">
                  {cachedCount > 0
                    ? `Showing ${cachedCount} cached fixtures & saved stories until connection returns.`
                    : 'Showing cached scores & saved stories. Reconnect for live updates.'}
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200/70 text-[10px] font-black uppercase tracking-wider shrink-0">
              <Radio className="w-3 h-3" />
              Cached
            </span>
          </div>
        </div>
      )}

      {/* Smart PWA Update Prompt Banner */}
      {needRefresh && !dismissedUpdate && (
        <div
          role="alert"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-md animate-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-white/95 backdrop-blur-xl p-3.5 shadow-2xl">
            <button
              type="button"
              onClick={handleApplyUpdate}
              className="flex flex-1 items-center gap-3 text-left cursor-pointer group min-w-0"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                  New version available — Tap to update
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                  Includes the latest scores, branding & performance updates
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black shrink-0 shadow-xs group-hover:bg-rose-700 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
                Update
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDismissedUpdate(true);
                setNeedRefresh(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss update notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
