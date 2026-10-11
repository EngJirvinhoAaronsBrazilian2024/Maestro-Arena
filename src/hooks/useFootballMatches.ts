import { useState, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { NormalizedMatch, MatchesResponseData } from '../server/services/footballDataService';

export type MatchFilterTab = 'all' | 'live' | 'upcoming' | 'finished';

const fetcher = async (url: string): Promise<MatchesResponseData> => {
  const res = await fetch(url);
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const json = await res.json();
      if (json.error) errorMsg = json.error;
    } catch {}
    const err: any = new Error(errorMsg);
    err.status = res.status;
    throw err;
  }
  return res.json();
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
