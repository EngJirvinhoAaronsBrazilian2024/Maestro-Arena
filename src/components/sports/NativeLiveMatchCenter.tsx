import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCw, 
  Search, 
  Radio, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Flame,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LiveMatch {
  id: number | string;
  leagueId: number | string;
  leagueName: string;
  time: string;
  timeTS: number;
  isLive: boolean;
  minute: string;
  status: string;
  statusDetail?: string;
  home: {
    id: number | string;
    name: string;
    score: number;
    logo?: string;
  };
  away: {
    id: number | string;
    name: string;
    score: number;
    logo?: string;
  };
}

export interface LiveLeague {
  id: number | string;
  name: string;
  ccode?: string;
  logo?: string;
  matches: LiveMatch[];
}

export interface NativeLiveMatchCenterProps {
  className?: string;
}

export function NativeLiveMatchCenter({ className = '' }: NativeLiveMatchCenterProps) {
  const [leagues, setLeagues] = useState<LiveLeague[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});

  const fetchMatches = async (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/fotmob/matches?liveOnly=false');
      if (!res.ok) throw new Error('Failed to fetch live matches');
      const data = await res.json();
      setLeagues(data.leagues || []);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Error fetching live matches:', err);
      if (leagues.length === 0) {
        setError('Unable to load match feed. Retrying...');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches(true);
    // Real-time auto-refresh every 25 seconds for live clocks and goal updates
    const interval = setInterval(() => {
      fetchMatches(false);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const toggleLeague = (leagueId: string | number) => {
    setCollapsedLeagues(prev => ({
      ...prev,
      [String(leagueId)]: !prev[String(leagueId)]
    }));
  };

  // Filtered and searched matches
  const { filteredLeagues, totalMatchCount, liveMatchCount } = useMemo(() => {
    let total = 0;
    let liveCount = 0;

    const q = searchQuery.toLowerCase().trim();

    const filtered = leagues.map(league => {
      const matches = (league.matches || []).filter(m => {
        total++;
        if (m.isLive) liveCount++;

        // Status filter
        if (filter === 'live' && !m.isLive) return false;
        if (filter === 'upcoming' && (m.isLive || m.status === 'FT')) return false;
        if (filter === 'finished' && m.status !== 'FT') return false;

        // Search query filter
        if (q) {
          const matchHome = m.home?.name?.toLowerCase().includes(q);
          const matchAway = m.away?.name?.toLowerCase().includes(q);
          const matchLeague = league.name?.toLowerCase().includes(q);
          return matchHome || matchAway || matchLeague;
        }

        return true;
      });

      return {
        ...league,
        matches
      };
    }).filter(l => l.matches.length > 0);

    return {
      filteredLeagues: filtered,
      totalMatchCount: total,
      liveMatchCount: liveCount
    };
  }, [leagues, filter, searchQuery]);

  return (
    <div className={cn("w-full h-full flex flex-col bg-white overflow-hidden select-none", className)}>
      {/* 1. Header Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/70 shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Title & Live Status Indicator */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                  Global Matchday Live Centre
                </h3>
                {liveMatchCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
                    {liveMatchCount} LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Live official scores, real-time minutes, & verified fixtures across all competitions
              </p>
            </div>
          </div>

          {/* Refresh Action */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              Refreshed {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              type="button"
              onClick={() => fetchMatches(false)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Refresh live match data"
            >
              <RotateCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-emerald-600")} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 2. Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap",
                filter === 'all'
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
              )}
            >
              All Matches ({totalMatchCount})
            </button>

            <button
              type="button"
              onClick={() => setFilter('live')}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 whitespace-nowrap",
                filter === 'live'
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs shadow-rose-600/20"
                  : "bg-white text-rose-700 hover:bg-rose-50 border-rose-200/90"
              )}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Live Now ({liveMatchCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('upcoming')}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap",
                filter === 'upcoming'
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
              )}
            >
              Upcoming
            </button>

            <button
              type="button"
              onClick={() => setFilter('finished')}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap",
                filter === 'finished'
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
              )}
            >
              Finished
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[180px] sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team or league..."
              className="w-full pl-8 pr-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 3. Match List Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4">
        {loading && leagues.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
            <p className="text-xs font-bold text-slate-700">Connecting to Live Matchday Feed...</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Loading current fixtures, live match clocks, and verified real-time scores.
            </p>
          </div>
        ) : error && leagues.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Match Feed Error</p>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => fetchMatches(true)}
              className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : filteredLeagues.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No Matches Found</p>
            <p className="text-xs text-slate-400">
              {searchQuery ? `No matches matching "${searchQuery}"` : 'No matches available for the selected filter.'}
            </p>
          </div>
        ) : (
          filteredLeagues.map(league => {
            const isCollapsed = collapsedLeagues[String(league.id)];
            return (
              <div 
                key={league.id} 
                className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all"
              >
                {/* League Header */}
                <div 
                  onClick={() => toggleLeague(league.id)}
                  className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {league.name}
                    </h4>
                    {league.ccode && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        ({league.ccode})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {league.matches.length}
                    </span>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* League Matches */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {league.matches.map(match => (
                      <div 
                        key={match.id}
                        className={cn(
                          "p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors",
                          match.isLive && "bg-rose-50/20"
                        )}
                      >
                        {/* Teams and Logos */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {/* Home Team */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={match.home.logo || `https://images.fotmob.com/image_resources/logo/teamlogo/${match.home.id}.png`}
                                alt={match.home.name}
                                className="w-5 h-5 rounded-full object-contain shrink-0 bg-slate-50 p-0.5 border border-slate-100"
                                onError={(e) => {
                                  // Fallback placeholder if crest fails
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {match.home.name}
                              </span>
                            </div>

                            <span className={cn(
                              "text-xs font-extrabold px-1.5 py-0.5 rounded-md min-w-[20px] text-center",
                              match.isLive ? "text-rose-600 bg-rose-50 font-black" : "text-slate-900"
                            )}>
                              {match.home.score ?? 0}
                            </span>
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={match.away.logo || `https://images.fotmob.com/image_resources/logo/teamlogo/${match.away.id}.png`}
                                alt={match.away.name}
                                className="w-5 h-5 rounded-full object-contain shrink-0 bg-slate-50 p-0.5 border border-slate-100"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {match.away.name}
                              </span>
                            </div>

                            <span className={cn(
                              "text-xs font-extrabold px-1.5 py-0.5 rounded-md min-w-[20px] text-center",
                              match.isLive ? "text-rose-600 bg-rose-50 font-black" : "text-slate-900"
                            )}>
                              {match.away.score ?? 0}
                            </span>
                          </div>
                        </div>

                        {/* Match Status / Minute Column */}
                        <div className="w-20 sm:w-24 shrink-0 flex flex-col items-end justify-center text-right border-l border-slate-100 pl-3">
                          {match.isLive ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-lg animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
                                {match.minute || 'LIVE'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">
                                In Progress
                              </span>
                            </div>
                          ) : match.status === 'FT' ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                                FT
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Finished
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{match.time?.split(' ')[1] || match.time || 'Upcoming'}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {match.time?.split(' ')[0] || 'Scheduled'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NativeLiveMatchCenter;
