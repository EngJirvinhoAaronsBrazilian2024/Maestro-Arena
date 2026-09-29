import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Tv, 
  RotateCw, 
  Layers, 
  Radio
} from 'lucide-react';
import { useLiveMatches, useCompetitions } from '../services/sports/hooks';
import { MatchCard } from '../components/sports/MatchCard';
import { Competition } from '../types/sports';
import { getLeaguePriority } from '../lib/utils';

export function Livescore() {
  const [viewMode, setViewMode] = useState<'scorebat-live' | 'scorebat-highlights' | 'native'>('scorebat-live');
  const [isLoadingIframe, setIsLoadingIframe] = useState<boolean>(true);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Native API state fallback / alternative
  const { matches: liveMatches, isLoading: isLoadingMatches, isError: isNativeError } = useLiveMatches();
  const { competitions } = useCompetitions();
  const [filter, setFilter] = useState<string>('All');

  // Load ScoreBat embed auto-resize script dynamically
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

  const handleRefresh = () => {
    setIsLoadingIframe(true);
    setIframeKey((prev) => prev + 1);
  };

  const getScorebatUrl = () => {
    if (viewMode === 'scorebat-highlights') {
      return 'https://www.scorebat.com/embed/';
    }
    return 'https://www.scorebat.com/embed/livescore/';
  };

  const availableLeagues = useMemo(() => {
    if (!liveMatches) return [];
    const comps = new Map<string, Competition>();
    liveMatches.forEach(m => {
      if (!comps.has(m.competitionId)) {
        const comp = competitions?.find(c => c.id === m.competitionId) || {
          id: m.competitionId,
          name: m.competitionName || 'Unknown Competition',
          country: m.competitionCountry || 'Unknown',
          logoUrl: m.competitionLogo
        };
        comps.set(m.competitionId, comp as Competition);
      }
    });

    const compsArray = Array.from(comps.values());
    compsArray.sort((a, b) => {
      const priorityA = getLeaguePriority(a);
      const priorityB = getLeaguePriority(b);
      if (priorityA !== priorityB) return priorityA - priorityB;
      const countryCompare = (a.country || '').localeCompare(b.country || '');
      if (countryCompare !== 0) return countryCompare;
      return (a.name || '').localeCompare(b.name || '');
    });
    return compsArray;
  }, [liveMatches, competitions]);

  const groupedAndSortedMatches = useMemo(() => {
    if (!liveMatches) return [];
    let filteredMatches = liveMatches;
    if (filter !== 'All') {
      filteredMatches = liveMatches.filter(m => m.competitionId === filter);
    }
    const grouped = filteredMatches.reduce((acc, match) => {
      const compId = match.competitionId;
      if (!acc[compId]) {
        const comp = competitions?.find(c => c.id === compId) || {
          id: compId,
          name: match.competitionName || 'Unknown Competition',
          country: match.competitionCountry || 'Unknown',
          logoUrl: match.competitionLogo
        };
        acc[compId] = {
          competition: comp as Competition,
          matches: []
        };
      }
      acc[compId].matches.push(match);
      return acc;
    }, {} as Record<string, { competition: Competition, matches: typeof liveMatches }>);

    const groupsArray = Object.values(grouped);
    groupsArray.sort((a, b) => {
      const priorityA = getLeaguePriority(a.competition);
      const priorityB = getLeaguePriority(b.competition);
      if (priorityA !== priorityB) return priorityA - priorityB;
      const countryCompare = (a.competition.country || '').localeCompare(b.competition.country || '');
      if (countryCompare !== 0) return countryCompare;
      return (a.competition.name || '').localeCompare(b.competition.name || '');
    });
    return groupsArray;
  }, [liveMatches, competitions, filter]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
              Livescore Center
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 rounded-md border border-cyan-200 dark:border-cyan-800/60">
              <Radio className="w-3 h-3 animate-pulse" /> Real-time
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            Real-time live scores, team crests, match minute, and official video goal highlights.
          </p>
        </div>

        {/* View Switcher & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Main Mode Pills */}
          <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
            <button
              onClick={() => {
                setViewMode('scorebat-live');
                setIsLoadingIframe(true);
              }}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'scorebat-live'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Live Matches
            </button>
            <button
              onClick={() => {
                setViewMode('scorebat-highlights');
                setIsLoadingIframe(true);
              }}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'scorebat-highlights'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Video Highlights
            </button>
          </div>

          {/* Refresh Action for real-time iframe */}
          {viewMode !== 'native' && (
            <button
              onClick={handleRefresh}
              title="Reload Matches"
              aria-label="Reload Matches"
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isLoadingIframe ? 'animate-spin text-cyan-600' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode !== 'native' ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300">
          {/* Loading Indicator Overlay */}
          {isLoadingIframe && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs min-h-[500px]">
              <div className="relative flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
                <div className="absolute h-12 w-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                Loading live matches & team badges...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Updating real-time match events
              </p>
            </div>
          )}

          {/* 
            Real-time In-App Feed Container:
            - Crops the 50px top header sticker with -mt-[51px].
            - Keeps live scores and badge view strictly inside the applet.
            - Full media permissions for inline video replay playback.
          */}
          <div className="w-full relative bg-white dark:bg-slate-900 overflow-hidden" style={{ height: '820px' }}>
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={getScorebatUrl()}
              title="Football Livescore and Highlights"
              frameBorder="0"
              width="100%"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              onLoad={() => setIsLoadingIframe(false)}
              className="_scorebatEmbedded_ w-full border-0 block"
              style={{
                width: '100%',
                marginTop: '-51px',
                height: 'calc(100% + 51px)',
                border: 'none',
                display: 'block',
                opacity: isLoadingIframe ? 0 : 1,
                transition: 'opacity 0.25s ease-in-out',
              }}
            />
          </div>
        </div>
      ) : (
        /* Native Match Cards View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Custom Cards View</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Match cards rendered with custom team badge components.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFilter('All')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filter === 'All'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All
              </button>
              <select
                value={filter !== 'All' ? filter : ''}
                onChange={(e) => setFilter(e.target.value || 'All')}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="">Filter League...</option>
                {availableLeagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.country} - {league.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoadingMatches ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            </div>
          ) : isNativeError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-center text-rose-700 font-medium">
              Native API live matches currently unavailable. Switch back to Live Matches for real-time scores.
            </div>
          ) : groupedAndSortedMatches.length > 0 ? (
            <div className="space-y-8">
              {groupedAndSortedMatches.map((group) => (
                <div key={group.competition.id} className="space-y-3">
                  <div className="flex items-center gap-3 border-l-4 border-rose-600 pl-3 py-1">
                    {group.competition?.logoUrl ? (
                      <img
                        src={group.competition.logoUrl}
                        alt={group.competition?.name || 'Competition'}
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-200 text-xs font-bold text-slate-700">
                        {(group.competition?.name || 'C').charAt(0)}
                      </div>
                    )}
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {group.competition?.name || 'Competition'}{' '}
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        ({group.competition?.country || ''})
                      </span>
                    </h2>
                  </div>
                  <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
                    {group.matches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/60 dark:bg-slate-900 text-slate-500">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                No live matches currently in progress for the selected filter.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Livescore;
