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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold">Team not found</h2>
        <p className="text-slate-500">The team details could not be loaded.</p>
        <Link to="/" className="mt-4 text-blue-600 hover:underline">Return to Home</Link>
      </div>
    );
  }

  const renderSquad = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {team.squad && team.squad.length > 0 ? (
        team.squad.map((player) => (
          <Link key={player.id} to={`/players/${player.id}`}>
            <Card className="hover:border-blue-500 hover:shadow-md transition-all h-full cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="h-12 w-12 rounded-full object-cover bg-slate-100 shadow-sm border border-slate-100" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500">
                    {player.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-sm">{player.name}</h4>
                  <div className="flex gap-2 text-xs text-slate-500 mt-1">
                    {player.number && <span>#{player.number}</span>}
                    <span>•</span>
                    <span>{player.position}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      ) : (
        <div className="col-span-full rounded-lg bg-slate-50 p-8 text-center text-slate-500">
          Squad information is not available.
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Team Header */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="h-32 bg-slate-900"></div>
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-12 sm:-mt-16">
            <div className="rounded-xl bg-white p-2 shadow-lg shrink-0">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="h-24 w-24 object-contain sm:h-32 sm:w-32" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center bg-slate-100 text-3xl font-bold sm:h-32 sm:w-32">
                  {team.shortName}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-slate-500">
                {team.venue && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{team.venue}</span>
                  </div>
                )}
                {team.founded && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Est. {team.founded}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-2">
              <button className="rounded-full bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
                Follow
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
