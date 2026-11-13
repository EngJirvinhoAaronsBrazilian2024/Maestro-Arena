
import React from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../../types/sports';
import { cn, formatTimeEAT } from '../../lib/utils';
import { Star, Bell, BellRing } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';
import { useNotifications } from '../../context/NotificationContext';

interface MatchCardProps {
  match: Match;
  className?: string;
  key?: string | number;
  onSelectMatch?: (match: Match) => void;
  isSelected?: boolean;
}

export function MatchCard({ match, className, onSelectMatch, isSelected }: MatchCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toggleFollowMatch, isFollowing } = useNotifications();

  const handleFavoriteClick = (e: React.MouseEvent, type: 'team' | 'competition' | 'match', id: string | number, name: string, logo?: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ id: `${type}_${id}`, type, name, logo });
  };

  const handleAlertToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const label = `${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}`;
    toggleFollowMatch(String(match.id), label);
  };

  const compId = `competition_${match.competitionId}`;
  const matchFavoriteId = `match_${match.id}`;
  const isAlertOn = isFollowing(String(match.id)) || isFavorite(matchFavoriteId);

  const cardClasses = cn(
    "flex flex-col relative rounded-[28px] border bg-white/70 backdrop-blur-md p-5 border-white/60 shadow-[0_8px_32px_rgba(15,23,42,0.04)] hover:shadow-emerald-500/10 hover:border-emerald-300/60 transition-all overflow-hidden group text-left",
    isSelected
      ? "border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/20 shadow-[0_12px_36px_rgba(16,185,129,0.15)]"
      : "hover:border-emerald-300/80",
    className
  );

  const cardContent = (
    <>
      {/* Dynamic Live Match Clock Badge / Status Ribbon (Centered Top) */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-10">
        {match.status === 'live' ? (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50/95 border border-emerald-300/80 px-3 py-1 text-[10px] font-black text-emerald-800 shadow-[0_0_12px_rgba(16,185,129,0.35)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="uppercase tracking-wider font-mono">
              {match.matchMinute ? `${match.matchMinute}' • ` : ''}LIVE
            </span>
          </div>
        ) : match.status === 'scheduled' ? (
          <div className="flex items-center gap-1 rounded-full bg-slate-50/90 border border-slate-200/80 px-3 py-1 text-[10px] font-bold text-slate-700 shadow-2xs backdrop-blur-md">
            {formatTimeEAT(match.startTime)}
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-full bg-slate-100/90 border border-slate-200/80 px-3 py-1 text-[10px] font-black uppercase text-slate-800 shadow-2xs backdrop-blur-md">
            Full Time
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        {/* Home Team: Name Above Badge */}
        <div className="flex flex-col items-center flex-1 gap-1.5 z-10 px-1 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-center text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors truncate max-w-full">
            {match.homeTeam?.name || 'Home'}
          </span>
          {match.homeTeam?.logoUrl ? (
            <img src={match.homeTeam.logoUrl} alt={match.homeTeam?.name || 'Home'} className="h-14 w-14 sm:h-16 sm:w-16 object-contain drop-shadow-xs transition-transform group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 text-lg font-bold">
              {match.homeTeam?.shortName || (match.homeTeam?.name ? match.homeTeam.name.charAt(0) : 'H')}
            </div>
          )}
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Home</span>
        </div>

        {/* Central Glassmorphic Score Ribbon */}
        <div className="flex flex-col items-center justify-center mx-2 z-10 shrink-0">
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white/75 backdrop-blur-md border border-white/60 px-4 py-2.5 shadow-xs hover:shadow-emerald-500/10 transition-shadow min-w-[88px]">
            <span className="text-xl font-black text-slate-950 font-mono">{match.homeScore !== null && match.homeScore !== undefined ? match.homeScore : '-'}</span>
            <span className="text-base font-semibold text-slate-300">:</span>
            <span className="text-xl font-black text-slate-950 font-mono">{match.awayScore !== null && match.awayScore !== undefined ? match.awayScore : '-'}</span>
          </div>
          {onSelectMatch && (
            <span className="mt-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider group-hover:underline">
              Match Centre
            </span>
          )}
        </div>


        {/* Away Team: Name Above Badge */}
        <div className="flex flex-col items-center flex-1 gap-1.5 z-10 px-1 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-center text-slate-900 leading-tight group-hover:text-rose-600 transition-colors truncate max-w-full">
            {match.awayTeam?.name || 'Away'}
          </span>
          {match.awayTeam?.logoUrl ? (
            <img src={match.awayTeam.logoUrl} alt={match.awayTeam?.name || 'Away'} className="h-14 w-14 sm:h-16 sm:w-16 object-contain drop-shadow-xs transition-transform group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 text-lg font-bold">
              {match.awayTeam?.shortName || (match.awayTeam?.name ? match.awayTeam.name.charAt(0) : 'A')}
            </div>
          )}
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Away</span>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-500">
         <span className="text-slate-700 font-bold truncate max-w-[140px]">{match.competitionName}</span>
         
         <div className="flex items-center gap-1.5">
           <button 
             onClick={handleAlertToggle}
             className={cn(
               "transition-colors p-1.5 rounded-full border cursor-pointer",
               isAlertOn 
                 ? "bg-rose-50 border-rose-200 text-rose-600 shadow-2xs" 
                 : "bg-white/80 border-slate-200/60 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50"
             )}
             title={isAlertOn ? "Match alerts enabled" : "Enable match reminders & goal alerts"}
           >
             {isAlertOn ? (
               <BellRing className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
             ) : (
               <Bell className="h-3.5 w-3.5" />
             )}
           </button>
           
           <button 
             onClick={(e) => handleFavoriteClick(e, 'competition', match.competitionId, match.competitionName || 'Competition')}
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
    </>
  );

  if (onSelectMatch) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectMatch(match)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectMatch(match);
          }
        }}
        className={cn(cardClasses, "cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500")}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link 
      to={`/matches/${match.id}`}
      className={cardClasses}
    >
      {cardContent}
    </Link>
  );
}
