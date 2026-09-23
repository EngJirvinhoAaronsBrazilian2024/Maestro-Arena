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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !match) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-black text-slate-900">Match not found</h2>
        <p className="text-slate-500 font-medium">The match details could not be loaded.</p>
        <Link to="/" className="mt-4 text-rose-600 font-bold hover:underline">Return to Home</Link>
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
              const homeValue = stat.value !== null && stat.value !== undefined ? stat.value : 0;
              const awayValue = match.statistics?.[1]?.statistics?.[idx]?.value !== null && match.statistics?.[1]?.statistics?.[idx]?.value !== undefined ? match.statistics[1].statistics[idx].value : 0;
              return (
                <div key={idx} className="mb-4">
                  <div className="mb-1 flex justify-between text-xs font-medium">
                    <span>{homeValue}</span>
                    <span className="text-slate-500">{stat.type}</span>
                    <span>{awayValue}</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 gap-1 p-0.5">
                    <div className="bg-rose-600 rounded-full transition-all duration-300" style={{ width: `${Math.max(10, Math.min(90, (Number(homeValue) / (Number(homeValue) + Number(awayValue) || 1)) * 100))}%` }}></div>
                    <div className="bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${Math.max(10, Math.min(90, (Number(awayValue) / (Number(homeValue) + Number(awayValue) || 1)) * 100))}%` }}></div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl bg-white/70 p-6 text-center text-sm font-medium text-slate-500 border border-slate-200/80">
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
              <CardTitle className="text-lg flex items-center gap-2 text-slate-950 font-black">
                {lineup.team.logo && <img src={lineup.team.logo} alt={lineup.team.name} className="h-6 w-6 object-contain" />}
                {lineup.team.name}
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium">Formation: <span className="font-bold text-slate-700">{lineup.formation}</span></p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Starting XI</h4>
                {lineup.startXI.map((player, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-3 border-b border-slate-100/80 py-1.5 last:border-0">
                    <span className="w-6 text-center text-xs font-black text-rose-600 bg-rose-50 rounded py-0.5">{player.player.number}</span>
                    <Link to={`/players/${player.player.id}`} className="text-sm font-bold text-slate-900 hover:text-rose-600 transition-colors">
                      {player.player.name}
                    </Link>
                  </div>
                ))}
                
                <h4 className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">Substitutes</h4>
                {lineup.substitutes.map((player, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-3 border-b border-slate-100/80 py-1.5 last:border-0">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">{player.player.number}</span>
                    <Link to={`/players/${player.player.id}`} className="text-sm font-medium text-slate-700 hover:text-rose-600 transition-colors">
                      {player.player.name}
                    </Link>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm"><span className="text-slate-500 font-medium">Coach: </span><strong className="text-slate-900">{lineup.coach.name}</strong></p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
         <div className="col-span-2 rounded-2xl bg-white/70 p-6 text-center text-sm font-medium text-slate-500 border border-slate-200/80">
          Lineups not available.
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Match Scoreboard Header */}
      <div className="overflow-hidden rounded-[28px] bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.04)] border border-white/90 relative">
        <div className="pt-6 text-center text-xs font-black uppercase tracking-wider text-rose-600 relative z-10 border-b-0 pb-0">
          {match.competitionName}
        </div>
        
        <div className="flex flex-col items-center justify-between p-6 sm:flex-row">
          {/* Home Team */}
          <Link to={`/teams/${match.homeTeam.id}`} className="flex flex-1 flex-col items-center gap-3 group">
            {match.homeTeam.logoUrl ? (
              <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="h-16 w-16 object-contain sm:h-20 sm:w-20 transition-transform group-hover:scale-105" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-800 sm:h-20 sm:w-20 border border-slate-200">
                {match.homeTeam.shortName}
              </div>
            )}
            <span className="text-center text-base sm:text-lg font-black text-slate-950 group-hover:text-rose-600 transition-colors">{match.homeTeam.name}</span>
          </Link>

          {/* Score & Status */}
          <div className="my-6 flex flex-col items-center justify-center px-4 sm:my-0 sm:px-8">
            <div className="flex items-center gap-4 text-4xl font-black sm:text-5xl text-slate-950">
              <span>{match.homeScore !== null ? match.homeScore : '-'}</span>
              <span className="text-slate-300">-</span>
              <span>{match.awayScore !== null ? match.awayScore : '-'}</span>
            </div>
            
            <div className="mt-3 flex items-center justify-center gap-2">
              {match.status === 'live' ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span>{match.matchMinute ? `${match.matchMinute}'` : 'LIVE'}</span>
                </div>
              ) : (
                <div className="rounded-full bg-slate-100 px-3.5 py-1 text-xs font-bold text-slate-600 border border-slate-200/80">
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-800 sm:h-20 sm:w-20 border border-slate-200">
                {match.awayTeam.shortName}
              </div>
            )}
            <span className="text-center text-base sm:text-lg font-black text-slate-950 group-hover:text-rose-600 transition-colors">{match.awayTeam.name}</span>
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
