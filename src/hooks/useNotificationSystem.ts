import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useFavorites } from './useFavorites';
import { useLiveMatches, useUpcomingMatches } from '../services/sports/hooks';
import { insforge } from '../lib/insforge';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: number;
  read: boolean;
}

export function useNotificationSystem() {
  const { favorites, isFavorite } = useFavorites();
  const { matches: liveMatches } = useLiveMatches();
  const { matches: upcomingMatches } = useUpcomingMatches();
  
  const previousScores = useRef<Record<string, { home: number | null, away: number | null }>>({});
  const notifiedUpcoming = useRef<Set<string>>(new Set());
  
  // Local storage persisted inbox
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem('user_notifications_inbox');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [lastArticleId, setLastArticleId] = useState<string | null>(() => localStorage.getItem('last_seen_article'));
  const [lastTipId, setLastTipId] = useState<string | null>(() => localStorage.getItem('last_seen_tip'));

  useEffect(() => {
    localStorage.setItem('user_notifications_inbox', JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  useEffect(() => {
    if (lastArticleId) localStorage.setItem('last_seen_article', lastArticleId);
    if (lastTipId) localStorage.setItem('last_seen_tip', lastTipId);
  }, [lastArticleId, lastTipId]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Poll for New Articles and Betting Tips
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const pollNewsAndTips = async () => {
      try {
        let newNotifs: AppNotification[] = [];

        // 1. Fetch Global App Notifications (Admin Broadcasts)
        const { data: globalData, error: globalErr } = await insforge.database
          .from('app_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (!globalErr && globalData && globalData.length > 0) {
          const latestGlobal = globalData[0];
          // We check localStorage directly to see if this global broadcast ID was already processed
          const lastGlobalId = localStorage.getItem('last_seen_global_broadcast');
          
          if (latestGlobal.id !== lastGlobalId) {
             if (lastGlobalId !== null) { // Skip alert on very first load of app for older messages
                newNotifs.push({
                  id: `broadcast_${latestGlobal.id}`,
                  title: `📢 ${latestGlobal.title}`,
                  body: latestGlobal.message,
                  time: Date.now(),
                  read: false
                });
             }
             localStorage.setItem('last_seen_global_broadcast', latestGlobal.id);
          }
        }

        // 2. Fetch latest published article
        const { data: newsData, error: newsErr } = await insforge.database
          .from('articles')
          .select('id, title')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(1);

        if (!newsErr && newsData && newsData.length > 0) {
          const latestArticle = newsData[0];
          if (latestArticle.id !== lastArticleId) {
            if (lastArticleId !== null) { // Skip alert on first load
              const body = latestArticle.title;
              toast(`📰 Breaking News: ${body}`);
              newNotifs.push({
                id: `news_${latestArticle.id}`,
                title: 'New Article Published',
                body: body,
                time: Date.now(),
                read: false
              });
            }
            setLastArticleId(latestArticle.id);
          }
        }

        // Fetch latest tip
        const { data: tipsData, error: tipsErr } = await insforge.database
          .from('tips')
          .select('id, category')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!tipsErr && tipsData && tipsData.length > 0) {
          const latestTip = tipsData[0];
          if (latestTip.id !== lastTipId) {
            if (lastTipId !== null) {
              const body = `A new ${latestTip.category.toUpperCase()} betting tip has been posted.`;
              toast(`🎯 New Tip Available!`);
              newNotifs.push({
                id: `tip_${latestTip.id}`,
                title: 'New Betting Tip',
                body: body,
                time: Date.now(),
                read: false
              });
            }
            setLastTipId(latestTip.id);
          }
        }

        if (newNotifs.length > 0) {
          setNotifications(prev => [...newNotifs, ...prev].slice(0, 50));
        }
      } catch (e) {
        // ignore errors silently in background
      } finally {
        timeoutId = setTimeout(pollNewsAndTips, 15000); // Check every 15 seconds
      }
    };

    pollNewsAndTips();
    return () => clearTimeout(timeoutId);
  }, [lastArticleId, lastTipId]);

  // Goal Notifications (Live Matches)
  useEffect(() => {
    if (!liveMatches || favorites.length === 0) return;
    
    let newNotifs: AppNotification[] = [];

    liveMatches.forEach(match => {
      const isFav = isFavorite(`team_${match.homeTeam.id}`) || 
                    isFavorite(`team_${match.awayTeam.id}`) || 
                    isFavorite(`competition_${match.competitionId}`) ||
                    isFavorite(`match_${match.id}`);
      
      if (!isFav) return;

      const prev = previousScores.current[match.id];
      if (prev) {
        if (prev.home !== null && match.homeScore !== null && match.homeScore > prev.home) {
          const body = `${match.homeTeam.name} scored! They now lead ${match.awayTeam.name} ${match.homeScore}-${match.awayScore}`;
          if (Notification.permission === 'granted') new Notification('Goal!', { body });
          toast.success(body, { icon: '⚽', duration: 5000 });
          newNotifs.push({ id: Math.random().toString(), title: 'Goal!', body, time: Date.now(), read: false });
        }
        if (prev.away !== null && match.awayScore !== null && match.awayScore > prev.away) {
          const body = `${match.awayTeam.name} scored! The score is now ${match.homeTeam.name} ${match.homeScore}-${match.awayScore}`;
          if (Notification.permission === 'granted') new Notification('Goal!', { body });
          toast.success(body, { icon: '⚽', duration: 5000 });
          newNotifs.push({ id: Math.random().toString(), title: 'Goal!', body, time: Date.now(), read: false });
        }
      }

      previousScores.current[match.id] = {
        home: match.homeScore,
        away: match.awayScore
      };
    });

    if (newNotifs.length > 0) {
      setNotifications(prev => [...newNotifs, ...prev].slice(0, 20));
    }
  }, [liveMatches, favorites, isFavorite]);

  // Match Starting Soon Notifications (Upcoming Matches)
  useEffect(() => {
    if (!upcomingMatches || favorites.length === 0) return;

    let newNotifs: AppNotification[] = [];
    const now = Date.now();
    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    upcomingMatches.forEach(match => {
      const isFav = isFavorite(`team_${match.homeTeam.id}`) || 
                    isFavorite(`team_${match.awayTeam.id}`) || 
                    isFavorite(`competition_${match.competitionId}`) ||
                    isFavorite(`match_${match.id}`);
      
      if (!isFav || notifiedUpcoming.current.has(match.id)) return;

      // Start time is in milliseconds
      const timeUntilStart = match.startTime - now;
      
      // Notify if starting within the next 15 minutes
      if (timeUntilStart > 0 && timeUntilStart <= FIFTEEN_MINUTES) {
        const body = `${match.homeTeam.name} vs ${match.awayTeam.name} is starting soon!`;
        if (Notification.permission === 'granted') new Notification('Match Starting Soon', { body });
        toast(body, { icon: '⏰', duration: 5000 });
        
        newNotifs.push({ id: Math.random().toString(), title: 'Match Starting Soon', body, time: Date.now(), read: false });
        notifiedUpcoming.current.add(match.id);
      }
    });

    if (newNotifs.length > 0) {
      setNotifications(prev => [...newNotifs, ...prev].slice(0, 20));
    }
  }, [upcomingMatches, favorites, isFavorite]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAllRead };
}
