
import React from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../../types/sports';
import { cn, formatTimeEAT } from '../../lib/utils';
import { Star } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';

interface MatchCardProps {
  match: Match;
  className?: string;
  key?: string | number;
}

export function MatchCard({ match, className }: MatchCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleFavoriteClick = (e: React.MouseEvent, type: 'team' | 'competition', id: string | number, name: string, logo?: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ id: `${type}_${id}`, type, name, logo });
  };

  const compId = `competition_${match.competitionId}`;
  const homeId = `team_${match.homeTeam.id}`;
  const awayId = `team_${match.awayTeam.id}`;

  return (
    <Link 
      to={`/matches/${match.id}`}
      className={cn("flex flex-col relative rounded-[28px] border border-white/60 bg-white/60 backdrop-blur-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden", className)}
    >
      {/* Live Indicator Pill (Centered Top) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        {match.status === 'live' ? (
          <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-red-500 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live {match.matchMinute || ""}
          </div>
        ) : match.status === 'scheduled' ? (
          <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
            {formatTimeEAT(match.startTime)}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between mt-4">
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1 gap-2 z-10">
          {match.homeTeam.logoUrl ? (
            <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="h-12 w-12 object-contain drop-shadow-sm" loading="lazy" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold">
              {match.homeTeam.shortName || match.homeTeam.name.charAt(0)}
            </div>
          )}
          <span className="text-sm font-semibold text-center text-slate-800 leading-tight">
            {match.homeTeam.name}
            <span className="block text-[10px] text-slate-500 font-normal mt-0.5">At Home</span>
          </span>
        </div>

        {/* Central Score Hex/Pill */}
        <div className="flex flex-col items-center justify-center mx-2 z-10">
          <div className="flex items-center justify-center gap-3 rounded-[20px] bg-white px-5 py-3 shadow-sm min-w-[90px]">
            <span className="text-xl font-bold text-slate-900">{match.homeScore !== null ? match.homeScore : '-'}</span>
            <span className="text-lg font-medium text-slate-300">-</span>
            <span className="text-xl font-bold text-slate-900">{match.awayScore !== null ? match.awayScore : '-'}</span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1 gap-2 z-10">
          {match.awayTeam.logoUrl ? (
            <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="h-12 w-12 object-contain drop-shadow-sm" loading="lazy" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold">
              {match.awayTeam.shortName || match.awayTeam.name.charAt(0)}
            </div>
          )}
          <span className="text-sm font-semibold text-center text-slate-800 leading-tight">
            {match.awayTeam.name}
            <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Away</span>
          </span>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-white/40 flex items-center justify-between text-xs font-medium text-slate-500">
         <span className="text-slate-600 truncate max-w-[140px]">{match.competitionName}</span>
         <button 
           onClick={(e) => handleFavoriteClick(e, 'competition', match.competitionId, match.competitionName)}
           className="text-slate-400 hover:text-yellow-500 transition-colors bg-white/50 p-1.5 rounded-full"
         >
           <Star className={cn("h-3.5 w-3.5", isFavorite(compId) && "fill-yellow-500 text-yellow-500")} />
         </button>
      </div>
    </Link>
  );
}
