import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { syncPushPreferences } from '../lib/pushClient';

export interface FavoriteItem {
  id: string; // e.g. "team_33" or "competition_2001"
  type: 'team' | 'competition' | 'player' | 'match';
  name: string;
  logo?: string;
}

const FAVORITES_UPDATED_EVENT = 'sportshub_favorites_updated';

export function normalizeEntityName(name: string): string {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(fc|cf|sc|afc|ac|as|fk|cd|ud|rcd|sd|sv|vfb|tsg|bv|ss|us|ogc|osc)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function doesFavoriteMatchName(favName: string, targetName?: string): boolean {
  if (!favName || !targetName) return false;
  const a = normalizeEntityName(favName);
  const b = normalizeEntityName(targetName);
  if (!a || !b) return false;
  if (a === b) return true;

  // Common team aliases
  const aliases: Record<string, string[]> = {
    'manchester united': ['man united', 'man utd'],
    'manchester city': ['man city'],
    'tottenham': ['spurs', 'tottenham hotspur'],
    'wolves': ['wolverhampton', 'wolverhampton wanderers'],
    'psg': ['paris saint germain', 'paris sg'],
    'inter milan': ['internazionale', 'inter'],
    'ac milan': ['milan'],
    'bayern munich': ['bayern munchen', 'bayern'],
    'atletico madrid': ['atleti', 'atletico'],
    'real madrid': ['real madrid'],
    'barcelona': ['barca'],
    'athletic club': ['athletic bilbao'],
    'borussia dortmund': ['dortmund', 'bvb'],
    'bayer leverkusen': ['leverkusen'],
    'premier league': ['english premier league'],
    'la liga': ['spanish laliga', 'primera division'],
    'champions league': ['uefa champions league'],
    'europa league': ['uefa europa league'],
    'serie a': ['italian serie a'],
    'bundesliga': ['german bundesliga'],
    'ligue 1': ['french ligue 1'],
    'afcon': ['africa cup of nations'],
  };

  for (const [canonical, alts] of Object.entries(aliases)) {
    const group = [canonical, ...alts];
    const aIn = group.some((g) => a === g || a.includes(g));
    const bIn = group.some((g) => b === g || b.includes(g));
    if (aIn && bIn) return true;
  }

  return (a.length >= 4 && b.includes(a)) || (b.length >= 4 && a.includes(b));
}

export function isFavoriteTeamOrCompMatch(
  favorites: FavoriteItem[],
  opts: {
    homeName?: string;
    awayName?: string;
    competitionName?: string;
    homeId?: string | number;
    awayId?: string | number;
    competitionId?: string | number;
  }
): FavoriteItem | undefined {
  return favorites.find((fav) => {
    if (fav.type === 'team') {
      if (opts.homeId !== undefined && (fav.id === `team_${opts.homeId}` || fav.id === String(opts.homeId))) return true;
      if (opts.awayId !== undefined && (fav.id === `team_${opts.awayId}` || fav.id === String(opts.awayId))) return true;
      if (doesFavoriteMatchName(fav.name, opts.homeName) || doesFavoriteMatchName(fav.name, opts.awayName)) return true;
    }
    if (fav.type === 'competition') {
      if (opts.competitionId !== undefined && (fav.id === `competition_${opts.competitionId}` || fav.id === String(opts.competitionId))) return true;
      if (doesFavoriteMatchName(fav.name, opts.competitionName)) return true;
    }
    return false;
  });
}

export function useFavorites() {
  const { user } = useAuth();
  const storageKey = user ? `favorites_${user.id}` : 'favorites_guest';

  const readFavorites = useCallback((): FavoriteItem[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => readFavorites());

  useEffect(() => {
    setFavorites(readFavorites());
    const handleSync = () => setFavorites(readFavorites());
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [readFavorites]);

  const saveFavorites = useCallback((updated: FavoriteItem[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
    } catch {
      // ignore storage errors
    }
  }, [storageKey]);

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    const current = readFavorites();
    const exists = current.some(f => f.id === item.id || (f.type === item.type && normalizeEntityName(f.name) === normalizeEntityName(item.name)));
    const updated = exists
      ? current.filter(f => f.id !== item.id && !(f.type === item.type && normalizeEntityName(f.name) === normalizeEntityName(item.name)))
      : [...current, item];
    setFavorites(updated);
    saveFavorites(updated);
    void syncPushPreferences({
      userId: user?.id,
      favorites: updated.map(f => ({ id: f.id, type: f.type, name: f.name })),
    });
    toast.success(exists ? `Unpinned ${item.name}` : `Pinned ${item.name} to your feed`, { duration: 2000 });
  }, [readFavorites, saveFavorites, user?.id]);

  const isFavorite = useCallback((id: string, name?: string, type?: FavoriteItem['type']) => {
    return favorites.some(f =>
      f.id === id ||
      (name && (!type || f.type === type) && doesFavoriteMatchName(f.name, name))
    );
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
