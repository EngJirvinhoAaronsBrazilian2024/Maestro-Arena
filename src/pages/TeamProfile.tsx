import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTeamDetails } from '../services/sports/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { MapPin, Calendar, Info } from 'lucide-react';

export function TeamProfile() {
  const { id } = useParams<{ id: string }>();
  const { team, isLoading, isError } = useTeamDetails(id || '');

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-black text-slate-900">Team not found</h2>
        <p className="text-slate-500 font-medium">The team details could not be loaded.</p>
        <Link to="/" className="mt-4 text-rose-600 font-bold hover:underline">Return to Home</Link>
      </div>
    );
  }

  const renderSquad = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {team.squad && team.squad.length > 0 ? (
        team.squad.map((player) => (
          <Link key={player.id} to={`/players/${player.id}`}>
            <Card className="hover:border-rose-300 hover:shadow-md transition-all h-full cursor-pointer group bg-white/80">
              <CardContent className="flex items-center gap-4 p-4">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name || 'Player'} className="h-12 w-12 rounded-full object-cover bg-slate-100 shadow-2xs border border-slate-200 group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 group-hover:scale-105 transition-transform">
                    {(player.name || 'P').charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-rose-600 transition-colors">{player.name || 'Player'}</h4>
                  <div className="flex gap-2 text-xs text-slate-500 font-semibold mt-1">
                    {player.number && <span className="text-rose-600 font-bold">#{player.number}</span>}
                    <span>•</span>
                    <span>{player.position}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      ) : (
        <div className="col-span-full rounded-2xl bg-white/70 p-8 text-center text-slate-500 font-medium border border-slate-200/80">
          Squad information is not available.
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Team Header */}
      <div className="overflow-hidden rounded-[28px] bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.04)] border border-white/90">
        <div className="h-32 bg-gradient-to-r from-rose-500/15 via-cyan-500/10 to-amber-500/10 border-b border-slate-100 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        </div>
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-12 sm:-mt-16">
            <div className="rounded-2xl bg-white p-2.5 shadow-md shadow-slate-200/60 border border-slate-100 shrink-0">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="h-24 w-24 object-contain sm:h-32 sm:w-32" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center bg-slate-100 text-3xl font-black text-slate-800 sm:h-32 sm:w-32 rounded-xl">
                  {team.shortName}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left mb-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">{team.name}</h1>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-500">
                {team.venue && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    <span>{team.venue}</span>
                  </div>
                )}
                {team.founded && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-cyan-600" />
                    <span>Est. {team.founded}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-2">
              <button className="rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/25 hover:from-rose-500 hover:to-red-500 transition-all cursor-pointer">
                Follow Team
              </button>
            </div>
          </div>
        </div>
      </div>

      <Tabs 
        tabs={[
          { id: 'squad', label: 'Squad', content: renderSquad() },
          { id: 'overview', label: 'Overview', content: <div className="p-4 text-center text-slate-500">Upcoming fixtures and past results will be displayed here in a later stage.</div> }
        ]}
      />
    </div>
  );
}
