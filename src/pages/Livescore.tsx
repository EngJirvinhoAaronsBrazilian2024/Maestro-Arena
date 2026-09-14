import React, { useState, useMemo } from 'react';
import { useLiveMatches, useCompetitions } from '../services/sports/hooks';
import { MatchCard } from '../components/sports/MatchCard';
import { LiveIndicator } from '../components/sports/LiveIndicator';
import { Match, Competition } from '../types/sports';
import { getLeaguePriority } from '../lib/utils';

export function Livescore() {
  const { matches: liveMatches, isLoading: isLoadingMatches, isError } = useLiveMatches();
  const { competitions } = useCompetitions();
  const [filter, setFilter] = useState<string>('All');

  const isLoading = isLoadingMatches;

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

    // Group by competition
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
    }, {} as Record<string, { competition: Competition, matches: Match[] }>);

    // Convert to array and sort
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <LiveIndicator /> Live Scores
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time updates from matches around the world.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter('All')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'All' ? 'bg-white text-slate-900 shadow-sm  ' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All
            </button>
          </div>
          
          <select 
            value={filter !== 'All' ? filter : ''} 
            onChange={(e) => {
              if (e.target.value) {
                setFilter(e.target.value);
              } else {
                setFilter('All');
              }
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Specific League...</option>
            {availableLeagues.map(league => (
              <option key={league.id} value={league.id}>
                {league.country} - {league.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
        </div>
      ) : isError ? (
        <div className="rounded-lg bg-red-50 p-6 text-center text-red-600">
          Failed to load live scores. Please try again later.
        </div>
      ) : groupedAndSortedMatches.length > 0 ? (
        <div className="space-y-8">
          {groupedAndSortedMatches.map((group) => (
            <div key={group.competition.id} className="space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                {group.competition.logoUrl ? (
                  <img src={group.competition.logoUrl} alt={group.competition.name} className="h-6 w-6 object-contain" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-200 text-xs font-bold">
                    {group.competition.name.charAt(0)}
                  </div>
                )}
                <h2 className="text-lg font-bold text-slate-800">
                  {group.competition.name} <span className="text-sm font-normal text-slate-500">({group.competition.country})</span>
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
        <div className="flex h-40 flex-col items-center justify-center rounded-lg bg-slate-50 text-slate-500">
          <p>No live matches currently in progress for the selected filter.</p>
        </div>
      )}
    </div>
  );
}
