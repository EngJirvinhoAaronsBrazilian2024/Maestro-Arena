import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  RotateCw, 
  Tv,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FotMobWidget } from '../components/sports/FotMobWidget';

export function Livescore() {
  const [viewMode, setViewMode] = useState<'fotmob' | 'video-highlights'>('fotmob');
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(true);
  const [videoKey, setVideoKey] = useState<number>(0);
  const [isWideScreen, setIsWideScreen] = useState<boolean>(false);

  // Auto-dismiss loading state so it NEVER interferes with video playback or user clicks
  useEffect(() => {
    if (isVideoLoading) {
      const timer = setTimeout(() => {
        setIsVideoLoading(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isVideoLoading, videoKey]);

  // Support ESC key to exit wide screen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWideScreen) {
        setIsWideScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWideScreen]);

  const handleReloadVideo = () => {
    setIsVideoLoading(true);
    setVideoKey((prev) => prev + 1);
  };

  const toggleWideScreen = () => {
    setIsWideScreen(prev => !prev);
  };

  return (
    <div className={cn(
      "w-full h-full flex-1 flex flex-col min-h-0 space-y-2.5 overflow-y-auto sm:overflow-hidden animate-in fade-in duration-300",
      isWideScreen && "fixed inset-0 z-[100] bg-gradient-to-br from-[#E6F0FA] via-[#D1E0F0] to-[#B8CCE4] p-2 sm:p-3.5 w-screen h-screen space-y-2 overflow-hidden"
    )}>
      {/* 1. Header Card / Wide Screen Toolbar */}
      {isWideScreen ? (
        /* Wide Screen Top Bar - Maintaining App Theme (No Dark Mode) */
        <div className="rounded-2xl border-2 sm:border-[2.5px] border-red-500 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse inline-block shrink-0 shadow-xs" />
            <span className="font-extrabold text-sm sm:text-base text-slate-950 tracking-tight">
              Livescore Center <span className="text-xs font-semibold text-rose-600 hidden sm:inline">(Wide Screen Mode)</span>
            </span>
          </div>

          {/* Quick switcher inside wide mode */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100/90 border border-slate-200/80 p-0.5 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('fotmob')}
                className={cn(
                  "py-1.5 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer",
                  viewMode === 'fotmob'
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-200/60"
                )}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Live Matches</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('video-highlights')}
                className={cn(
                  "py-1.5 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer",
                  viewMode === 'video-highlights'
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-200/60"
                )}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Video Highlights</span>
              </button>
            </div>

            {/* Exit Wide Screen Button */}
            <button
              type="button"
              onClick={toggleWideScreen}
              className="py-1.5 px-3 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-red-300 text-slate-700 hover:text-red-600 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Exit Wide Screen (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5 text-red-600" />
              <span>Exit Wide</span>
            </button>
          </div>
        </div>
      ) : (
        /* Regular Livescore Header Card */
        <div className="rounded-3xl border-2 sm:border-[2.5px] border-red-500 bg-white p-4 sm:p-5 shadow-xs space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Livescore Center with Red Bullet */}
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-red-600 inline-block shrink-0 shadow-xs" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Livescore Center
              </h1>
            </div>

            {/* Widen Screen Symbol Button */}
            <button
              type="button"
              onClick={toggleWideScreen}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 text-slate-700 hover:text-slate-950 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Widen the screen to full width"
            >
              <Maximize2 className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Widen Screen</span>
            </button>
          </div>

          {/* Real-time World Football Badge */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-semibold shadow-2xs">
              <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>Real-time World Football</span>
            </div>
          </div>

          {/* Subtitle description */}
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
            Real-time live scores, match clocks, live goal alerts, and official video replays.
          </p>

          {/* View Mode Switcher: Live Matches vs Video Highlights */}
          <div className="bg-slate-50/90 border border-slate-100 p-1 rounded-2xl flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode('fotmob')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
                viewMode === 'fotmob'
                  ? "bg-red-600 text-white shadow-md shadow-red-500/25"
                  : "bg-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100/60"
              )}
            >
              <Radio className="w-4 h-4" />
              <span>Live Matches</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('video-highlights')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
                viewMode === 'video-highlights'
                  ? "bg-red-600 text-white shadow-md shadow-red-500/25"
                  : "bg-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100/60"
              )}
            >
              <Tv className={cn("w-4 h-4", viewMode === 'video-highlights' ? "text-white" : "text-amber-500")} />
              <span>Video Highlights</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Content Area */}
      {viewMode === 'fotmob' ? (
        /* Live Matches View: Directly shows league pills and match feed */
        <div className="w-full flex-1 h-full min-h-0 flex flex-col overflow-hidden">
          <FotMobWidget 
            height="100%"
            minHeight="850px"
            className="flex-1 h-full min-h-0"
            onToggleWide={toggleWideScreen}
            isWide={isWideScreen}
          />
        </div>
      ) : (
        /* Video Highlights View: Displays all videos directly without any tabs, fully clickable without interference */
        <div className="w-full flex-1 h-full min-h-0 flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs relative">
          {/* Subtle top toolbar with widen & refresh controls */}
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/80 shrink-0 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Official Match Videos & Goal Highlights
            </span>
            <div className="flex items-center gap-2">
              {/* Symbol that widens the screen on Video Highlights */}
              <button
                type="button"
                onClick={toggleWideScreen}
                className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title={isWideScreen ? "Restore Normal Screen" : "Widen Screen"}
              >
                {isWideScreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-red-600" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{isWideScreen ? "Exit Wide" : "Widen"}</span>
              </button>

              <button
                type="button"
                onClick={handleReloadVideo}
                className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Reload Video Feed"
              >
                <RotateCw className={cn("w-3.5 h-3.5", isVideoLoading && "animate-spin text-red-600")} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Full Video Highlights Container: Masked header (-50px) and footer (+45px) with zero playback interference */}
          <div className="relative w-full flex-1 h-full min-h-0 bg-slate-950 overflow-hidden">
            {isVideoLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs pointer-events-none transition-opacity duration-300">
                <div className="h-10 w-10 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin"></div>
                <p className="mt-3 text-xs font-bold text-slate-800">Loading match highlights...</p>
              </div>
            )}

            <iframe
              key={videoKey}
              src="https://www.scorebat.com/embed/"
              title="Football Video Highlights"
              frameBorder="0"
              width="100%"
              height="100%"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              onLoad={() => setIsVideoLoading(false)}
              className="w-full h-full border-0 block"
              style={{
                position: 'absolute',
                top: '-50px',
                left: 0,
                width: '100%',
                height: 'calc(100% + 50px + 45px)',
                border: 'none',
                display: 'block'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Livescore;
