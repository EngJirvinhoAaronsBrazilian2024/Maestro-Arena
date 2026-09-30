import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Radio, 
  RotateCw, 
  Trophy, 
  Table, 
  Sparkles, 
  Flame, 
  Tv, 
  Layers, 
  Shield 
} from 'lucide-react';
import { useLiveMatches, useCompetitions } from '../services/sports/hooks';
import { MatchCard } from '../components/sports/MatchCard';
import { Competition } from '../types/sports';
import { getLeaguePriority } from '../lib/utils';
import { ScoreAxisWidget, SCOREAXIS_LEAGUES } from '../components/sports/ScoreAxisWidget';

export function Livescore() {
  // Default view is real-time live matches with live scores, minute, and goals from ScoreBat
  const [viewMode, setViewMode] = useState<
    'realtime-live' | 'realtime-highlights' | 'scoreaxis-standings' | 'scoreaxis-top-players' | 'native'
  >('realtime-live');

  const [isLoadingRealtime, setIsLoadingRealtime] = useState<boolean>(true);
  const [realtimeKey, setRealtimeKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // ScoreAxis League Selection for Standings / Scorers
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(SCOREAXIS_LEAGUES[0].id);

  // Native API state
  const { matches: liveMatches, isLoading: isLoadingMatches, isError: isNativeError } = useLiveMatches();
  const { competitions } = useCompetitions();
  const [nativeFilter, setNativeFilter] = useState<string>('All');

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

  const handleRefresh = () => {
    setIsLoadingRealtime(true);
    setRealtimeKey((prev) => prev + 1);
  };

  const getRealtimeUrl = () => {
    if (viewMode === 'realtime-highlights') {
      return 'https://www.scorebat.com/embed/';
    }
    return 'https://www.scorebat.com/embed/livescore/';
  };

  const selectedLeague = useMemo(() => {
    return SCOREAXIS_LEAGUES.find((l) => l.id === selectedLeagueId) || SCOREAXIS_LEAGUES[0];
  }, [selectedLeagueId]);

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
    return Array.from(comps.values());
  }, [liveMatches, competitions]);

  const filteredNativeMatches = useMemo(() => {
    if (!liveMatches) return [];
    if (nativeFilter === 'All') return liveMatches;
    return liveMatches.filter(m => m.competitionId === nativeFilter);
  }, [liveMatches, nativeFilter]);

  const groupedNativeMatches = useMemo(() => {
    const grouped = filteredNativeMatches.reduce((acc, match) => {
      const compId = match.competitionId || 'other';
      if (!acc[compId]) {
        const comp = competitions?.find(c => c.id === compId) || {
          id: compId,
          name: match.competitionName || 'Unknown League',
          country: match.competitionCountry || '',
          logoUrl: match.competitionLogo
        };
        acc[compId] = {
          competition: comp as Competition,
          matches: []
        };
      }
      acc[compId].matches.push(match);
      return acc;
    }, {} as Record<string, { competition: Competition, matches: typeof filteredNativeMatches }>);

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
  }, [filteredNativeMatches, competitions]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
              Maestro Arena
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-rose-50 text-rose-700 rounded-full border border-rose-200/80 shadow-2xs">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-600" />
              Live Scores & Match Center
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1.5">
            Real-time live scores, match video highlights, official league tables, and player stats.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => {
              setViewMode('realtime-live');
              setIsLoadingRealtime(true);
            }}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'realtime-live'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Live Ticker
          </button>

          <button
            onClick={() => {
              setViewMode('realtime-highlights');
              setIsLoadingRealtime(true);
            }}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'realtime-highlights'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-amber-500" />
            Video Highlights
          </button>

          <button
            onClick={() => setViewMode('scoreaxis-standings')}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'scoreaxis-standings'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Standings
          </button>

          <button
            onClick={() => setViewMode('scoreaxis-top-players')}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'scoreaxis-top-players'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            Top Scorers
          </button>

          <button
            onClick={() => setViewMode('native')}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'native'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-600" />
            In-App Cards
          </button>
        </div>
      </div>

      {/* 1. REAL-TIME SCOREBAT LIVE STREAM & HIGHLIGHTS */}
      {(viewMode === 'realtime-live' || viewMode === 'realtime-highlights') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
              <h2 className="text-base font-bold text-slate-900">
                {viewMode === 'realtime-live' ? 'Global Live Matches & Video Goals' : 'Latest Official Match Highlights & Replays'}
              </h2>
            </div>
            
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-rose-600 ${isLoadingRealtime ? 'animate-spin' : ''}`} />
              Refresh Feed
            </button>
          </div>

          {/* Embedded ScoreBat Widget Container */}
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

            <div className="w-full relative" style={{ height: '820px', minHeight: '600px' }}>
              <iframe
                ref={iframeRef}
                key={`${viewMode}-${realtimeKey}`}
                src={getRealtimeUrl()}
                title="ScoreBat Real-Time Football Widget"
                frameBorder="0"
                width="100%"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                onLoad={() => setIsLoadingRealtime(false)}
                className="w-full border-0 block"
                style={{
                  width: '100%',
                  marginTop: '-51px',
                  height: 'calc(100% + 51px)',
                  border: 'none',
                  display: 'block',
                  opacity: isLoadingRealtime ? 0 : 1,
                  transition: 'opacity 0.25s ease-in-out'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. SCOREAXIS LEAGUE STANDINGS */}
      {viewMode === 'scoreaxis-standings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-black text-slate-950">
                {selectedLeague.name} — League Table
              </h2>
              <span className="text-xs font-bold text-slate-500">
                ({selectedLeague.country})
              </span>
            </div>

            {/* League Picker Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {SCOREAXIS_LEAGUES.map((league) => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeagueId(league.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedLeagueId === league.id
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs'
                  }`}
                >
                  {league.name}
                </button>
              ))}
            </div>
          </div>

          <ScoreAxisWidget
            type="league-table"
            targetId={selectedLeagueId}
            minHeight={720}
          />
        </div>
      )}

      {/* 3. SCOREAXIS TOP SCORERS & PLAYERS */}
      {viewMode === 'scoreaxis-top-players' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-600" />
              <h2 className="text-lg font-black text-slate-950">
                {selectedLeague.name} — Top Goalscorers & Assists
              </h2>
              <span className="text-xs font-bold text-slate-500">
                ({selectedLeague.country})
              </span>
            </div>

            {/* League Picker Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {SCOREAXIS_LEAGUES.map((league) => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeagueId(league.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedLeagueId === league.id
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs'
                  }`}
                >
                  {league.name}
                </button>
              ))}
            </div>
          </div>

          <ScoreAxisWidget
            type="league-top-players"
            targetId={selectedLeagueId}
            minHeight={680}
          />
        </div>
      )}

      {/* 4. IN-APP MATCH CARDS */}
      {viewMode === 'native' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-600" />
              <h2 className="text-lg font-black text-slate-950">
                In-App Match Cards & Match Center
              </h2>
            </div>

            {availableLeagues.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Filter League:</span>
                <select
                  value={nativeFilter}
                  onChange={(e) => setNativeFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-rose-500 cursor-pointer shadow-2xs"
                >
                  <option value="All">All Leagues ({liveMatches?.length || 0})</option>
                  {availableLeagues.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isLoadingMatches ? (
            <div className="flex h-52 items-center justify-center rounded-3xl border border-slate-200/90 bg-white shadow-xs">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent" />
            </div>
          ) : isNativeError && (!liveMatches || liveMatches.length === 0) ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center text-rose-800 font-medium">
              Native match feed is currently refreshing. Please switch to the Real-Time Ticker above.
            </div>
          ) : groupedNativeMatches.length > 0 ? (
            <div className="space-y-8">
              {groupedNativeMatches.map((group) => (
                <div key={group.competition.id} className="space-y-3.5">
                  <div className="flex items-center gap-3 border-l-4 border-rose-600 pl-3 py-1">
                    {group.competition.logoUrl ? (
                      <img src={group.competition.logoUrl} alt={group.competition.name} className="h-6 w-6 object-contain" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    )}
                    <h3 className="text-base font-bold text-slate-900">
                      {group.competition.name} <span className="text-xs font-semibold text-slate-500">({group.competition.country})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.matches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center rounded-3xl border border-slate-200/90 bg-white text-slate-500 shadow-xs">
              <p className="font-bold text-slate-800">No active matches found in the current filter.</p>
              <button
                onClick={() => setNativeFilter('All')}
                className="mt-2 text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Reset League Filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Livescore;
