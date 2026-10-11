import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  RotateCw, 
  Tv 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FotMobWidget } from '../components/sports/FotMobWidget';

export function Livescore() {
  const [viewMode, setViewMode] = useState<'live' | 'highlights'>('live');
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(true);
  const [videoKey, setVideoKey] = useState<number>(0);
  const [liveReloadKey, setLiveReloadKey] = useState<number>(0);

  // Auto-dismiss loading state so it never interferes with video playback or user interactions
  useEffect(() => {
    if (isVideoLoading) {
      const timer = setTimeout(() => {
        setIsVideoLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isVideoLoading, videoKey]);

  const handleRefresh = () => {
    if (viewMode === 'live') {
      setLiveReloadKey((prev) => prev + 1);
    } else {
      setIsVideoLoading(true);
      setVideoKey((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 space-y-1.5 sm:space-y-2 overflow-hidden animate-in fade-in duration-200">
      {/* Page Up Toolbar: 2 buttons ("Live matches" and "Video highlights") without cluttering texts */}
      <div className="shrink-0 flex items-center justify-between gap-2 pt-0.5 px-0.5">
        <div className="flex-1 flex items-center p-1 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xs">
          {/* 1. Live Matches Button */}
          <button
            type="button"
            onClick={() => setViewMode('live')}
            className={cn(
              "flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
              viewMode === 'live'
                ? "bg-rose-600 text-white shadow-sm shadow-rose-600/25"
                : "bg-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100/70"
            )}
          >
            <Radio className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0", viewMode === 'live' && "animate-pulse")} />
            <span>Live matches</span>
          </button>

          {/* 2. Video Highlights Button */}
          <button
            type="button"
            onClick={() => setViewMode('highlights')}
            className={cn(
              "flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
              viewMode === 'highlights'
                ? "bg-rose-600 text-white shadow-sm shadow-rose-600/25"
                : "bg-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100/70"
            )}
          >
            <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Video highlights</span>
          </button>
        </div>

        {/* Subtle quick refresh button */}
        <button
          type="button"
          onClick={handleRefresh}
          className="p-2 sm:p-2.5 rounded-2xl bg-white/95 hover:bg-white border border-slate-200/90 text-slate-600 hover:text-rose-600 shadow-2xs transition-all cursor-pointer shrink-0"
          title="Refresh matches"
        >
          <RotateCw className={cn("w-4 h-4", isVideoLoading && viewMode === 'highlights' && "animate-spin text-rose-600")} />
        </button>
      </div>

      {/* Main Preview Area: Vertical, spacious, maximizes vertical screen real estate for all matches */}
      {viewMode === 'live' ? (
        <div 
          key={liveReloadKey}
          className="w-full flex-1 h-full min-h-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs"
        >
          <FotMobWidget 
            height="100%"
            minHeight="0"
            showLeaguePills={false}
            className="flex-1 h-full min-h-0 border-0 rounded-none shadow-none"
          />
        </div>
      ) : (
        <div className="w-full flex-1 h-full min-h-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs relative">
          <div className="relative w-full flex-1 h-full min-h-0 bg-slate-950 overflow-hidden">
            {isVideoLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs pointer-events-none transition-opacity duration-300">
                <div className="h-9 w-9 rounded-full border-4 border-slate-100 border-t-rose-600 animate-spin"></div>
                <p className="mt-2.5 text-xs font-bold text-slate-800">Loading highlights...</p>
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
