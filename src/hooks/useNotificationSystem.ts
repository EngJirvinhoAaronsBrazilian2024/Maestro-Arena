import { useEffect, useRef } from 'react';
import { useFavorites } from './useFavorites';
import { useLiveMatches, useUpcomingMatches } from '../services/sports/hooks';
import { useNotifications, AppNotification } from '../context/NotificationContext';

export type { AppNotification };

export function useNotificationSystem() {
  const { 
    notifications, 
    unreadCount, 
    markAllRead, 
    markAsRead, 
    deleteNotification, 
    clearAllNotifications, 
    addNotification 
  } = useNotifications();

  const { favorites, isFavorite } = useFavorites();
  const { matches: liveMatches } = useLiveMatches();
  const { matches: upcomingMatches } = useUpcomingMatches();
  
  const previousScores = useRef<Record<string, { home: number | null, away: number | null }>>({});
  const notifiedUpcoming = useRef<Set<string>>(new Set());

  // Request browser permission for system notifications if supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Goal Notifications (Live Matches for favorited teams/matches)
  useEffect(() => {
    if (!liveMatches || favorites.length === 0) return;

    liveMatches.forEach(match => {
      const isFav = isFavorite(`team_${match.homeTeam.id}`) || 
                    isFavorite(`team_${match.awayTeam.id}`) || 
                    isFavorite(`competition_${match.competitionId}`) ||
                    isFavorite(`match_${match.id}`);
      
      if (!isFav) return;

      const prev = previousScores.current[match.id];
      if (prev) {
        if (prev.home !== null && match.homeScore !== null && match.homeScore > prev.home) {
          const body = `${match.homeTeam.name} scored! They lead ${match.awayTeam.name} ${match.homeScore}-${match.awayScore}`;
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Goal!', { body });
          }
          addNotification({
            id: `goal_${match.id}_${match.homeScore}_${match.awayScore}_home`,
            title: '⚽ GOAL!',
            body,
            time: Date.now(),
            type: 'goal',
            link: `/match/${match.id}`
          }, true);
        }
        if (prev.away !== null && match.awayScore !== null && match.awayScore > prev.away) {
          const body = `${match.awayTeam.name} scored! The score is ${match.homeTeam.name} ${match.homeScore}-${match.awayScore}`;
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Goal!', { body });
          }
          addNotification({
            id: `goal_${match.id}_${match.homeScore}_${match.awayScore}_away`,
            title: '⚽ GOAL!',
            body,
            time: Date.now(),
            type: 'goal',
            link: `/match/${match.id}`
          }, true);
        }
      }

      previousScores.current[match.id] = {
        home: match.homeScore,
        away: match.awayScore
      };
    });
  }, [liveMatches, favorites, isFavorite, addNotification]);

  // Match Starting Soon Notifications (Upcoming Matches)
  useEffect(() => {
    if (!upcomingMatches || favorites.length === 0) return;

    const now = Date.now();
    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    upcomingMatches.forEach(match => {
      const isFav = isFavorite(`team_${match.homeTeam.id}`) || 
                    isFavorite(`team_${match.awayTeam.id}`) || 
                    isFavorite(`competition_${match.competitionId}`) ||
                    isFavorite(`match_${match.id}`);
      
      if (!isFav || notifiedUpcoming.current.has(match.id)) return;

      const timeUntilStart = match.startTime - now;
      
      if (timeUntilStart > 0 && timeUntilStart <= FIFTEEN_MINUTES) {
        const body = `${match.homeTeam.name} vs ${match.awayTeam.name} starts in less than 15 minutes!`;
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Match Starting Soon', { body });
        }
        addNotification({
          id: `match_start_${match.id}`,
          title: '⏱️ Kick-Off Approaching',
          body,
          time: Date.now(),
          type: 'match',
          link: `/match/${match.id}`
        }, true);

        notifiedUpcoming.current.add(match.id);
      }
    });
  }, [upcomingMatches, favorites, isFavorite, addNotification]);

  return { 
    notifications, 
    unreadCount, 
    markAllRead, 
    markAsRead, 
    deleteNotification, 
    clearAllNotifications, 
    addNotification 
  };
}
