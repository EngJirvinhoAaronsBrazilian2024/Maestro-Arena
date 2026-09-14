import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PlayerAvatarProps {
  playerId?: number | string;
  name?: string;
  photoUrl?: string;
  className?: string;
  fallbackSize?: number;
}

export function PlayerAvatar({ playerId, name, photoUrl, className, fallbackSize = 20 }: PlayerAvatarProps) {
  const [error, setError] = useState(false);
  const url = photoUrl || (playerId ? `https://media.api-sports.io/football/players/${playerId}.png` : null);

  if (error || !url) {
    // Generate initials
    const initials = name 
      ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : null;

    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 text-slate-500 font-bold overflow-hidden rounded-full shadow-inner", className)}>
        {initials ? (
          <span style={{ fontSize: `${fallbackSize}px` }}>{initials}</span>
        ) : (
          <User size={fallbackSize * 1.5} className="text-slate-400 opacity-50" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-full bg-slate-50 border border-slate-200 shadow-sm", className)}>
      <img
        src={url}
        alt={name || 'Player'}
        className="h-full w-full object-cover"
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
}
