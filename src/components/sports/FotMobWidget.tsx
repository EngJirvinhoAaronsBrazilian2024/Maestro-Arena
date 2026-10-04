import React, { useState } from 'react';
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
}

export const FOTMOB_NAV_PRESETS = [
  { id: 'today', name: 'All Matches', url: '/api/besoccer/proxy?path=/livescore' },
  { id: 'premier-league', name: 'Premier League', url: 'https://www.fotmob.com/leagues/47/overview/premier-league' },
  { id: 'champions-league', name: 'Champions League', url: 'https://www.fotmob.com/leagues/42/overview/champions-league' },
  { id: 'la-liga', name: 'La Liga', url: 'https://www.fotmob.com/leagues/87/overview/la-liga' },
  { id: 'serie-a', name: 'Serie A', url: 'https://www.fotmob.com/leagues/55/overview/serie-a' },
  { id: 'bundesliga', name: 'Bundesliga', url: 'https://www.fotmob.com/leagues/54/overview/bundesliga' },
  { id: 'ligue-1', name: 'Ligue 1', url: 'https://www.fotmob.com/leagues/53/overview/ligue-1' }
];

export function FotMobWidget({
  height = '1150px',
  minHeight = '850px',
  className = '',
  defaultLeague = 'today',
  showLeaguePills = true
}: FotMobWidgetProps) {
  const [activePreset, setActivePreset] = useState<string>(defaultLeague);
  const [iframeUrl, setIframeUrl] = useState<string>(
    FOTMOB_NAV_PRESETS.find(p => p.id === defaultLeague)?.url || '/api/besoccer/proxy?path=/livescore'
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleSelectPreset = (preset: typeof FOTMOB_NAV_PRESETS[0]) => {
    setActivePreset(preset.id);
    setIsLoading(true);
    setIframeUrl(preset.url);
    setReloadKey(k => k + 1);
  };

  const handleReload = () => {
    setIsLoading(true);
    setReloadKey(k => k + 1);
  };

  return (
    <div className={cn(
      "relative rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all duration-300 flex flex-col min-h-0",
      height === '100%' ? "flex-1 h-full" : "",
      isExpanded ? "fixed inset-2 sm:inset-6 z-50 rounded-3xl shadow-2xl" : "",
      className
    )}>
      {/* Quick League Navigation Pills (All matches, Premier League, etc.) */}
      {showLeaguePills && (
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 bg-slate-50/80 shrink-0 flex items-center justify-between gap-2">
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

      {/* 3. Embed Container - Permanently Spacious Tall View with Top & Bottom Footer Masking */}
      <div 
        className="w-full relative overflow-hidden bg-white flex-1 min-h-0 h-full"
        style={height === '100%' ? undefined : { 
          height: isExpanded 
            ? 'calc(100vh - 120px)' 
            : '1350px',
          minHeight: isExpanded 
            ? '680px' 
            : '1100px'
        }}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs p-6 text-center animate-in fade-in duration-200">
            <div className="relative flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin"></div>
              <Activity className="w-5 h-5 text-emerald-600 absolute" />
            </div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              Connecting to Live Football Match Feed...
            </h4>
            <p className="text-xs text-slate-500 font-medium max-w-sm mt-1">
              Loading real-time live scores, active match clocks, verified lineups, and official competition tables.
            </p>
          </div>
        )}

        {/* Iframe with top and bottom footer masking (extends beyond edges inside overflow-hidden) */}
        <iframe
          key={`${reloadKey}-${iframeUrl}`}
          src={iframeUrl}
          title="Football Scores & Matches Centre"
          frameBorder="0"
          width="100%"
          height="100%"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; storage-access *; cross-origin-isolated"
          onLoad={() => setIsLoading(false)}
          className="w-full border-0 block"
          style={{
            position: 'absolute',
            top: activePreset === 'today' ? '0px' : '-54px',
            left: 0,
            width: '100%',
            height: activePreset === 'today' ? 'calc(100% + 60px)' : 'calc(100% + 54px + 60px)',
            border: 'none',
            display: 'block',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.25s ease-in-out'
          }}
        />
      </div>
    </div>
  );
}

export default FotMobWidget;
