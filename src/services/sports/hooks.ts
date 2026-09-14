import useSWR from 'swr';
import { fetcher, API_BASE_URL } from './api';
import { Match, Competition, MatchDetail, TeamDetail, PlayerDetail, Standing, Transfer } from '../../types/sports';

// Live matches with 1-minute polling interval
export function useLiveMatches() {
  const { data, error, isLoading } = useSWR<Match[]>(
    `${API_BASE_URL}/live`,
    fetcher,
    { refreshInterval: 60000, dedupingInterval: 10000 }
  );

  return {
    matches: data,
    isLoading,
    isError: error
  };
}

// Upcoming matches with 5-minute polling interval
export function useUpcomingMatches() {
  const { data, error, isLoading } = useSWR<Match[]>(
    `${API_BASE_URL}/upcoming`,
    fetcher,
    { refreshInterval: 300000, dedupingInterval: 60000 }
  );

  return {
    matches: data,
    isLoading,
    isError: error
  };
}

export function useCompetitions() {
  const { data, error, isLoading, mutate } = useSWR<Competition[]>(
    `${API_BASE_URL}/competitions`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    competitions: data,
    isLoading,
    isError: error,
    mutate
  };
}

export function useMatchDetails(id: string) {
  const { data, error, isLoading } = useSWR<MatchDetail>(
    id ? `${API_BASE_URL}/matches/${id}` : null,
    fetcher,
    { refreshInterval: 60000, dedupingInterval: 30000 } // Poll every minute if live
  );

  return { match: data, isLoading, isError: error };
}

export function useTeamDetails(id: string) {
  const { data, error, isLoading } = useSWR<TeamDetail>(
    id ? `${API_BASE_URL}/teams/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return { team: data, isLoading, isError: error };
}

export function usePlayerDetails(id: string) {
  const { data, error, isLoading } = useSWR<PlayerDetail>(
    id ? `${API_BASE_URL}/players/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return { player: data, isLoading, isError: error };
}

export function useStandings(competitionId: string) {
  const { data, error, isLoading } = useSWR<Standing[]>(
    competitionId ? `${API_BASE_URL}/competitions/${competitionId}/standings` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return { standings: data, isLoading, isError: error };
}

export function useTransfers() {
  const { data, error, isLoading } = useSWR<Transfer[]>(
    `${API_BASE_URL}/transfers`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return { transfers: data, isLoading, isError: error };
}

export function useCompetitionResults(competitionId: string) {
  const { data, error, isLoading } = useSWR<Match[]>(
    competitionId ? `${API_BASE_URL}/competitions/${competitionId}/results` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { results: data, isLoading, isError: error };
}

export function useCompetitionFixtures(competitionId: string) {
  const { data, error, isLoading } = useSWR<Match[]>(
    competitionId ? `${API_BASE_URL}/competitions/${competitionId}/fixtures` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { fixtures: data, isLoading, isError: error };
}

export function useCompetitionTeams(competitionId: string) {
  const { data, error, isLoading } = useSWR<any[]>(
    competitionId ? `${API_BASE_URL}/competitions/${competitionId}/teams` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { teams: data, isLoading, isError: error };
}

export function useCompetitionTopScorers(competitionId: string) {
  const { data, error, isLoading } = useSWR<any[]>(
    competitionId ? `${API_BASE_URL}/competitions/${competitionId}/topscorers` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { scorers: data, isLoading, isError: error };
}

export function useCompetitionStatistics(competitionId: string) {
  const { data, error, isLoading } = useSWR<any>(
    competitionId ? `${API_BASE_URL}/competitions/${competitionId}/statistics` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { statistics: data, isLoading, isError: error };
}

export function useRecentMatches() {
  const { data, error, isLoading } = useSWR<Match[]>(
    `${API_BASE_URL}/recent`,
    fetcher,
    { refreshInterval: 300000, dedupingInterval: 60000 }
  );
  return {
    matches: data,
    isLoading,
    isError: error
  };
}

export function useSearchTeams(query: string) {
  const { data, error, isLoading } = useSWR<any[]>(
    query && query.length > 1 ? `${API_BASE_URL}/teams/search?q=${encodeURIComponent(query)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    teams: data || [],
    isLoading,
    isError: error
  };
}

export function useFavoriteFixtures(teamIds: string[]) {
  const query = teamIds.length > 0 ? teamIds.join(',') : '';
  const { data, error, isLoading } = useSWR<any[]>(
    query ? `${API_BASE_URL}/favorites/fixtures?teams=${query}` : null,
    fetcher
  );
  return {
    fixtures: data || [],
    isLoading,
    isError: error
  };
}

export function useSearchAll(query: string) {
  const { data, error, isLoading } = useSWR<any>(
    query && query.length > 1 ? `${API_BASE_URL}/search?q=${encodeURIComponent(query)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    results: data || { teams: [], players: [], competitions: [] },
    isLoading,
    isError: error
  };
}
