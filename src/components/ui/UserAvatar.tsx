import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function getUserAvatarUrl(name?: string | null, email?: string | null, avatarUrl?: string | null): string {
  if (avatarUrl && avatarUrl.trim() !== '') {
    return avatarUrl;
  }
  const seed = (name && name.trim() !== '') ? name.trim() : (email && email.trim() !== '') ? email.trim() : 'User';
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e11d48,0f172a,0284c7,059669,7c3aed`;
}

export function UserAvatar({
  name,
  email,
  avatarUrl,
  className,
  size = 'md'
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg'
  };

  const initial = ((name || email || 'U').trim().charAt(0) || 'U').toUpperCase();
  const effectiveUrl = !imgError ? getUserAvatarUrl(name, email, avatarUrl) : null;

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden shrink-0 border border-slate-200/80 bg-slate-100 flex items-center justify-center font-black select-none shadow-2xs',
        sizeClasses[size],
        className
      )}
    >
      {effectiveUrl ? (
        <img
          src={effectiveUrl}
          alt={name || email || 'User Profile Picture'}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-tr from-rose-600 via-rose-500 to-red-600 text-white flex items-center justify-center font-black">
          {initial}
        </div>
      )}
    </div>
  );
}
