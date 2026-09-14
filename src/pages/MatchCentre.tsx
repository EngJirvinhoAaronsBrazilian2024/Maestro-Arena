import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMatchDetails } from '../services/sports/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { LiveIndicator } from '../components/sports/LiveIndicator';
import { Clock, Users, Activity, MessageSquare } from 'lucide-react';
import { formatDateEAT } from '../lib/utils';

export function MatchCentre() {
  const { id } = useParams<{ id: string }>();
  const { match, isLoading, isError } = useMatchDetails(id || '');

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !match) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold">Match not found</h2>
        <p className="text-slate-500">The match details could not be loaded.</p>
        <Link to="/" className="mt-4 text-blue-600 hover:underline">Return to Home</Link>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Events Timeline */}
      {match.events && match.events.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Match Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {match.events.map((event, index) => (
              <div key={index} className="flex items-center gap-4 border-b border-slate-200 pb-2 last:border-0">
                <div className="w-12 text-sm font-bold text-slate-500">
                  {event.time.elapsed}'
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {event.player.name} <span className="text-slate-500 font-normal">({event.team.name})</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {event.type} {event.detail && `- ${event.detail}`}
                    {event.assist && ` (Assist: ${event.assist.name})`}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
          No events available yet.
        </div>
      )}
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6">
      {match.statistics && match.statistics.length === 2 ? (
        <Card>
          <CardContent className="pt-6">
            {match.statistics[0].statistics.map((stat, idx) => {
              const homeValue = stat.value !== null ? stat.value : 0;
              const awayValue = match.statistics![1].statistics[idx].value !== null ? match.statistics![1].statistics[idx].value : 0;
              return (
                <div key={idx} className="mb-4">
                  <div className="mb-1 flex justify-between text-xs font-medium">
                    <span>{homeValue}</span>
                    <span className="text-slate-500">{stat.type}</span>
                    <span>{awayValue}</span>
                  </div>
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 gap-1">
                    <div className="bg-green-600" style={{ width: '50%' }}></div>
                    <div className="bg-slate-300" style={{ width: '50%' }}></div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
          Statistics not available.
        </div>
      )}
    </div>
  );

  const renderLineups = () => (
    <div className="grid gap-6 md:grid-cols-2">
      {match.lineups ? (
        match.lineups.map((lineup, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {lineup.team.logo && <img src={lineup.team.logo} alt={lineup.team.name} className="h-6 w-6 object-contain" />}
                {lineup.team.name}
              </CardTitle>
              <p className="text-xs text-slate-500">Formation: {lineup.formation}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Starting XI</h4>
                {lineup.startXI.map((player, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-3 border-b border-slate-50 py-1 last:border-0">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">{player.player.number}</span>
                    <Link to={`/players/${player.player.id}`} className="text-sm font-medium hover:text-blue-600">
                      {player.player.name}
                    </Link>
                  </div>
                ))}
                
                <h4 className="mt-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Substitutes</h4>
                {lineup.substitutes.map((player, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-3 border-b border-slate-50 py-1 last:border-0">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">{player.player.number}</span>
                    <Link to={`/players/${player.player.id}`} className="text-sm font-medium hover:text-blue-600">
                      {player.player.name}
                    </Link>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm"><span className="text-slate-500">Coach: </span>{lineup.coach.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
         <div className="col-span-2 rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
          Lineups not available.
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Match Scoreboard Header */}
      <div className="overflow-hidden rounded-[28px] bg-white/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 relative">
        <div className="pt-8 text-center text-sm font-medium text-slate-500 relative z-10 border-b-0 pb-0">
          {match.competitionName}
        </div>
        
        <div className="flex flex-col items-center justify-between p-6 sm:flex-row">
          {/* Home Team */}
          <Link to={`/teams/${match.homeTeam.id}`} className="flex flex-1 flex-col items-center gap-3 group">
            {match.homeTeam.logoUrl ? (
              <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="h-16 w-16 object-contain sm:h-20 sm:w-20 transition-transform group-hover:scale-105" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-bold sm:h-20 sm:w-20">
                {match.homeTeam.shortName}
              </div>
            )}
            <span className="text-center text-lg font-bold group-hover:text-blue-600">{match.homeTeam.name}</span>
          </Link>

          {/* Score & Status */}
          <div className="my-6 flex flex-col items-center justify-center px-4 sm:my-0 sm:px-8">
            <div className="flex items-center gap-4 text-4xl font-black sm:text-5xl">
              <span>{match.homeScore !== null ? match.homeScore : '-'}</span>
              <span className="text-slate-300">-</span>
              <span>{match.awayScore !== null ? match.awayScore : '-'}</span>
            </div>
            
            <div className="mt-2 flex items-center justify-center gap-2">
              {match.status === 'live' ? (
                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-red-500 shadow-sm border border-slate-100 absolute top-4 left-1/2 -translate-x-1/2">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                  {match.matchMinute || 'LIVE'}
                </div>
              ) : (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  {match.status === 'finished' ? 'Full Time' : formatDateEAT(match.startTime, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              )}
            </div>
          </div>

          {/* Away Team */}
          <Link to={`/teams/${match.awayTeam.id}`} className="flex flex-1 flex-col items-center gap-3 group">
            {match.awayTeam.logoUrl ? (
              <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="h-16 w-16 object-contain sm:h-20 sm:w-20 transition-transform group-hover:scale-105" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-bold sm:h-20 sm:w-20">
                {match.awayTeam.shortName}
              </div>
            )}
            <span className="text-center text-lg font-bold group-hover:text-blue-600">{match.awayTeam.name}</span>
          </Link>
        </div>
      </div>

      <Tabs 
        tabs={[
          { id: 'overview', label: 'Overview', content: renderOverview() },
          { id: 'stats', label: 'Statistics', content: renderStats() },
          { id: 'lineups', label: 'Lineups', content: renderLineups() }
        ]}
      />
    </div>
  );
}
