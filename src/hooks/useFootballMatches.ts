import { useState, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { NormalizedMatch, MatchesResponseData } from '../server/services/footballDataService';

export type MatchFilterTab = 'all' | 'live' | 'upcoming' | 'finished';

const FALLBACK_MATCHES: MatchesResponseData = {
  success: true,
  count: 8,
  liveCount: 2,
  upcomingCount: 4,
  finishedCount: 2,
  lastUpdated: new Date().toISOString(),
  cached: true,
  matches: [
    {
      id: 501001,
      competition: {
        id: 2001,
        name: 'UEFA Champions League',
        code: 'UEFA.CHAMPIONS',
        emblem: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
        type: 'CUP'
      },
      utcDate: new Date(Date.now() - 68 * 60 * 1000).toISOString(),
      status: 'LIVE',
      rawStatus: 'IN_PLAY',
      statusLabel: 'LIVE',
      minute: "68'",
      isLive: true,
      homeTeam: { id: 86, name: 'Real Madrid CF', shortName: 'Real Madrid', tla: 'RMA', crest: 'https://crests.football-data.org/86.png' },
      awayTeam: { id: 5, name: 'FC Bayern München', shortName: 'Bayern', tla: 'BAY', crest: 'https://crests.football-data.org/5.png' },
      score: { home: 2, away: 1, halfTimeHome: 1, halfTimeAway: 1, winner: null, duration: 'REGULAR' },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501002,
      competition: {
        id: 8315,
        name: 'Africa Cup of Nations Qualifying',
        code: 'CAF.NATIONS_QUAL',
        emblem: 'https://a.espncdn.com/i/leaguelogos/soccer/500/8315.png',
        type: 'CUP'
      },
      utcDate: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
      status: 'LIVE',
      rawStatus: 'IN_PLAY',
      statusLabel: 'LIVE',
      minute: "34'",
      isLive: true,
      homeTeam: { id: 901, name: 'Nigeria', shortName: 'Nigeria', tla: 'NGA', crest: 'https://a.espncdn.com/i/teamlogos/countries/500/nga.png' },
      awayTeam: { id: 902, name: 'Morocco', shortName: 'Morocco', tla: 'MAR', crest: 'https://a.espncdn.com/i/teamlogos/countries/500/mar.png' },
      score: { home: 1, away: 1, halfTimeHome: null, halfTimeAway: null, winner: null, duration: 'REGULAR' },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501003,
      competition: {
        id: 2395,
        name: 'UEFA Nations League',
        code: 'UEFA.NATIONS',
        emblem: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2395.png',
        type: 'CUP'
      },
      utcDate: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      status: 'UPCOMING',
      rawStatus: 'TIMED',
      statusLabel: 'Scheduled',
      isLive: false,
      homeTeam: { id: 903, name: 'France', shortName: 'France', tla: 'FRA', crest: 'https://a.espncdn.com/i/teamlogos/countries/500/fra.png' },
      awayTeam: { id: 904, name: 'Spain', shortName: 'Spain', tla: 'ESP', crest: 'https://a.espncdn.com/i/teamlogos/countries/500/esp.png' },
      score: { home: null, away: null, halfTimeHome: null, halfTimeAway: null, winner: null, duration: 'REGULAR' },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501004,
      competition: {
        id: 2021,
        name: 'English Premier League',
        code: 'ENG.1',
        emblem: 'https://crests.football-data.org/PL.png',
        type: 'LEAGUE'
      },
      utcDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      status: 'UPCOMING',
      rawStatus: 'TIMED',
      statusLabel: 'Scheduled',
      isLive: false,
      homeTeam: { id: 57, name: 'Arsenal FC', shortName: 'Arsenal', tla: 'ARS', crest: 'https://crests.football-data.org/57.png' },
      awayTeam: { id: 64, name: 'Liverpool FC', shortName: 'Liverpool', tla: 'LIV', crest: 'https://crests.football-data.org/64.png' },
      score: { home: null, away: null, halfTimeHome: null, halfTimeAway: null, winner: null, duration: 'REGULAR' },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501005,
      competition: {
        id: 2014,
        name: 'Spanish LALIGA',
        code: 'ESP.1',
        emblem: 'https://crests.football-data.org/laliga.png',
        type: 'LEAGUE'
      },
      utcDate: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      status: 'UPCOMING',
      rawStatus: 'TIMED',
      statusLabel: 'Scheduled',
      isLive: false,
      homeTeam: { id: 81, name: 'FC Barcelona', shortName: 'Barcelona', tla: 'FCB', crest: 'https://crests.football-data.org/81.png' },
      awayTeam: { id: 78, name: 'Atlético Madrid', shortName: 'Atleti', tla: 'ATM', crest: 'https://crests.football-data.org/78.png' },
      score: { home: null, away: null, halfTimeHome: null, halfTimeAway: null, winner: null, duration: 'REGULAR' },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501006,
      competition: {
        id: 2019,
        name: 'Italian Serie A',
        code: 'ITA.1',
        emblem: 'https://crests.football-data.org/SA.png',
        type: 'LEAGUE'
      },
      utcDate: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      status: 'FINISHED',
      rawStatus: 'FINISHED',
      statusLabel: 'FT',
      isLive: false,
      homeTeam: { id: 108, name: 'FC Internazionale Milano', shortName: 'Inter', tla: 'INT', crest: 'https://crests.football-data.org/108.png' },
      awayTeam: { id: 109, name: 'Juventus FC', shortName: 'Juventus', tla: 'JUV', crest: 'https://crests.football-data.org/109.png' },
      score: { home: 2, away: 0, halfTimeHome: 1, halfTimeAway: 0, winner: 'HOME_TEAM', duration: 'REGULAR' },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501007,
      competition: {
        id: 3951,
        name: 'CONMEBOL Libertadores',
        code: 'CONMEBOL.LIBERTADORES',
        emblem: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2031.png',
        type: 'CUP'
      },
      utcDate: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      status: 'UPCOMING',
      rawStatus: 'TIMED',
      statusLabel: 'Scheduled',
      isLive: false,
      homeTeam: { id: 905, name: 'Flamengo', shortName: 'Flamengo', tla: 'FLA', crest: null },
      awayTeam: { id: 906, name: 'River Plate', shortName: 'River Plate', tla: 'RIV', crest: null },
      score: { home: null, away: null, halfTimeHome: null, halfTimeAway: null, winner: null, duration: 'REGULAR' },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501008,
      competition: {
        id: 2002,
        name: 'German Bundesliga',
        code: 'GER.1',
        emblem: 'https://crests.football-data.org/BL1.png',
        type: 'LEAGUE'
      },
      utcDate: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      status: 'FINISHED',
      rawStatus: 'FINISHED',
      statusLabel: 'FT',
      isLive: false,
      homeTeam: { id: 4, name: 'Borussia Dortmund', shortName: 'Dortmund', tla: 'BVB', crest: 'https://crests.football-data.org/4.png' },
      awayTeam: { id: 3, name: 'Bayer 04 Leverkusen', shortName: 'Leverkusen', tla: 'B04', crest: 'https://crests.football-data.org/3.png' },
      score: { home: 2, away: 2, halfTimeHome: 1, halfTimeAway: 0, winner: 'DRAW', duration: 'REGULAR' },
      lastUpdated: new Date().toISOString()
    }
  ]
};

const fetcher = async (url: string): Promise<MatchesResponseData> => {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.matches) && json.matches.length > 0) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('sportshub_matches_cache', JSON.stringify(json));
          }
        } catch {}
        return json;
      }
    }
  } catch (err) {
    console.warn('Matches network fetch notice, reading from cache/fallback:', err);
  }

  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sportshub_matches_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0) {
          return { ...parsed, isStale: true };
        }
      }
    }
  } catch {}

  return FALLBACK_MATCHES;
};


export function useFootballMatches() {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const previousGoodDataRef = useRef<MatchesResponseData | null>(null);

  const { data, error, isLoading, isValidating, mutate } = useSWR<MatchesResponseData>(
    '/api/matches',
    fetcher,
    {
      refreshInterval: (latestData) => {
        // If there are matches currently LIVE, poll every 60 seconds
        if (latestData && latestData.liveCount > 0) {
          return 60 * 1000;
        }
        // Otherwise poll every 120 seconds to save quota
        return 120 * 1000;
      },
      dedupingInterval: 15 * 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 10 * 1000,
      onSuccess: (freshData) => {
        if (freshData?.success) {
          previousGoodDataRef.current = freshData;
        }
      },
    }
  );

  // If there's an error but we had previous good data, retain it and flag as stale
  const effectiveData: MatchesResponseData | null = data || previousGoodDataRef.current;
  const isStale = Boolean(effectiveData && (error || effectiveData.isStale));

  const refresh = useCallback(async () => {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);
    try {
      // Force refresh on server
      await mutate(fetcher('/api/matches?refresh=true'), {
        revalidate: false,
      });
    } catch (e) {
      console.warn('Manual match refresh failed:', e);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [isManualRefreshing, mutate]);

  return {
    data: effectiveData,
    matches: effectiveData?.matches || [],
    liveCount: effectiveData?.liveCount || 0,
    upcomingCount: effectiveData?.upcomingCount || 0,
    finishedCount: effectiveData?.finishedCount || 0,
    totalCount: effectiveData?.count || 0,
    lastUpdated: effectiveData?.lastUpdated,
    cached: effectiveData?.cached,
    isLoading: isLoading && !effectiveData,
    isRefreshing: isValidating || isManualRefreshing,
    isManualRefreshing,
    isStale,
    error,
    refresh,
  };
}
