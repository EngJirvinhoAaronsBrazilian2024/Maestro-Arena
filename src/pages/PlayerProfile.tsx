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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !player) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-black text-slate-900">Player not found</h2>
        <p className="text-slate-500 font-medium">The player details could not be loaded.</p>
        <Link to="/" className="mt-4 text-rose-600 font-bold hover:underline">Return to Home</Link>
      </div>
    );
  }

  const renderStats = () => (
    <div className="space-y-6">
      {player.statistics && player.statistics.length > 0 ? (
        player.statistics.map((stat, idx) => (
          <Card key={idx}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-950 font-black">
                {stat.league.logoUrl && <img src={stat.league.logoUrl} alt={stat.league.name} className="h-5 w-5 object-contain" />}
                {stat.league.name}
              </CardTitle>
              <Link to={`/teams/${stat.team.id}`} className="text-sm font-bold text-rose-600 hover:text-rose-700 transition-colors">
                {stat.team.name}
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex flex-col items-center p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 shadow-2xs">
                  <span className="text-2xl font-black text-slate-950">{stat.games.appearances || 0}</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mt-0.5">Appearances</span>
                </div>
                <div className="flex flex-col items-center p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 shadow-2xs">
                  <span className="text-2xl font-black text-rose-600">{stat.goals.total || 0}</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-600/70 mt-0.5">Goals</span>
                </div>
                <div className="flex flex-col items-center p-3.5 rounded-2xl bg-cyan-50/50 border border-cyan-100 shadow-2xs">
                  <span className="text-2xl font-black text-cyan-700">{stat.goals.assists || 0}</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-cyan-700/70 mt-0.5">Assists</span>
                </div>
                <div className="flex flex-col items-center p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 shadow-2xs">
                  <span className="text-2xl font-black text-slate-950">{stat.games.minutes || 0}</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mt-0.5">Minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="rounded-2xl bg-white/70 p-8 text-center text-slate-500 font-medium border border-slate-200/80">
          Statistics are not available.
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Player Header */}
      <div className="overflow-hidden rounded-[28px] bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.04)] border border-white/90">
        <div className="flex flex-col md:flex-row items-center gap-6 p-6">
          <div className="shrink-0 rounded-full border-4 border-rose-100/80 bg-white p-1 shadow-md shadow-rose-500/10">
            {player.photoUrl ? (
              <img src={player.photoUrl} alt={player.name} className="h-28 w-28 md:h-32 md:w-32 rounded-full object-cover shadow-2xs border-2 border-white" />
            ) : (
              <div className="flex h-28 w-28 md:h-32 md:w-32 items-center justify-center rounded-full bg-slate-100 text-3xl font-bold text-slate-400">
                <User className="h-12 w-12" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">{player.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-bold">
              {player.position && (
                <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-rose-700 border border-rose-200/70">
                  {player.position}
                </span>
              )}
              {player.nationality && (
                <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200/60">
                  <Globe className="h-3.5 w-3.5 text-cyan-600" />
                  <span>{player.nationality}</span>
                </div>
              )}
              {player.age && (
                <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200/60">
                  <Activity className="h-3.5 w-3.5 text-amber-500" />
                  <span>Age {player.age}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="shrink-0">
            <button className="rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/25 hover:from-rose-500 hover:to-red-500 transition-all cursor-pointer">
              Follow Player
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
