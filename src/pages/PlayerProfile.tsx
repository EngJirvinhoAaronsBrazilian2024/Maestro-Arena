import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlayerDetails } from '../services/sports/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { User, Activity, Globe } from 'lucide-react';

export function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const { player, isLoading, isError } = usePlayerDetails(id || '');

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !player) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold">Player not found</h2>
        <p className="text-slate-500">The player details could not be loaded.</p>
        <Link to="/" className="mt-4 text-blue-600 hover:underline">Return to Home</Link>
      </div>
    );
  }

  const renderStats = () => (
    <div className="space-y-6">
      {player.statistics && player.statistics.length > 0 ? (
        player.statistics.map((stat, idx) => (
          <Card key={idx}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {stat.league.logoUrl && <img src={stat.league.logoUrl} alt={stat.league.name} className="h-5 w-5" />}
                {stat.league.name}
              </CardTitle>
              <Link to={`/teams/${stat.team.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                {stat.team.name}
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50">
                  <span className="text-2xl font-bold">{stat.games.appearances || 0}</span>
                  <span className="text-xs uppercase tracking-wider text-slate-500">Appearances</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50">
                  <span className="text-2xl font-bold">{stat.goals.total || 0}</span>
                  <span className="text-xs uppercase tracking-wider text-slate-500">Goals</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50">
                  <span className="text-2xl font-bold">{stat.goals.assists || 0}</span>
                  <span className="text-xs uppercase tracking-wider text-slate-500">Assists</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50">
                  <span className="text-2xl font-bold">{stat.games.minutes || 0}</span>
                  <span className="text-xs uppercase tracking-wider text-slate-500">Minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="rounded-lg bg-slate-50 p-8 text-center text-slate-500">
          Statistics are not available.
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Player Header */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col md:flex-row items-center gap-6 p-6">
          <div className="shrink-0 rounded-full border-4 border-slate-200 bg-white p-1 shadow-md">
            {player.photoUrl ? (
              <img src={player.photoUrl} alt={player.name} className="h-32 w-32 rounded-full object-cover shadow-md border-4 border-white" />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 text-3xl font-bold text-slate-400">
                <User className="h-12 w-12" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium">
              {player.position && (
                <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-blue-700">
                  {player.position}
                </span>
              )}
              {player.nationality && (
                <div className="flex items-center gap-1 text-slate-600">
                  <Globe className="h-4 w-4" />
                  {player.nationality}
                </div>
              )}
              {player.age && (
                <div className="flex items-center gap-1 text-slate-600">
                  <Activity className="h-4 w-4" />
                  Age {player.age}
                </div>
              )}
            </div>
          </div>
          
          <div className="shrink-0">
            <button className="rounded-full bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
              Follow
            </button>
          </div>
        </div>
      </div>

      <Tabs 
        tabs={[
          { id: 'stats', label: 'Statistics', content: renderStats() },
          { id: 'news', label: 'News', content: <div className="p-4 text-center text-slate-500">Related news will appear here when the News module is implemented.</div> }
        ]}
      />
    </div>
  );
}
