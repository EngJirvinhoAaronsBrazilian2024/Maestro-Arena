import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  RotateCw, 
  Tv, 
  Shield,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';

export function Livescore() {
  // Two view modes: Live Matches and Video Highlights
  const [viewMode, setViewMode] = useState<'live-matches' | 'video-highlights'>('live-matches');
  const [isLoadingRealtime, setIsLoadingRealtime] = useState<boolean>(true);
  const [realtimeKey, setRealtimeKey] = useState<number>(0);
  const [isWideScreen, setIsWideScreen] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Load ScoreBat real-time embed resize and live-event handler script
  useEffect(() => {
    const existingScript = document.getElementById('scorebat-jssdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'scorebat-jssdk';
      script.src = 'https://www.scorebat.com/embed/embed.js?v=arrv';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Listen for Escape key to exit widescreen view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWideScreen) {
        setIsWideScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWideScreen]);

  const handleRefresh = () => {
    setIsLoadingRealtime(true);
    setRealtimeKey((prev) => prev + 1);
  };

  const getWidgetUrl = () => {
    if (viewMode === 'video-highlights') {
      return 'https://www.scorebat.com/embed/';
    }
    return 'https://www.scorebat.com/embed/livescore/';
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header Card with "Livescore Center" and Two Buttons: "Live Matches" & "Video Highlights" */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Livescore Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-rose-50 text-rose-700 rounded-full border border-rose-200/80 shadow-2xs">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-600" />
              Real-time World Football
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1.5">
            Real-time live scores, match clocks, live goal alerts, and official video replays.
          </p>
        </div>

        {/* Two Top Buttons: Live Matches & Video Highlights */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => {
              if (viewMode !== 'live-matches') {
                setViewMode('live-matches');
                setIsLoadingRealtime(true);
              }
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'live-matches'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Radio className="w-4 h-4" />
            Live Matches
          </button>

          <button
            onClick={() => {
              if (viewMode !== 'video-highlights') {
                setViewMode('video-highlights');
                setIsLoadingRealtime(true);
              }
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'video-highlights'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Tv className="w-4 h-4 text-amber-500" />
            Video Highlights
          </button>
        </div>
      </div>

      {/* 2. Embedded ScoreBat Real-Time Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <h2 className="text-base font-bold text-slate-900">
              {viewMode === 'live-matches'
                ? 'Global Live Matches & Video Goals'
                : 'Official Video Highlights & Match Replays'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Extendable Symbol to widen screen */}
            <button
              onClick={() => setIsWideScreen(true)}
              title="Expand to Widescreen Theater Mode"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200/90 shadow-2xs transition-all cursor-pointer hover:border-rose-300"
            >
              <Maximize2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Widescreen</span>
            </button>

            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-rose-600 ${isLoadingRealtime ? 'animate-spin' : ''}`} />
              Refresh Feed
            </button>
          </div>
        </div>

        {/* Embedded ScoreBat Widget Container (Heading completely hidden via marginTop: -54px & overflow: hidden) */}
        <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-xs">
          {isLoadingRealtime && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs transition-opacity duration-300">
              <div className="relative flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-4 border-slate-100"></div>
                <div className="absolute h-10 w-10 rounded-full border-4 border-rose-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-3 text-xs sm:text-sm font-bold text-slate-800">
                Loading real-time matches from ScoreBat...
              </p>
              <p className="text-2xs sm:text-xs text-slate-500 mt-1">
                Connecting to live goal feeds, match clocks & verified video replays
              </p>
            </div>
          )}

          <div className="w-full relative overflow-hidden" style={{ height: '860px', minHeight: '650px' }}>
            <iframe
              ref={iframeRef}
              key={`${viewMode}-${realtimeKey}`}
              src={getWidgetUrl()}
              title="ScoreBat Real-Time Football Widget"
              frameBorder="0"
              width="100%"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              onLoad={() => setIsLoadingRealtime(false)}
              className="w-full border-0 block"
              style={{
                width: '100%',
                marginTop: '-54px', // Completely conceals the ScoreBat top heading bar
                height: 'calc(100% + 54px)',
                border: 'none',
                display: 'block',
                opacity: isLoadingRealtime ? 0 : 1,
                transition: 'opacity 0.25s ease-in-out'
              }}
            />
          </div>
        </div>

        {/* Provenance Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-2xs text-slate-400 px-3 py-1">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-300" />
            Official ScoreBat Live Feed & Video Replays • Maestro Arena
          </span>
          <span className="font-semibold text-rose-600 mt-1 sm:mt-0">
            Real-time Match Center
          </span>
        </div>
      </div>

      {/* 3. Widescreen Full Theater Mode (Opens inside the app when the extendable symbol is clicked) */}
      {isWideScreen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md p-2 sm:p-5 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Top Bar for Widescreen View */}
          <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl mb-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  Livescore Center
                  <span className="text-2xs font-bold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded-full">
                    Widescreen Mode
                  </span>
                </h2>
                <p className="text-2xs text-slate-400 hidden sm:block">
                  All match feeds and video replays expanded to full width
                </p>
              </div>
            </div>

            {/* Controls in Widescreen Mode */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => {
                    setViewMode('live-matches');
                    setIsLoadingRealtime(true);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'live-matches'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  Live Matches
                </button>
                <button
                  onClick={() => {
                    setViewMode('video-highlights');
                    setIsLoadingRealtime(true);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'video-highlights'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  Highlights
                </button>
              </div>

              <button
                onClick={handleRefresh}
                title="Refresh Feed"
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
              >
                <RotateCw className={`w-4 h-4 text-rose-400 ${isLoadingRealtime ? 'animate-spin' : ''}`} />
              </button>

              {/* Exit Fullscreen / Minimize Button */}
              <button
                onClick={() => setIsWideScreen(false)}
                title="Exit Widescreen Mode (Esc)"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Iframe Container (ScoreBat heading concealed) */}
          <div className="flex-1 w-full relative rounded-2xl overflow-hidden bg-white shadow-2xl border border-slate-800">
            {isLoadingRealtime && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs">
                <div className="relative flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-4 border-slate-200"></div>
                  <div className="absolute h-10 w-10 rounded-full border-4 border-rose-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-3 text-xs sm:text-sm font-bold text-slate-800">
                  Loading widescreen live feed...
                </p>
              </div>
            )}

            <iframe
              src={getWidgetUrl()}
              title="ScoreBat Widescreen Widget"
              frameBorder="0"
              width="100%"
              height="100%"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              className="w-full border-0 block"
              style={{
                width: '100%',
                marginTop: '-54px', // ScoreBat heading completely hidden in widescreen too
                height: 'calc(100% + 54px)',
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
