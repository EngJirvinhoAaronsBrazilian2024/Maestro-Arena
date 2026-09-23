
import React from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../../types/sports';
import { cn, formatTimeEAT } from '../../lib/utils';
import { Star, Bell } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';

interface MatchCardProps {
  match: Match;
  className?: string;
  key?: string | number;
}

export function MatchCard({ match, className }: MatchCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleFavoriteClick = (e: React.MouseEvent, type: 'team' | 'competition' | 'match', id: string | number, name: string, logo?: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ id: `${type}_${id}`, type, name, logo });
  };

  const compId = `competition_${match.competitionId}`;
  const homeId = `team_${match.homeTeam.id}`;
  const awayId = `team_${match.awayTeam.id}`;
  const matchFavoriteId = `match_${match.id}`;


  return (
    <Link 
      to={`/matches/${match.id}`}
      className={cn("flex flex-col relative rounded-[28px] border border-white/80 bg-white/70 backdrop-blur-xl p-5 shadow-[0_8px_32px_rgba(15,23,42,0.04)] hover:border-rose-200/80 hover:shadow-[0_12px_36px_rgba(225,29,72,0.08)] transition-all overflow-hidden group", className)}
    >
      {/* Live Indicator Pill (Centered Top) */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-10">
        {match.status === 'live' ? (
          <div className="flex items-center gap-1.5 rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1 text-[10px] font-black text-cyan-800 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="uppercase tracking-wider">Live {match.matchMinute || ""}</span>
          </div>
        ) : match.status === 'scheduled' ? (
          <div className="flex items-center gap-1 rounded-full bg-white/90 border border-slate-200/80 px-3 py-1 text-[10px] font-bold text-slate-600 shadow-xs">
            {formatTimeEAT(match.startTime)}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between mt-4">
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1 gap-2 z-10">
          {match.homeTeam?.logoUrl ? (
            <img src={match.homeTeam.logoUrl} alt={match.homeTeam?.name || 'Home'} className="h-12 w-12 object-contain drop-shadow-xs transition-transform group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-lg font-bold">
              {match.homeTeam?.shortName || (match.homeTeam?.name ? match.homeTeam.name.charAt(0) : 'H')}
            </div>
          )}
          <span className="text-sm font-bold text-center text-slate-900 leading-tight group-hover:text-rose-600 transition-colors">
            {match.homeTeam?.name || 'Home'}
            <span className="block text-[10px] text-slate-500 font-medium mt-0.5">Home</span>
          </span>
        </div>

        {/* Central Score Hex/Pill */}
        <div className="flex flex-col items-center justify-center mx-2 z-10">
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white/95 border border-slate-200/80 px-4 py-2.5 shadow-xs min-w-[88px]">
            <span className="text-xl font-black text-slate-950">{match.homeScore !== null && match.homeScore !== undefined ? match.homeScore : '-'}</span>
            <span className="text-base font-semibold text-slate-300">:</span>
            <span className="text-xl font-black text-slate-950">{match.awayScore !== null && match.awayScore !== undefined ? match.awayScore : '-'}</span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1 gap-2 z-10">
          {match.awayTeam?.logoUrl ? (
            <img src={match.awayTeam.logoUrl} alt={match.awayTeam?.name || 'Away'} className="h-12 w-12 object-contain drop-shadow-xs transition-transform group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-lg font-bold">
              {match.awayTeam?.shortName || (match.awayTeam?.name ? match.awayTeam.name.charAt(0) : 'A')}
            </div>
          )}
          <span className="text-sm font-bold text-center text-slate-900 leading-tight group-hover:text-rose-600 transition-colors">
            {match.awayTeam?.name || 'Away'}
            <span className="block text-[10px] text-slate-500 font-medium mt-0.5">Away</span>
          </span>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-500">
         <span className="text-slate-600 font-semibold truncate max-w-[140px]">{match.competitionName}</span>
         
         <div className="flex items-center gap-1.5">
           <button 
             onClick={(e) => handleFavoriteClick(e, 'match', match.id, `${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}`)}
             className={cn(
               "transition-colors p-1.5 rounded-full border cursor-pointer",
               isFavorite(matchFavoriteId) 
                 ? "bg-rose-50 border-rose-200 text-rose-600 shadow-2xs" 
                 : "bg-white/80 border-slate-200/60 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50"
             )}
             title="Follow Match"
           >
             <Bell className={cn("h-3.5 w-3.5", isFavorite(matchFavoriteId) && "fill-rose-500 text-rose-500")} />
           </button>
           
           <button 
             onClick={(e) => handleFavoriteClick(e, 'competition', match.competitionId, match.competitionName)}
             className={cn(
               "transition-colors p-1.5 rounded-full border cursor-pointer",
               isFavorite(compId) 
                 ? "bg-amber-50 border-amber-200 text-amber-600 shadow-2xs" 
                 : "bg-white/80 border-slate-200/60 text-slate-400 hover:text-amber-500 hover:bg-amber-50/50"
             )}
             title="Favorite Competition"
           >
             <Star className={cn("h-3.5 w-3.5", isFavorite(compId) && "fill-amber-500 text-amber-500")} />
           </button>
         </div>
      </div>
    </Link>
  );
}
