import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export interface FavoriteItem {
  id: string; // e.g. "team_33"
  type: 'team' | 'competition' | 'player';
  name: string;
  logo?: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    const stored = localStorage.getItem(`favorites_${user.id}`);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    } else {
      setFavorites([]);
    }
  }, [user]);

  const toggleFavorite = (item: FavoriteItem) => {
    if (!user) return;
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id);
      let updated;
      if (exists) {
        updated = prev.filter(f => f.id !== item.id);
      } else {
        updated = [...prev, item];
      }
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (id: string) => favorites.some(f => f.id === id);

  return { favorites, toggleFavorite, isFavorite };
}
