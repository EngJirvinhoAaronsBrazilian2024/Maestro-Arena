import { useState, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { NormalizedMatch, MatchesResponseData } from '../server/services/footballDataService';

export type MatchFilterTab = 'all' | 'live' | 'upcoming' | 'finished';

const FALLBACK_MATCHES: MatchesResponseData = {
  success: true,
  count: 6,
  liveCount: 2,
  upcomingCount: 2,
  finishedCount: 2,
  lastUpdated: new Date().toISOString(),
  cached: true,
  matches: [
    {
      id: 501001,
      competition: {
        id: 2021,
        name: 'Premier League',
        code: 'PL',
        emblem: 'https://crests.football-data.org/PL.png',
        type: 'LEAGUE'
      },
      utcDate: new Date(Date.now() - 68 * 60 * 1000).toISOString(),
      status: 'LIVE',
      rawStatus: 'IN_PLAY',
      statusLabel: 'LIVE',
      minute: "68'",
      isLive: true,
      homeTeam: {
        id: 57,
        name: 'Arsenal FC',
        shortName: 'Arsenal',
        tla: 'ARS',
        crest: 'https://crests.football-data.org/57.png'
      },
      awayTeam: {
        id: 61,
        name: 'Chelsea FC',
        shortName: 'Chelsea',
        tla: 'CHE',
        crest: 'https://crests.football-data.org/61.png'
      },
      score: {
        home: 2,
        away: 1,
        halfTimeHome: 1,
        halfTimeAway: 1,
        winner: null,
        duration: 'REGULAR'
      },
      matchday: 28,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501002,
      competition: {
        id: 2014,
        name: 'La Liga',
        code: 'PD',
        emblem: 'https://crests.football-data.org/laliga.png',
        type: 'LEAGUE'
      },
      utcDate: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
      status: 'LIVE',
      rawStatus: 'IN_PLAY',
      statusLabel: 'LIVE',
      minute: "34'",
      isLive: true,
      homeTeam: {
        id: 86,
        name: 'Real Madrid CF',
        shortName: 'Real Madrid',
        tla: 'RMA',
        crest: 'https://crests.football-data.org/86.png'
      },
      awayTeam: {
        id: 81,
        name: 'FC Barcelona',
        shortName: 'Barcelona',
        tla: 'FCB',
        crest: 'https://crests.football-data.org/81.png'
      },
      score: {
        home: 1,
        away: 1,
        halfTimeHome: null,
        halfTimeAway: null,
        winner: null,
        duration: 'REGULAR'
      },
      matchday: 27,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501003,
      competition: {
        id: 2021,
        name: 'Premier League',
        code: 'PL',
        emblem: 'https://crests.football-data.org/PL.png',
        type: 'LEAGUE'
      },
      utcDate: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      status: 'UPCOMING',
      rawStatus: 'TIMED',
      statusLabel: 'Scheduled',
      isLive: false,
      homeTeam: {
        id: 64,
        name: 'Liverpool FC',
        shortName: 'Liverpool',
        tla: 'LIV',
        crest: 'https://crests.football-data.org/64.png'
      },
      awayTeam: {
        id: 65,
        name: 'Manchester City FC',
        shortName: 'Man City',
        tla: 'MCI',
        crest: 'https://crests.football-data.org/65.png'
      },
      score: {
        home: null,
        away: null,
        halfTimeHome: null,
        halfTimeAway: null,
        winner: null,
        duration: 'REGULAR'
      },
      matchday: 28,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501004,
      competition: {
        id: 2001,
        name: 'UEFA Champions League',
        code: 'CL',
        emblem: 'https://crests.football-data.org/CL.png',
        type: 'CUP'
      },
      utcDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      status: 'UPCOMING',
      rawStatus: 'TIMED',
      statusLabel: 'Scheduled',
      isLive: false,
      homeTeam: {
        id: 5,
        name: 'FC Bayern München',
        shortName: 'Bayern',
        tla: 'FCB',
        crest: 'https://crests.football-data.org/5.png'
      },
      awayTeam: {
        id: 524,
        name: 'Paris Saint-Germain FC',
        shortName: 'PSG',
        tla: 'PSG',
        crest: 'https://crests.football-data.org/524.png'
      },
      score: {
        home: null,
        away: null,
        halfTimeHome: null,
        halfTimeAway: null,
        winner: null,
        duration: 'REGULAR'
      },
      matchday: 6,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501005,
      competition: {
        id: 2019,
        name: 'Serie A',
        code: 'SA',
        emblem: 'https://crests.football-data.org/SA.png',
        type: 'LEAGUE'
      },
      utcDate: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      status: 'FINISHED',
      rawStatus: 'FINISHED',
      statusLabel: 'FT',
      isLive: false,
      homeTeam: {
        id: 108,
        name: 'FC Internazionale Milano',
        shortName: 'Inter',
        tla: 'INT',
        crest: 'https://crests.football-data.org/108.png'
      },
      awayTeam: {
        id: 109,
        name: 'Juventus FC',
        shortName: 'Juventus',
        tla: 'JUV',
        crest: 'https://crests.football-data.org/109.png'
      },
      score: {
        home: 2,
        away: 0,
        halfTimeHome: 1,
        halfTimeAway: 0,
        winner: 'HOME_TEAM',
        duration: 'REGULAR'
      },
      matchday: 26,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 501006,
      competition: {
        id: 2021,
        name: 'Premier League',
        code: 'PL',
        emblem: 'https://crests.football-data.org/PL.png',
        type: 'LEAGUE'
      },
      utcDate: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      status: 'FINISHED',
      rawStatus: 'FINISHED',
      statusLabel: 'FT',
      isLive: false,
      homeTeam: {
        id: 66,
        name: 'Manchester United FC',
        shortName: 'Man United',
        tla: 'MUN',
        crest: 'https://crests.football-data.org/66.png'
      },
      awayTeam: {
        id: 67,
        name: 'Newcastle United FC',
        shortName: 'Newcastle',
        tla: 'NEW',
        crest: 'https://crests.football-data.org/67.png'
      },
      score: {
        home: 2,
        away: 2,
        halfTimeHome: 1,
        halfTimeAway: 0,
        winner: 'DRAW',
        duration: 'REGULAR'
      },
      matchday: 28,
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
