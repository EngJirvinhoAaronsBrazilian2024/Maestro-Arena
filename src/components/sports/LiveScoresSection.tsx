import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  RotateCw,
  Clock,
  Calendar,
  AlertCircle,
  Trophy,
  ChevronRight,
  Bell,
  BellRing,
  Star,
  Flame,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFootballMatches, MatchFilterTab } from '../../hooks/useFootballMatches';
import { useNotifications } from '../../context/NotificationContext';
import { useFavorites, isFavoriteTeamOrCompMatch } from '../../hooks/useFavorites';
import {
  rankFixtures,
  RankedFixture,
  getLocalDateKey,
} from '../../lib/fixtureRanking';

// Fallback component for team crest
function TeamCrest({ crest, name, tla }: { crest: string | null; name: string; tla: string }) {
  const [imageError, setImageError] = useState(false);

  if (!crest || imageError) {
    const initials = tla || name.substring(0, 3).toUpperCase();
    return (
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/80 flex items-center justify-center text-slate-700 font-black text-sm shadow-xs shrink-0">
        {initials}
      </div>
    );
  }

  return (
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200/80 p-1.5 flex items-center justify-center shadow-xs shrink-0 transition-transform group-hover:scale-105">
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

function BreakdownBar({
  label,
  weightPercent,
  value,
}: {
  label: string;
  weightPercent: number;
  value: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-semibold text-slate-600">
          {label} <span className="text-slate-400">({weightPercent}%)</span>
        </span>
        <span className="font-bold text-slate-800 tabular-nums">{Math.round(value)}/100</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            value >= 80
              ? 'bg-rose-600'
              : value >= 60
              ? 'bg-amber-500'
              : 'bg-slate-400'
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
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

  const [activeTab, setActiveTab] = useState<MatchFilterTab | 'pinned'>('all');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('ALL');
  const [expandedRankId, setExpandedRankId] = useState<number | null>(null);

  const { isFollowing, toggleFollowMatch } = useNotifications();
  const { favorites } = useFavorites();

  // Score every fixture using the 5-factor Match Importance Engine (0-100),
  // prioritizing live matches first, then upcoming matches by importance, then recent finished matches.
  const rankedMatches = useMemo<RankedFixture[]>(() => {
    const scored = rankFixtures(matches);
    const statusPriority = (rf: RankedFixture) => {
      if (rf.match.isLive) return 0;
      if (rf.match.status === 'UPCOMING') return 1;
      return 2;
    };

    return [...scored].sort((a, b) => {
      const pDiff = statusPriority(a) - statusPriority(b);
      if (pDiff !== 0) return pDiff;
      if (b.importanceScore !== a.importanceScore) {
        return b.importanceScore - a.importanceScore;
      }
      const aTime = new Date(a.match.utcDate).getTime();
      const bTime = new Date(b.match.utcDate).getTime();
      if (statusPriority(a) === 2) {
        return bTime - aTime;
      }
      return aTime - bTime;
    });
  }, [matches]);

  // 1. Scope fixtures to the active status tab before deriving competition tabs
  const tabMatches = useMemo(() => {
    if (activeTab === 'live') {
      return rankedMatches.filter((rf) => rf.match.isLive);
    }
    if (activeTab === 'upcoming') {
      return rankedMatches.filter((rf) => rf.match.status === 'UPCOMING');
    }
    if (activeTab === 'finished') {
      return rankedMatches.filter((rf) => rf.match.status === 'FINISHED');
    }
    if (activeTab === 'pinned') {
      return rankedMatches.filter((rf) =>
        Boolean(
          isFavoriteTeamOrCompMatch(favorites, {
            homeName: rf.match.homeTeam.name,
            awayName: rf.match.awayTeam.name,
            competitionName: rf.match.competition.name,
            homeId: rf.match.homeTeam.id,
            awayId: rf.match.awayTeam.id,
            competitionId: rf.match.competition.id,
          })
        )
      );
    }
    return rankedMatches;
  }, [rankedMatches, activeTab, favorites]);

  // 2. Dynamically interchange competition tabs based on games happening live/today and tournament rank
  const competitions = useMemo(() => {
    const todayKey = getLocalDateKey(new Date());
    const map = new Map<
      string,
      {
        code: string;
        name: string;
        emblem: string | null;
        count: number;
        liveCount: number;
        todayCount: number;
        topPrestige: number;
        topScore: number;
      }
    >();

    tabMatches.forEach((rf) => {
      const m = rf.match;
      const code = m.competition.code || String(m.competition.id);
      const isTodayMatch = m.isLive || getLocalDateKey(m.utcDate) === todayKey;
      const existing = map.get(code);

      if (!existing) {
        map.set(code, {
          code,
          name: m.competition.name,
          emblem: m.competition.emblem,
          count: 1,
          liveCount: m.isLive ? 1 : 0,
          todayCount: isTodayMatch ? 1 : 0,
          topPrestige: rf.breakdown.competitionPrestige,
          topScore: rf.importanceScore,
        });
      } else {
        existing.count += 1;
        if (m.isLive) existing.liveCount += 1;
        if (isTodayMatch) existing.todayCount += 1;
        if (rf.breakdown.competitionPrestige > existing.topPrestige) {
          existing.topPrestige = rf.breakdown.competitionPrestige;
        }
        if (rf.importanceScore > existing.topScore) {
          existing.topScore = rf.importanceScore;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      // Priority 1: Competitions with LIVE games right now
      const aLive = a.liveCount > 0 ? 1 : 0;
      const bLive = b.liveCount > 0 ? 1 : 0;
      if (bLive !== aLive) return bLive - aLive;

      // Priority 2: Competitions with games happening TODAY
      const aToday = a.todayCount > 0 ? 1 : 0;
      const bToday = b.todayCount > 0 ? 1 : 0;
      if (bToday !== aToday) return bToday - aToday;

      // Priority 3: Highest tournament prestige & top match importance score
      if (b.topPrestige !== a.topPrestige) return b.topPrestige - a.topPrestige;
      if (b.topScore !== a.topScore) return b.topScore - a.topScore;

      // Priority 4: Active today/total fixture volume
      if (b.todayCount !== a.todayCount) return b.todayCount - a.todayCount;
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }, [tabMatches]);

  // Reset selectedCompetition to ALL if the selected competition has no matches in the active tab
  useEffect(() => {
    if (
      selectedCompetition !== 'ALL' &&
      !competitions.some((c) => c.code === selectedCompetition)
    ) {
      setSelectedCompetition('ALL');
    }
  }, [competitions, selectedCompetition]);

  // 3. Apply competition filter
  const filteredMatches = useMemo(() => {
    if (selectedCompetition === 'ALL') {
      return tabMatches;
    }
    return tabMatches.filter(
      (rf) => (rf.match.competition.code || String(rf.match.competition.id)) === selectedCompetition
    );
  }, [tabMatches, selectedCompetition]);

  const lastUpdatedTime = useMemo(() => {
    if (!lastUpdated) return null;
    try {
      return new Date(lastUpdated).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
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
            <div className="flex items-center gap-2.5 flex-wrap">
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
                Live Scores &amp; Fixtures
                {liveCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider animate-pulse">
                    {liveCount} Live
                  </span>
                )}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Live &amp; current fixtures intelligently ordered by match importance score
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
                'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs border cursor-pointer',
                isRefreshing
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-200 active:scale-95'
              )}
              title="Refresh live match scores"
            >
              <RotateCw className={cn('w-3.5 h-3.5 text-rose-600', isRefreshing && 'animate-spin')} />
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
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              All Matches ({totalCount})
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer',
                activeTab === 'live'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {liveCount > 0 && (
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    activeTab === 'live' ? 'bg-white animate-ping' : 'bg-rose-500'
                  )}
                />
              )}
              Live ({liveCount})
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                activeTab === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Upcoming ({upcomingCount})
            </button>

            <button
              onClick={() => setActiveTab('finished')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                activeTab === 'finished'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Finished ({finishedCount})
            </button>

            {favorites.length > 0 && (
              <button
                onClick={() => setActiveTab('pinned')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-1 cursor-pointer',
                  activeTab === 'pinned'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-amber-700 hover:text-amber-900'
                )}
              >
                <Star
                  className={cn(
                    'w-3 h-3',
                    activeTab === 'pinned' ? 'fill-white' : 'fill-amber-400 text-amber-500'
                  )}
                />
                My Pinned
              </button>
            )}
          </div>

          {/* Competition Filter Pills */}
          {competitions.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <button
                onClick={() => setSelectedCompetition('ALL')}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer',
                  selectedCompetition === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                All Leagues
              </button>

              {competitions.map((comp) => (
                <button
                  key={comp.code}
                  onClick={() => setSelectedCompetition(comp.code)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer',
                    selectedCompetition === comp.code
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {comp.liveCount > 0 && (
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        selectedCompetition === comp.code ? 'bg-white animate-pulse' : 'bg-emerald-500'
                      )}
                    />
                  )}
                  {comp.emblem && (
                    <img
                      src={comp.emblem}
                      alt=""
                      className="w-3.5 h-3.5 object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                  <span>{comp.name}</span>
                  <span
                    className={cn(
                      'text-[10px] font-black px-1.5 py-0.2 rounded-full',
                      selectedCompetition === comp.code
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {comp.count}
                  </span>
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
            <div
              key={i}
              className="bg-white/80 rounded-[24px] border border-slate-200/80 p-5 space-y-4 animate-pulse"
            >
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
            {error.message ||
              'Could not connect to the live match provider. Please check your network connection or API quota.'}
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
          {filteredMatches.map((rf, index) => {
            const { match, importanceScore, breakdown, tier, highlightLabel } = rf;
            const kickoff = formatKickoff(match.utcDate);
            const isBreakdownOpen = expandedRankId === match.id;

            return (
              <div
                key={match.id}
                className={cn(
                  'group relative rounded-[24px] border backdrop-blur-md bg-white/85 border-slate-200/90 p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden',
                  match.isLive
                    ? 'border-emerald-300 ring-1 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/25 via-white/90 to-white'
                    : tier === 'marquee'
                    ? 'border-rose-200/80 hover:border-rose-300'
                    : 'hover:border-slate-300'
                )}
              >
                {/* Card Top: Competition, Highlight Label & Match Status */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100/80">
                  <div className="flex items-center gap-2 min-w-0">
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

                  {/* Dynamic Live Match Clock Badge */}
                  <div className="shrink-0">
                    {match.isLive ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/95 border border-emerald-300/80 text-emerald-800 text-[10px] font-black uppercase tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.3)] backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
                        <span className="font-mono">
                          {match.minute && match.minute !== 'LIVE' ? `${match.minute} • ` : ''}LIVE
                        </span>
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

                {/* Ranking Transparency Strip */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-extrabold text-slate-400 tabular-nums">
                      #{index + 1}
                    </span>
                    {highlightLabel ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200/80 text-rose-700 text-[10px] font-extrabold truncate">
                        <Flame className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                        {highlightLabel}
                      </span>
                    ) : tier === 'featured' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-700 text-[10px] font-bold">
                        Featured Fixture
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">
                        Ranked Fixture
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRankId((prev) => (prev === match.id ? null : match.id))
                    }
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold tabular-nums transition-colors cursor-pointer shrink-0',
                      isBreakdownOpen
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    )}
                    title="Inspect match importance breakdown"
                  >
                    <BarChart3 className="w-2.5 h-2.5 text-rose-500" />
                    <span>Score {importanceScore.toFixed(1)}</span>
                    {isBreakdownOpen ? (
                      <ChevronUp className="w-2.5 h-2.5" />
                    ) : (
                      <ChevronDown className="w-2.5 h-2.5" />
                    )}
                  </button>
                </div>

                {/* Expandable Ranking Transparency Breakdown */}
                {isBreakdownOpen && (
                  <div className="mb-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/70 pb-1.5">
                      <span>Ranking Transparency</span>
                      <span className="text-rose-600 tabular-nums">
                        Total {importanceScore.toFixed(1)} / 100
                      </span>
                    </div>
                    <BreakdownBar
                      label="Competition Prestige"
                      weightPercent={30}
                      value={breakdown.competitionPrestige}
                    />
                    <BreakdownBar
                      label="Team Strength & Rep"
                      weightPercent={25}
                      value={breakdown.teamStrength}
                    />
                    <BreakdownBar
                      label="Match Significance"
                      weightPercent={20}
                      value={breakdown.matchSignificance}
                    />
                    <BreakdownBar
                      label="Recent Team Form"
                      weightPercent={15}
                      value={breakdown.recentForm}
                    />
                    <BreakdownBar
                      label="Stage & Title Stakes"
                      weightPercent={10}
                      value={breakdown.competitionStage}
                    />
                  </div>
                )}

                {/* Teams & Scores Section: Horizontal Layout with Names Above Badges */}
                <Link
                  to={`/matches/${match.id}`}
                  className="py-2 px-0.5 my-1 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-xl"
                >
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
                    {/* Home Team (Left): Name Above Badge */}
                    <div className="flex flex-col items-center min-w-0 text-center flex-1 px-1">
                      <span
                        className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors block truncate w-full leading-tight mb-2"
                        title={match.homeTeam.name}
                      >
                        {match.homeTeam.name}
                      </span>
                      <TeamCrest
                        crest={match.homeTeam.crest}
                        name={match.homeTeam.name}
                        tla={match.homeTeam.tla}
                      />
                      <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1.5">
                        Home
                      </span>
                    </div>

                    {/* Glassmorphic Score Ribbon (Center) */}
                    <div className="flex flex-col items-center justify-center px-1 sm:px-2 shrink-0">
                      <div
                        className={cn(
                          'flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border font-black text-lg sm:text-xl min-w-[70px] sm:min-w-[84px] transition-all backdrop-blur-md',
                          match.isLive
                            ? 'bg-emerald-50/90 border-emerald-300/80 text-emerald-800 shadow-[0_0_14px_rgba(16,185,129,0.2)]'
                            : 'bg-white/90 border-slate-200/80 text-slate-900 shadow-xs'
                        )}
                      >
                        <span className={cn(match.score.home !== null ? '' : 'text-slate-300 font-bold')}>
                          {match.score.home !== null ? match.score.home : '-'}
                        </span>
                        <span className="text-xs text-slate-300 font-bold">:</span>
                        <span className={cn(match.score.away !== null ? '' : 'text-slate-300 font-bold')}>
                          {match.score.away !== null ? match.score.away : '-'}
                        </span>
                      </div>

                      {match.isLive ? (
                        <span className="text-[10px] font-black text-emerald-600 mt-1.5 uppercase tracking-wider animate-pulse flex items-center gap-1 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {match.minute || 'LIVE'}
                        </span>
                      ) : match.status === 'FINISHED' ? (
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider">
                          FT
                        </span>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-1.5">
                          {kickoff.time}
                        </span>
                      )}
                    </div>

                    {/* Away Team (Right): Name Above Badge */}
                    <div className="flex flex-col items-center min-w-0 text-center flex-1 px-1">
                      <span
                        className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors block truncate w-full leading-tight mb-2"
                        title={match.awayTeam.name}
                      >
                        {match.awayTeam.name}
                      </span>
                      <TeamCrest
                        crest={match.awayTeam.crest}
                        name={match.awayTeam.name}
                        tla={match.awayTeam.tla}
                      />
                      <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1.5">
                        Away
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500">
                  <div className="flex items-center gap-1 min-w-0">
                    {match.status === 'UPCOMING' ? (
                      <span className="text-slate-500 flex items-center gap-1 font-semibold truncate">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        {kickoff.date} · {kickoff.time}
                      </span>
                    ) : match.score.halfTimeHome !== null && match.score.halfTimeAway !== null ? (
                      <span className="text-slate-500 font-medium truncate">
                        HT: {match.score.halfTimeHome} - {match.score.halfTimeAway}
                      </span>
                    ) : (
                      <span className="text-slate-400 truncate">Regular time</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {match.status !== 'FINISHED' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFollowMatch(
                            String(match.id),
                            `${match.homeTeam.shortName || match.homeTeam.name} vs ${
                              match.awayTeam.shortName || match.awayTeam.name
                            }`
                          );
                        }}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer',
                          isFollowing(String(match.id))
                            ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/50'
                        )}
                        title={
                          isFollowing(String(match.id))
                            ? 'Turn off match alerts'
                            : 'Get 15m kick-off, goal, HT & FT alerts'
                        }
                        aria-label="Toggle match alerts"
                      >
                        {isFollowing(String(match.id)) ? (
                          <>
                            <BellRing className="w-3 h-3 text-rose-600 animate-pulse" />
                            <span>Alerts On</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3 h-3" />
                            <span>Notify</span>
                          </>
                        )}
                      </button>
                    )}

                    <Link
                      to="/livescore"
                      className="inline-flex items-center gap-0.5 font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
                    >
                      Match Centre
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
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
          <span>View Detailed Livescore Center &amp; Highlights</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>
    </section>
  );
}
