import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  RotateCw, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Trophy, 
  Shield, 
  ChevronRight,
  Filter,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFootballMatches, MatchFilterTab } from '../../hooks/useFootballMatches';
import { NormalizedMatch } from '../../server/services/footballDataService';

// Fallback component for team crest
function TeamCrest({ crest, name, tla }: { crest: string | null; name: string; tla: string }) {
  const [imageError, setImageError] = useState(false);

  if (!crest || imageError) {
    const initials = tla || name.substring(0, 3).toUpperCase();
    return (
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/80 flex items-center justify-center text-slate-700 font-black text-xs shadow-2xs shrink-0">
        {initials}
      </div>
    );
  }

  return (
    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white border border-slate-200/70 p-1 flex items-center justify-center shadow-2xs shrink-0 transition-transform group-hover:scale-105">
      <img
        src={crest}
        alt={name}
        loading="lazy"
        onError={() => setImageError(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

// Format UTC kick-off date to user friendly local time
function formatKickoff(utcDateString: string): { time: string; date: string; isToday: boolean } {
  try {
    const d = new Date(utcDateString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = isToday ? 'Today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    return { time, date, isToday };
  } catch {
    return { time: '--:--', date: '', isToday: false };
  }
}

export function LiveScoresSection() {
  const {
    matches,
    liveCount,
    upcomingCount,
    finishedCount,
    totalCount,
    lastUpdated,
    isLoading,
    isRefreshing,
    isStale,
    error,
    refresh,
  } = useFootballMatches();

  const [activeTab, setActiveTab] = useState<MatchFilterTab>('all');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('ALL');

  // Extract unique competitions from the match list
  const competitions = useMemo(() => {
    const map = new Map<string, { code: string; name: string; emblem: string | null; count: number }>();
    matches.forEach((m) => {
      const code = m.competition.code || String(m.competition.id);
      if (!map.has(code)) {
        map.set(code, {
          code,
          name: m.competition.name,
          emblem: m.competition.emblem,
          count: 1,
        });
      } else {
        const item = map.get(code)!;
        item.count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [matches]);

  // Filter matches based on active tab and selected competition
  const filteredMatches = useMemo(() => {
    let list = matches;

    // Filter by tab
    if (activeTab === 'live') {
      list = list.filter((m) => m.isLive);
    } else if (activeTab === 'upcoming') {
      list = list.filter((m) => m.status === 'UPCOMING');
    } else if (activeTab === 'finished') {
      list = list.filter((m) => m.status === 'FINISHED');
    }

    // Filter by competition
    if (selectedCompetition !== 'ALL') {
      list = list.filter((m) => (m.competition.code || String(m.competition.id)) === selectedCompetition);
    }

    return list;
  }, [matches, activeTab, selectedCompetition]);

  const lastUpdatedTime = useMemo(() => {
    if (!lastUpdated) return null;
    try {
      return new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return null;
    }
  }, [lastUpdated]);

  return (
    <section className="w-full space-y-4 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[24px] border border-slate-200/90 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Section Title & Live Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                {liveCount > 0 ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                )}
              </span>

              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                Live Scores & Fixtures
                {liveCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider animate-pulse">
                    {liveCount} Live
                  </span>
                )}
              </h2>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Real-time football scores across top European & world leagues powered by football-data.org
            </p>
          </div>

          {/* Action Bar: Timestamp & Refresh Button */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {lastUpdatedTime && (
              <span className="text-[11px] font-semibold text-slate-500 hidden md:inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                <Clock className="w-3 h-3 text-slate-400" />
                Updated {lastUpdatedTime}
              </span>
            )}

            <button
              onClick={refresh}
              disabled={isRefreshing}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs border cursor-pointer",
                isRefreshing
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-200 active:scale-95"
              )}
              title="Refresh live match scores"
            >
              <RotateCw className={cn("w-3.5 h-3.5 text-rose-600", isRefreshing && "animate-spin")} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Stale Cache Notice Banner */}
        {isStale && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Showing cached match data. Live update retrying automatically...</span>
            </div>
            <button 
              onClick={refresh} 
              className="font-bold underline text-amber-900 hover:text-amber-950 cursor-pointer text-xs shrink-0"
            >
              Retry now
            </button>
          </div>
        )}

        {/* Filters and Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Main Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                activeTab === 'all'
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              All Matches ({totalCount})
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                activeTab === 'live'
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {liveCount > 0 && (
                <span className={cn("w-2 h-2 rounded-full", activeTab === 'live' ? "bg-white animate-ping" : "bg-rose-500")} />
              )}
              Live ({liveCount})
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                activeTab === 'upcoming'
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Upcoming ({upcomingCount})
            </button>

            <button
              onClick={() => setActiveTab('finished')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                activeTab === 'finished'
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Finished ({finishedCount})
            </button>
          </div>

          {/* Competition Filter Pills */}
          {competitions.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <button
                onClick={() => setSelectedCompetition('ALL')}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer",
                  selectedCompetition === 'ALL'
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                )}
              >
                All Leagues
              </button>

              {competitions.slice(0, 6).map((comp) => (
                <button
                  key={comp.code}
                  onClick={() => setSelectedCompetition(comp.code)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer",
                    selectedCompetition === comp.code
                      ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {comp.emblem && (
                    <img 
                      src={comp.emblem} 
                      alt="" 
                      className="w-3.5 h-3.5 object-contain" 
                      onError={(e) => (e.currentTarget.style.display = 'none')} 
                    />
                  )}
                  <span>{comp.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/80 rounded-[24px] border border-slate-200/80 p-5 space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded-full w-14"></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-2xl"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 w-8 bg-slate-200 rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-2xl"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 w-8 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && matches.length === 0 && (
        <div className="rounded-[24px] border-2 border-dashed border-rose-200 bg-rose-50/40 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Failed to load match scores</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {error.message || 'Could not connect to the live match provider. Please check your network connection or API quota.'}
          </p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredMatches.length === 0 && (
        <div className="rounded-[24px] border border-slate-200 bg-white/80 backdrop-blur-md p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No matches found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'live' 
              ? 'There are currently no live matches in progress for this category.' 
              : 'No matches are currently scheduled for this selection today.'}
          </p>
          {(activeTab !== 'all' || selectedCompetition !== 'ALL') && (
            <button
              onClick={() => {
                setActiveTab('all');
                setSelectedCompetition('ALL');
              }}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Reset filters to view all matches
            </button>
          )}
        </div>
      )}

      {/* Matches Grid */}
      {!isLoading && filteredMatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMatches.map((match) => {
            const kickoff = formatKickoff(match.utcDate);

            return (
              <div
                key={match.id}
                className={cn(
                  "group relative rounded-[24px] border bg-white/90 backdrop-blur-md p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] transition-all hover:shadow-[0_8px_30px_rgba(15,23,42,0.07)] flex flex-col justify-between overflow-hidden",
                  match.isLive
                    ? "border-rose-300 ring-1 ring-rose-500/20 bg-gradient-to-b from-rose-50/20 via-white to-white"
                    : "border-slate-200/80 hover:border-slate-300"
                )}
              >
                {/* Card Top: Competition & Match Status */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                  {/* Competition Info */}
                  <div className="flex items-center gap-2 truncate">
                    {match.competition.emblem ? (
                      <img
                        src={match.competition.emblem}
                        alt=""
                        className="w-4 h-4 object-contain shrink-0"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="text-[11px] font-bold text-slate-700 truncate tracking-tight">
                      {match.competition.name}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {match.isLive ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                        </span>
                        <span>{match.minute || match.statusLabel}</span>
                      </div>
                    ) : match.status === 'FINISHED' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                        Full Time
                      </span>
                    ) : match.status === 'POSTPONED' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase">
                        Postponed
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        <span>{kickoff.time}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Teams & Scores Section */}
                <div className="space-y-3.5 my-1">
                  
                  {/* Home Team Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <TeamCrest
                        crest={match.homeTeam.crest}
                        name={match.homeTeam.name}
                        tla={match.homeTeam.tla}
                      />
                      <div className="truncate">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors block truncate leading-tight">
                          {match.homeTeam.name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Home</span>
                      </div>
                    </div>

                    <div className="shrink-0 font-black text-xl min-w-[28px] text-right">
                      {match.score.home !== null ? (
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg",
                          match.isLive ? "bg-rose-50 text-rose-700" : "text-slate-950"
                        )}>
                          {match.score.home}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold">-</span>
                      )}
                    </div>
                  </div>

                  {/* Away Team Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <TeamCrest
                        crest={match.awayTeam.crest}
                        name={match.awayTeam.name}
                        tla={match.awayTeam.tla}
                      />
                      <div className="truncate">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors block truncate leading-tight">
                          {match.awayTeam.name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Away</span>
                      </div>
                    </div>

                    <div className="shrink-0 font-black text-xl min-w-[28px] text-right">
                      {match.score.away !== null ? (
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg",
                          match.isLive ? "bg-rose-50 text-rose-700" : "text-slate-950"
                        )}>
                          {match.score.away}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold">-</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <div className="flex items-center gap-1">
                    {match.status === 'UPCOMING' ? (
                      <span className="text-slate-500 flex items-center gap-1 font-semibold">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {kickoff.date} · {kickoff.time}
                      </span>
                    ) : match.score.halfTimeHome !== null && match.score.halfTimeAway !== null ? (
                      <span className="text-slate-500 font-medium">
                        HT: {match.score.halfTimeHome} - {match.score.halfTimeAway}
                      </span>
                    ) : (
                      <span className="text-slate-400">Regular time</span>
                    )}
                  </div>

                  <Link
                    to="/livescore"
                    className="inline-flex items-center gap-0.5 font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
                  >
                    Match Centre
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Footer Navigation Link to Full Livescore Page */}
      <div className="text-center pt-2">
        <Link
          to="/livescore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
        >
          <Activity className="w-3.5 h-3.5 text-rose-600" />
          <span>View Detailed Livescore Center & Highlights</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>
    </section>
  );
}
