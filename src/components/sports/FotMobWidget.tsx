import React, { useState, useEffect } from 'react';
import { 
  RotateCw,
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FotMobWidgetProps {
  height?: number | string;
  minHeight?: number | string;
  className?: string;
  defaultLeague?: string;
  showLeaguePills?: boolean;
  onToggleWide?: () => void;
  isWide?: boolean;
}

export const FOTMOB_NAV_PRESETS = [
  { id: 'today', name: 'All Matches', url: 'https://www.scorebat.com/embed/livescore/' }
];

export function FotMobWidget({
  height = '100%',
  minHeight = '0',
  className = '',
  defaultLeague = 'today',
  showLeaguePills = false,
}: FotMobWidgetProps) {
  const [activePreset, setActivePreset] = useState<string>(defaultLeague);
  const [iframeUrl, setIframeUrl] = useState<string>(
    FOTMOB_NAV_PRESETS.find(p => p.id === defaultLeague)?.url || '/api/scorebat/proxy'
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reloadKey, setReloadKey] = useState<number>(0);

  const isScoreBat = activePreset === 'today';

  // Auto-dismiss loading state quickly so it never blocks or causes delays
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, reloadKey, iframeUrl]);

  // Tab switching: ScoreBat for All Matches
  const handleSelectPreset = (preset: typeof FOTMOB_NAV_PRESETS[0]) => {
    setActivePreset(preset.id);
    setIsLoading(true);
    setIframeUrl(preset.url);
    setReloadKey((k) => k + 1);
  };

  const handleReload = () => {
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className={cn(
      "relative rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all duration-300 flex flex-col min-h-0",
      height === '100%' ? "flex-1 h-full" : "",
      className
    )}>
      {/* 1. Quick League Navigation Pills (if enabled) */}
      {showLeaguePills && (
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 bg-slate-50/80 shrink-0 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            {FOTMOB_NAV_PRESETS.map((preset) => {
              const isSelected = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 border",
                    isSelected
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-xs shadow-emerald-700/25 font-black"
                      : "bg-white text-slate-600 hover:text-slate-900 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleReload}
              className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 shadow-2xs transition-all cursor-pointer"
              title="Reload Feed"
            >
              <RotateCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-emerald-600")} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Content Container */}
      <div 
        className="w-full relative overflow-hidden bg-white flex-1 min-h-0 h-full"
        style={{ 
          height: height === '100%' ? '100%' : height,
          minHeight: height === '100%' ? '0' : minHeight
        }}
      >
        {isLoading && (
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-center p-2 bg-white/90 backdrop-blur-xs border-b border-emerald-100 animate-in fade-in duration-150 pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
              <span className="text-xs font-bold text-slate-800">
                Updating match feed...
              </span>
            </div>
          </div>
        )}

        <iframe
          key={`${reloadKey}-${iframeUrl}`}
          src={iframeUrl}
          title={isScoreBat ? "ScoreBat Global Livescores" : "Football Scores & Matches Centre"}
          frameBorder="0"
          width="100%"
          height="100%"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0 block"
          style={{
            position: 'absolute',
            top: isScoreBat ? '-48px' : 0,
            left: 0,
            width: '100%',
            height: isScoreBat ? 'calc(100% + 48px)' : '100%',
            border: 'none',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
}

export default FotMobWidget;
