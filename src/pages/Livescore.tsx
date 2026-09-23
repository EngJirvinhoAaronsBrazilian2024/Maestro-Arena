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
          <h1 className="text-3xl font-black tracking-tight text-slate-950 flex items-center gap-3">
            <LiveIndicator /> Live Scores
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Real-time updates from matches around the world.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex bg-white/80 border border-slate-200/80 p-1 rounded-xl shadow-2xs">
            <button
              onClick={() => setFilter('All')}
              className={`px-3.5 py-1.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${filter === 'All' ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'}`}
            >
              All Matches
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
            className="rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-sm font-bold text-slate-800 shadow-2xs focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all cursor-pointer"
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-center text-rose-700 font-medium">
          Failed to load live scores. Please try again later.
        </div>
      ) : groupedAndSortedMatches.length > 0 ? (
        <div className="space-y-8">
          {groupedAndSortedMatches.map((group) => (
            <div key={group.competition.id} className="space-y-3">
              <div className="flex items-center gap-3 border-l-4 border-rose-600 pl-3 py-1">
                {group.competition?.logoUrl ? (
                  <img src={group.competition.logoUrl} alt={group.competition?.name || 'Competition'} className="h-6 w-6 object-contain" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-200 text-xs font-bold text-slate-700">
                    {(group.competition?.name || 'C').charAt(0)}
                  </div>
                )}
                <h2 className="text-lg font-bold text-slate-900">
                  {group.competition?.name || 'Competition'} <span className="text-xs font-semibold text-slate-500">({group.competition?.country || ''})</span>
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
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-md text-slate-500">
          <p className="font-semibold text-slate-700">No live matches currently in progress for the selected filter.</p>
        </div>
      )}
    </div>
  );
}
