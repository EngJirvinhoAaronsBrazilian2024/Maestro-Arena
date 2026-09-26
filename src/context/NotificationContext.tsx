import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { insforge } from '../lib/insforge';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: number;
  read: boolean;
  type?: 'broadcast' | 'news' | 'tip' | 'goal' | 'match' | 'alert' | 'info';
  link?: string;
}

export interface NotificationContextType {
  followedMatches: string[];
  toggleFollowMatch: (matchId: string, matchTitle: string) => void;
  isFollowing: (matchId: string) => boolean;

  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, 'read'> & { read?: boolean }, showToast?: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const MAX_STORED_NOTIFICATIONS = 50;
const JUST_PUBLISHED_WINDOW_MS = 4 * 60 * 1000; // 4 minutes

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Session start tracker
  const sessionStartTime = useRef<number>(Date.now());

  // Followed matches
  const [followedMatches, setFollowedMatches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('followedMatches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [matchTitles, setMatchTitles] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('matchTitles');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persisted notifications inbox (strictly deduplicated by ID to heal any existing duplicate entries in localStorage)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem('user_notifications_inbox');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      const seen = new Set<string>();
      return parsed.filter((item: any) => {
        if (!item || !item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } catch {
      return [];
    }
  });

  // Track IDs that have already shown a popup
  const notifiedIdsRef = useRef<Set<string>>((() => {
    try {
      const stored = localStorage.getItem('notified_update_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  })());

  // Track IDs deleted or cleared by the user so polling doesn't re-add them
  const deletedIdsRef = useRef<Set<string>>((() => {
    try {
      const stored = localStorage.getItem('deleted_notification_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  })());

  // Save followed matches
  useEffect(() => {
    localStorage.setItem('followedMatches', JSON.stringify(followedMatches));
    localStorage.setItem('matchTitles', JSON.stringify(matchTitles));
  }, [followedMatches, matchTitles]);

  // Save inbox notifications
  useEffect(() => {
    const seen = new Set<string>();
    const deduped = notifications.filter(n => {
      if (!n || !n.id || seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
    localStorage.setItem('user_notifications_inbox', JSON.stringify(deduped.slice(0, MAX_STORED_NOTIFICATIONS)));
  }, [notifications]);

  const saveNotifiedIds = useCallback(() => {
    try {
      const idsArray = Array.from(notifiedIdsRef.current).slice(-200);
      localStorage.setItem('notified_update_ids', JSON.stringify(idsArray));
    } catch {
      // ignore
    }
  }, []);

  const saveDeletedIds = useCallback(() => {
    try {
      const idsArray = Array.from(deletedIdsRef.current).slice(-200);
      localStorage.setItem('deleted_notification_ids', JSON.stringify(idsArray));
    } catch {
      // ignore
    }
  }, []);

  // Add notification to inbox with optional immediate popup
  const addNotification = useCallback((
    notif: Omit<AppNotification, 'read'> & { read?: boolean },
    showToast: boolean = false
  ) => {
    if (!notif?.id || deletedIdsRef.current.has(notif.id)) return;

    setNotifications(prev => {
      if (prev.some(item => item.id === notif.id)) return prev;
      const combined = [{ ...notif, read: notif.read ?? false }, ...prev];
      const seen = new Set<string>();
      return combined.filter(item => {
        if (!item || !item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      }).slice(0, MAX_STORED_NOTIFICATIONS);
    });

    if (showToast && !notifiedIdsRef.current.has(notif.id)) {
      notifiedIdsRef.current.add(notif.id);
      saveNotifiedIds();
      toast.info(`${notif.title}: ${notif.body}`, { duration: 3500 });
    }
  }, [saveNotifiedIds]);

  // Check for newly published updates (Admin broadcasts, breaking news articles, betting tips)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const checkPublishedUpdates = async () => {
      try {
        const now = Date.now();
        const incomingNotifs: AppNotification[] = [];

        // 1. Admin Broadcasts (app_notifications)
        let broadcastData: any[] = [];
        try {
          const { data, error } = await insforge.database
            .from('app_notifications')
            .select('id, title, message, type, created_at')
            .order('created_at', { ascending: false })
            .limit(3);
          if (!error && data) broadcastData = data;
        } catch (e) {}

        if (broadcastData.length === 0) {
          try {
            const res = await fetch('/api/admin/notifications');
            if (res.ok) {
              const apiData = await res.json();
              if (Array.isArray(apiData)) broadcastData = apiData.slice(0, 3);
            }
          } catch (e) {}
        }

        if (broadcastData && broadcastData.length > 0) {
          for (const item of broadcastData) {
            const notifId = item.id.startsWith('broadcast_') ? item.id : `broadcast_${item.id}`;
            if (deletedIdsRef.current.has(notifId) || incomingNotifs.some(n => n.id === notifId)) continue;

            const publishedTime = item.created_at ? new Date(item.created_at).getTime() : now;
            const isJustPublished = !isNaN(publishedTime) && (
              publishedTime >= sessionStartTime.current - JUST_PUBLISHED_WINDOW_MS ||
              (now - publishedTime) <= JUST_PUBLISHED_WINDOW_MS
            );

            // If just published and hasn't popped up yet, pop it once
            if (!notifiedIdsRef.current.has(notifId)) {
              if (isJustPublished) {
                const icon = item.type === 'alert' ? '🚨' : item.type === 'warning' ? '⚠️' : item.type === 'success' ? '✅' : '📢';
                if (item.type === 'alert') {
                  toast.error(`${icon} ${item.title}: ${item.message}`, { duration: 4000 });
                } else if (item.type === 'warning') {
                  toast.warning(`${icon} ${item.title}: ${item.message}`, { duration: 3500 });
                } else if (item.type === 'success') {
                  toast.success(`${icon} ${item.title}: ${item.message}`, { duration: 3500 });
                } else {
                  toast.info(`${icon} ${item.title}: ${item.message}`, { duration: 3500 });
                }
              }
              notifiedIdsRef.current.add(notifId);
            }

            incomingNotifs.push({
              id: notifId,
              title: item.title || 'Maestro Announcement',
              body: item.message || '',
              time: publishedTime,
              read: false,
              type: item.type === 'alert' ? 'alert' : 'broadcast'
            });
          }
        }

        // 2. Published News Articles
        const { data: newsData, error: newsErr } = await insforge.database
          .from('articles')
          .select('id, title, published_at, created_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(3);

        if (!newsErr && newsData) {
          for (const article of newsData) {
            const notifId = article.id.startsWith('news_') ? article.id : `news_${article.id}`;
            if (deletedIdsRef.current.has(notifId) || incomingNotifs.some(n => n.id === notifId)) continue;

            const publishedTime = article.published_at 
              ? new Date(article.published_at).getTime() 
              : (article.created_at ? new Date(article.created_at).getTime() : now);

            const isJustPublished = !isNaN(publishedTime) && (
              publishedTime >= sessionStartTime.current - JUST_PUBLISHED_WINDOW_MS ||
              (now - publishedTime) <= JUST_PUBLISHED_WINDOW_MS
            );

            if (!notifiedIdsRef.current.has(notifId)) {
              if (isJustPublished) {
                toast.info(`📰 Breaking News: ${article.title}`, { duration: 3500 });
              }
              notifiedIdsRef.current.add(notifId);
            }

            incomingNotifs.push({
              id: notifId,
              title: 'New Article Published',
              body: article.title,
              time: publishedTime,
              read: false,
              type: 'news',
              link: `/news/${article.id}`
            });
          }
        }

        // 3. Betting Tips
        const { data: tipsData, error: tipsErr } = await insforge.database
          .from('tips')
          .select('id, category, matches, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        if (!tipsErr && tipsData) {
          for (const tip of tipsData) {
            const notifId = tip.id.startsWith('tip_') ? tip.id : `tip_${tip.id}`;
            if (deletedIdsRef.current.has(notifId) || incomingNotifs.some(n => n.id === notifId)) continue;

            const publishedTime = tip.created_at ? new Date(tip.created_at).getTime() : now;
            const isJustPublished = !isNaN(publishedTime) && (
              publishedTime >= sessionStartTime.current - JUST_PUBLISHED_WINDOW_MS ||
              (now - publishedTime) <= JUST_PUBLISHED_WINDOW_MS
            );

            if (!notifiedIdsRef.current.has(notifId)) {
              if (isJustPublished) {
                toast.info(`🎯 New ${tip.category?.toUpperCase() || ''} Tip Available!`, { duration: 3500 });
              }
              notifiedIdsRef.current.add(notifId);
            }

            incomingNotifs.push({
              id: notifId,
              title: 'New Betting Tip',
              body: `A fresh ${tip.category?.toUpperCase() || ''} prediction has been posted.`,
              time: publishedTime,
              read: false,
              type: 'tip',
              link: '/tips'
            });
          }
        }

        saveNotifiedIds();

        // Update notifications inbox with incoming items that aren't already present
        if (incomingNotifs.length > 0 && isMounted) {
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const freshItems = incomingNotifs.filter(n => !existingIds.has(n.id));
            if (freshItems.length === 0) return prev;
            const combined = [...freshItems, ...prev];
            const seen = new Set<string>();
            const deduped = combined.filter(n => {
              if (!n || !n.id || seen.has(n.id)) return false;
              seen.add(n.id);
              return true;
            });
            return deduped.slice(0, MAX_STORED_NOTIFICATIONS);
          });
        }
      } catch (err) {
        // Silently ignore background polling glitches
      } finally {
        if (isMounted) {
          timeoutId = setTimeout(checkPublishedUpdates, 30000); // Check every 30 seconds
        }
      }
    };

    checkPublishedUpdates();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [saveNotifiedIds]);

  // Follow / Unfollow Match
  const toggleFollowMatch = useCallback((matchId: string, matchTitle: string) => {
    setFollowedMatches(prev => {
      if (prev.includes(matchId)) {
        toast.info(`Unfollowed match: ${matchTitle}`, { duration: 2500 });
        return prev.filter(id => id !== matchId);
      } else {
        toast.success(`You will now receive notifications for: ${matchTitle}`, { duration: 2500 });
        setMatchTitles(prevTitles => ({ ...prevTitles, [matchId]: matchTitle }));
        return [...prev, matchId];
      }
    });
  }, []);

  const isFollowing = useCallback((matchId: string) => followedMatches.includes(matchId), [followedMatches]);

  // Mark all notifications as read
  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Mark a single notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  // Delete notification one by one
  const deleteNotification = useCallback((id: string) => {
    deletedIdsRef.current.add(id);
    saveDeletedIds();
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, [saveDeletedIds]);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    // Register all current IDs as deleted to prevent immediate polling re-addition
    setNotifications(prev => {
      prev.forEach(item => deletedIdsRef.current.add(item.id));
      saveDeletedIds();
      return [];
    });
    toast.success('All notifications cleared', { duration: 2000 });
  }, [saveDeletedIds]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      followedMatches,
      toggleFollowMatch,
      isFollowing,
      notifications,
      unreadCount,
      markAllRead,
      markAsRead,
      deleteNotification,
      clearAllNotifications,
      addNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
