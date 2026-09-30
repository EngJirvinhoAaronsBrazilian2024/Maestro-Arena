import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { RotateCw, AlertCircle } from 'lucide-react';

export interface ScoreAxisLeague {
  id: string;
  name: string;
  country: string;
  code: string;
}

export const SCOREAXIS_LEAGUES: ScoreAxisLeague[] = [
  { id: '6232265abf1fa71a672159ec', name: 'Premier League', country: 'England', code: 'PL' },
  { id: '6232265abf1fa71a672159ef', name: 'UEFA Champions League', country: 'Europe', code: 'UCL' },
  { id: '6232265abf1fa71a672159ee', name: 'La Liga', country: 'Spain', code: 'PD' },
  { id: '6232265abf1fa71a672159f0', name: 'Serie A', country: 'Italy', code: 'SA' },
  { id: '6232265abf1fa71a672159f1', name: 'Bundesliga', country: 'Germany', code: 'BL1' },
  { id: '6232265abf1fa71a672159f2', name: 'Ligue 1', country: 'France', code: 'FL1' },
];

interface ScoreAxisWidgetProps {
  type: 'league-table' | 'league-top-players' | 'live-match';
  targetId: string;
  minHeight?: number;
  className?: string;
  onLoaded?: () => void;
}

export function ScoreAxisWidget({
  type,
  targetId,
  minHeight = 650,
  className = '',
  onLoaded,
}: ScoreAxisWidgetProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [reloadToken, setReloadToken] = useState<number>(0);

  // Maestro Arena's official Light Mode & Crimson Red Palette
  const bodyColor = '%23ffffff';
  const textColor = '%230f172a';
  const linkColor = '%23dc2626'; // Maestro Arena Crimson Red
  const borderColor = '%23e2e8f0';
  const tabColor = '%23f8fafc';

  let scriptSrc = '';
  if (type === 'league-table') {
    scriptSrc = `https://widgets.scoreaxis.com/api/football/league-table/${targetId}?widgetId=fyvpmulfhlv7&lang=en&teamLogo=1&tableLines=1&homeAway=1&header=1&position=1&goals=1&gamesCount=1&diff=1&winCount=1&drawCount=1&loseCount=1&lastGames=1&points=1&teamsLimit=all&links=1&noFollowLinks=0&font=inter&fontSize=14&rowDensity=100&widgetWidth=auto&widgetHeight=auto&bodyColor=${bodyColor}&textColor=${textColor}&linkColor=${linkColor}&borderColor=${borderColor}&tabColor=${tabColor}`;
  } else if (type === 'league-top-players') {
    scriptSrc = `https://widgets.scoreaxis.com/api/football/league-top-players/${targetId}?widgetId=hw3amul5qdyu&lang=en&playersCount=12&goalsBlock=1&assistsBlock=1&cardsBlock=1&links=1&noFollowLinks=0&font=inter&fontSize=14&rowDensity=100&widgetWidth=auto&widgetHeight=auto&bodyColor=${bodyColor}&textColor=${textColor}&linkColor=${linkColor}&borderColor=${borderColor}&tabColor=${tabColor}`;
  } else {
    scriptSrc = `https://widgets.scoreaxis.com/api/football/live-match/${targetId}?widgetId=1d4amulp5q3x&lang=en&lineupsBlock=1&eventsBlock=1&statsBlock=1&links=1&noFollowLinks=0&font=inter&fontSize=14&rowDensity=100&widgetWidth=auto&widgetHeight=auto&bodyColor=${bodyColor}&textColor=${textColor}&linkColor=${linkColor}&borderColor=${borderColor}&tabColor=${tabColor}`;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: ${isDark ? '#0f172a' : '#ffffff'};
            color: ${isDark ? '#f8fafc' : '#0f172a'};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            overflow-x: hidden;
          }
          #scoreaxis-widget-container {
            width: 100%;
            min-height: 100%;
            display: flex;
            flex-direction: column;
          }
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: ${isDark ? '#0f172a' : '#f8fafc'};
          }
          ::-webkit-scrollbar-thumb {
            background: ${isDark ? '#334155' : '#cbd5e1'};
            border-radius: 9999px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${isDark ? '#475569' : '#94a3b8'};
          }
        </style>
      </head>
      <body>
        <div id="scoreaxis-widget-container">
          <script src="${scriptSrc}" async></script>
        </div>
        <script>
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.parent.postMessage({ type: 'SCOREAXIS_WIDGET_LOADED' }, '*');
            }, 500);
          });
          window.addEventListener('error', function() {
            window.parent.postMessage({ type: 'SCOREAXIS_WIDGET_ERROR' }, '*');
          });
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SCOREAXIS_WIDGET_LOADED') {
        setIsLoading(false);
        onLoaded?.();
      } else if (e.data?.type === 'SCOREAXIS_WIDGET_ERROR') {
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [scriptSrc, reloadToken, onLoaded]);

  const handleManualReload = () => {
    setIsLoading(true);
    setHasError(false);
    setReloadToken((prev) => prev + 1);
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-xs transition-all duration-300 ${className}`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs transition-opacity duration-300">
          <div className="relative flex items-center justify-center">
            <div className="h-10 w-10 rounded-full border-4 border-slate-100"></div>
            <div className="absolute h-10 w-10 rounded-full border-4 border-rose-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-3 text-xs sm:text-sm font-bold text-slate-800">
            Syncing ScoreAxis sports feed...
          </p>
          <p className="text-2xs sm:text-xs text-slate-500 mt-1">
            Loading real-time club statistics & standings
          </p>
        </div>
      )}

      {/* Error / Offline Banner */}
      {hasError && (
        <div className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">ScoreAxis Feed Temporarily Unavailable</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Unable to establish real-time link with ScoreAxis. Please check your internet connection or try refreshing.
          </p>
          <button
            onClick={handleManualReload}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500 transition cursor-pointer shadow-xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Retry ScoreAxis
          </button>
        </div>
      )}

      {/* Widget Iframe Container */}
      <iframe
        ref={iframeRef}
        key={`${targetId}-${theme}-${reloadToken}`}
        srcDoc={htmlContent}
        title="ScoreAxis Sports Widget"
        style={{
          width: '100%',
          height: `${minHeight}px`,
          border: 'none',
          display: hasError ? 'none' : 'block',
          opacity: isLoading ? 0.2 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        onLoad={() => {
          setTimeout(() => setIsLoading(false), 800);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
