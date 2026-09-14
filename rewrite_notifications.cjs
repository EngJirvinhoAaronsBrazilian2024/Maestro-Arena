const fs = require('fs');

const code = `import { useEffect, useRef, useState } from 'react';
import { useFavorites } from './useFavorites';
import { useLiveMatches } from '../services/sports/hooks';

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
  const previousScores = useRef<Record<string, { home: number | null, away: number | null }>>({});
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!liveMatches || favorites.length === 0) return;
    
    let newNotifs: AppNotification[] = [];

    liveMatches.forEach(match => {
      const isFav = isFavorite(\`team_\${match.homeTeam.id}\`) || 
                    isFavorite(\`team_\${match.awayTeam.id}\`) || 
                    isFavorite(\`competition_\${match.competitionId}\`);
      
      if (!isFav) return;

      const prev = previousScores.current[match.id];
      if (prev) {
        if (prev.home !== null && match.homeScore !== null && match.homeScore > prev.home) {
          const body = \`\${match.homeTeam.name} scored! They now lead \${match.awayTeam.name} \${match.homeScore}-\${match.awayScore}\`;
          if (Notification.permission === 'granted') new Notification('Goal!', { body });
          newNotifs.push({ id: Math.random().toString(), title: 'Goal!', body, time: Date.now(), read: false });
        }
        if (prev.away !== null && match.awayScore !== null && match.awayScore > prev.away) {
          const body = \`\${match.awayTeam.name} scored! The score is now \${match.homeTeam.name} \${match.homeScore}-\${match.awayScore}\`;
          if (Notification.permission === 'granted') new Notification('Goal!', { body });
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

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAllRead };
}
`;

fs.writeFileSync('src/hooks/useNotificationSystem.ts', code, 'utf8');
