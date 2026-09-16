import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { insforge } from '../lib/insforge';

interface NotificationContextType {
  followedMatches: string[];
  toggleFollowMatch: (matchId: string, matchTitle: string) => void;
  isFollowing: (matchId: string) => boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [followedMatches, setFollowedMatches] = useState<string[]>(() => {
    const stored = localStorage.getItem('followedMatches');
    return stored ? JSON.parse(stored) : [];
  });
  const [matchTitles, setMatchTitles] = useState<Record<string, string>>(() => {
    const stored = localStorage.getItem('matchTitles');
    return stored ? JSON.parse(stored) : {};
  });
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(() => {
    return localStorage.getItem('lastNotificationId');
  });

  useEffect(() => {
    localStorage.setItem('followedMatches', JSON.stringify(followedMatches));
    localStorage.setItem('matchTitles', JSON.stringify(matchTitles));
    if (lastNotificationId) localStorage.setItem('lastNotificationId', lastNotificationId);
  }, [followedMatches, matchTitles, lastNotificationId]);

  // Global App Notifications Polling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const fetchGlobalNotifications = async () => {
      try {
        const { data, error } = await insforge.database
          .from('app_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          // Ignore timeouts, network failures, and missing tables silently to avoid console spam
          const isNetworkError = error.message?.includes('timed out') || error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed');
          if (!isNetworkError && error.code !== 'PGRST116') {
            console.error('Error fetching notifications:', error);
          }
        } else if (data && data.length > 0) {
          const latest = data[0];
          
          // Only show if we haven't seen this specific ID before
          if (latest.id !== lastNotificationId) {
            const icon = latest.type === 'alert' ? '🚨' : latest.type === 'success' ? '✅' : latest.type === 'warning' ? '⚠️' : '📢';
            
            if (latest.type === 'alert') {
              toast.error(`${icon} ${latest.title}: ${latest.message}`, { duration: 10000 });
            } else if (latest.type === 'success') {
              toast.success(`${icon} ${latest.title}: ${latest.message}`, { duration: 8000 });
            } else if (latest.type === 'warning') {
              toast.warning(`${icon} ${latest.title}: ${latest.message}`, { duration: 8000 });
            } else {
              toast.info(`${icon} ${latest.title}: ${latest.message}`, { duration: 8000 });
            }
            
            setLastNotificationId(latest.id);
          }
        }
      } catch (e: any) {
        const isNetworkError = e?.message?.includes('timed out') || e?.message?.includes('Failed to fetch') || e?.message?.includes('Network request failed');
        if (!isNetworkError) {
          console.error('Failed to fetch notifications:', e);
        }
      } finally {
        // Schedule next check only after this one completes (prevents pile-up if DB is slow)
        timeoutId = setTimeout(fetchGlobalNotifications, 30000);
      }
    };

    // Initial check
    fetchGlobalNotifications();

    return () => clearTimeout(timeoutId);
  }, [lastNotificationId]);

  const toggleFollowMatch = (matchId: string, matchTitle: string) => {
    setFollowedMatches(prev => {
      if (prev.includes(matchId)) {
        toast.info(`Unfollowed match: ${matchTitle}`);
        return prev.filter(id => id !== matchId);
      } else {
        toast.success(`You will now receive notifications for: ${matchTitle}`);
        setMatchTitles(prevTitles => ({ ...prevTitles, [matchId]: matchTitle }));
        return [...prev, matchId];
      }
    });
  };

  const isFollowing = (matchId: string) => followedMatches.includes(matchId);

  // Simulation logic for random goals/starts
  useEffect(() => {
    if (followedMatches.length === 0) return;

    const interval = setInterval(() => {
      // 10% chance every 15 seconds to get a mock notification for a followed match
      if (Math.random() > 0.9) {
        const randomMatchId = followedMatches[Math.floor(Math.random() * followedMatches.length)];
        const matchTitle = matchTitles[randomMatchId] || 'Unknown Match';
        
        const isGoal = Math.random() > 0.5;
        if (isGoal) {
          const scoringTeam = Math.random() > 0.5 ? matchTitle.split('vs')[0]?.trim() || 'Home' : matchTitle.split('vs')[1]?.trim() || 'Away';
          toast.success(`⚽ GOAL! ${scoringTeam} scores in ${matchTitle}!`, {
            duration: 8000,
            icon: '⚽'
          });
        } else {
          toast.info(`⏱️ Match is about to start: ${matchTitle}`, {
            duration: 8000,
          });
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [followedMatches, matchTitles]);

  return (
    <NotificationContext.Provider value={{ followedMatches, toggleFollowMatch, isFollowing }}>
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
