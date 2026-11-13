import { useEffect, useRef } from 'react';
import { useFavorites, isFavoriteTeamOrCompMatch } from './useFavorites';
import { useLiveMatches, useUpcomingMatches } from '../services/sports/hooks';
import { useFootballMatches } from './useFootballMatches';
import { useNotifications, AppNotification } from '../context/NotificationContext';

export type { AppNotification };

interface TrackedMatchState {
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  statusLabel: string;
  minute?: string;
}

export function useNotificationSystem() {
  const {
    notifications,
    unreadCount,
    markAllRead,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
    followedMatches,
    isFollowing,
  } = useNotifications();

  const { favorites, isFavorite } = useFavorites();
  const { matches: liveMatches } = useLiveMatches();
  const { matches: upcomingMatches } = useUpcomingMatches();
  const { matches: footballMatches } = useFootballMatches();

  const previousScores = useRef<Record<string, { home: number | null; away: number | null }>>({});
  const previousNormalizedState = useRef<Record<string, TrackedMatchState>>({});
  const notifiedKeys = useRef<Set<string>>(new Set());

  // Check NormalizedMatch list (/api/matches) for 15-min Kick-Off, Goals, Half-Time, and Full-Time alerts
  useEffect(() => {
    if (!footballMatches || footballMatches.length === 0) return;

    const now = Date.now();
    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    footballMatches.forEach((match) => {
      const matchIdStr = String(match.id);
      const isMatchFollowed =
        isFollowing(matchIdStr) ||
        isFollowing(`match_${matchIdStr}`) ||
        isFavorite(`match_${matchIdStr}`);

      const favMatch = isFavoriteTeamOrCompMatch(favorites, {
        homeName: match.homeTeam.name,
        awayName: match.awayTeam.name,
        competitionName: match.competition.name,
        homeId: match.homeTeam.id,
        awayId: match.awayTeam.id,
        competitionId: match.competition.id,
      });

      const shouldNotify = isMatchFollowed || Boolean(favMatch);
      const prev = previousNormalizedState.current[matchIdStr];

      if (shouldNotify) {
        const homeName = match.homeTeam.shortName || match.homeTeam.name;
        const awayName = match.awayTeam.shortName || match.awayTeam.name;
        const kickoffMs = new Date(match.utcDate).getTime();
        const timeUntilStart = kickoffMs - now;

        // 1. 15-minute Kick-Off Reminder
        const kickoffKey = `kickoff15_${matchIdStr}`;
        if (
          match.status === 'UPCOMING' &&
          Number.isFinite(timeUntilStart) &&
          timeUntilStart > 0 &&
          timeUntilStart <= FIFTEEN_MINUTES &&
          !notifiedKeys.current.has(kickoffKey)
        ) {
          notifiedKeys.current.add(kickoffKey);
          const minsLeft = Math.max(1, Math.round(timeUntilStart / 60000));
          addNotification({
            id: kickoffKey,
            title: `⏱️ Kick-Off in ${minsLeft}m`,
            body: `${homeName} vs ${awayName} (${match.competition.name}) kicks off soon!`,
            time: now,
            type: 'match',
            link: '/livescore',
          }, true);
        }

        // 2. Goal Alerts (during live play)
        if (prev && match.isLive) {
          const curHome = match.score.home ?? 0;
          const curAway = match.score.away ?? 0;
          const prevHome = prev.homeScore ?? 0;
          const prevAway = prev.awayScore ?? 0;

          if (match.score.home !== null && curHome > prevHome) {
            const goalId = `goal_norm_${matchIdStr}_${curHome}_${curAway}_h`;
            if (!notifiedKeys.current.has(goalId)) {
              notifiedKeys.current.add(goalId);
              addNotification({
                id: goalId,
                title: `⚽ GOAL! ${homeName}`,
                body: `${homeName} ${curHome} - ${curAway} ${awayName} (${match.minute || 'LIVE'})`,
                time: now,
                type: 'goal',
                link: '/livescore',
              }, true);
            }
          }

          if (match.score.away !== null && curAway > prevAway) {
            const goalId = `goal_norm_${matchIdStr}_${curHome}_${curAway}_a`;
            if (!notifiedKeys.current.has(goalId)) {
              notifiedKeys.current.add(goalId);
              addNotification({
                id: goalId,
                title: `⚽ GOAL! ${awayName}`,
                body: `${homeName} ${curHome} - ${curAway} ${awayName} (${match.minute || 'LIVE'})`,
                time: now,
                type: 'goal',
                link: '/livescore',
              }, true);
            }
          }
        }

        // 3. Half-Time Result Alert
        const isHalfTimeNow =
          match.statusLabel?.toUpperCase() === 'HT' ||
          match.minute?.toUpperCase() === 'HT' ||
          match.rawStatus?.toUpperCase() === 'PAUSED';
        const wasHalfTimeBefore =
          prev &&
          (prev.statusLabel?.toUpperCase() === 'HT' ||
            prev.minute?.toUpperCase() === 'HT' ||
            prev.status === 'PAUSED');

        const htKey = `ht_${matchIdStr}`;
        if (prev && isHalfTimeNow && !wasHalfTimeBefore && !notifiedKeys.current.has(htKey)) {
          notifiedKeys.current.add(htKey);
          addNotification({
            id: htKey,
            title: '⏸️ Half-Time',
            body: `${homeName} ${match.score.home ?? 0} - ${match.score.away ?? 0} ${awayName} (${match.competition.name})`,
            time: now,
            type: 'match',
            link: '/livescore',
          }, true);
        }

        // 4. Full-Time Result Alert
        const ftKey = `ft_${matchIdStr}`;
        if (
          prev &&
          prev.status !== 'FINISHED' &&
          match.status === 'FINISHED' &&
          !notifiedKeys.current.has(ftKey)
        ) {
          notifiedKeys.current.add(ftKey);
          addNotification({
            id: ftKey,
            title: '🏁 Full-Time Result',
            body: `Final: ${homeName} ${match.score.home ?? 0} - ${match.score.away ?? 0} ${awayName}`,
            time: now,
            type: 'match',
            link: '/livescore',
          }, true);
        }
      }

      previousNormalizedState.current[matchIdStr] = {
        homeScore: match.score.home,
        awayScore: match.score.away,
        status: match.status,
        statusLabel: match.statusLabel,
        minute: match.minute,
      };
    });
  }, [footballMatches, followedMatches, favorites, isFollowing, isFavorite, addNotification]);

  // Legacy /api/sports/live goal notifications (kept for MatchCard/API-Sports matches)
  useEffect(() => {
    if (!liveMatches) return;

    liveMatches.forEach((match) => {
      const isFav =
        isFollowing(String(match.id)) ||
        isFollowing(`match_${match.id}`) ||
        isFavorite(`team_${match.homeTeam.id}`) ||
        isFavorite(`team_${match.awayTeam.id}`) ||
        isFavorite(`competition_${match.competitionId}`) ||
        isFavorite(`match_${match.id}`);

      if (!isFav) return;

      const prev = previousScores.current[match.id];
      if (prev) {
        if (prev.home !== null && match.homeScore !== null && match.homeScore > prev.home) {
          const body = `${match.homeTeam.name} scored! ${match.homeTeam.name} ${match.homeScore}-${match.awayScore} ${match.awayTeam.name}`;
          addNotification({
            id: `goal_${match.id}_${match.homeScore}_${match.awayScore}_home`,
            title: '⚽ GOAL!',
            body,
            time: Date.now(),
            type: 'goal',
            link: `/matches/${match.id}`,
          }, true);
        }
        if (prev.away !== null && match.awayScore !== null && match.awayScore > prev.away) {
          const body = `${match.awayTeam.name} scored! ${match.homeTeam.name} ${match.homeScore}-${match.awayScore} ${match.awayTeam.name}`;
          addNotification({
            id: `goal_${match.id}_${match.homeScore}_${match.awayScore}_away`,
            title: '⚽ GOAL!',
            body,
            time: Date.now(),
            type: 'goal',
            link: `/matches/${match.id}`,
          }, true);
        }
      }

      previousScores.current[match.id] = {
        home: match.homeScore,
        away: match.awayScore,
      };
    });
  }, [liveMatches, favorites, followedMatches, isFollowing, isFavorite, addNotification]);

  // Legacy /api/sports/upcoming 15-min kickoff alerts
  useEffect(() => {
    if (!upcomingMatches) return;

    const now = Date.now();
    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    upcomingMatches.forEach((match) => {
      const isFav =
        isFollowing(String(match.id)) ||
        isFollowing(`match_${match.id}`) ||
        isFavorite(`team_${match.homeTeam.id}`) ||
        isFavorite(`team_${match.awayTeam.id}`) ||
        isFavorite(`competition_${match.competitionId}`) ||
        isFavorite(`match_${match.id}`);

      const key = `legacy_kickoff_${match.id}`;
      if (!isFav || notifiedKeys.current.has(key)) return;

      const timeUntilStart = match.startTime - now;

      if (timeUntilStart > 0 && timeUntilStart <= FIFTEEN_MINUTES) {
        const body = `${match.homeTeam.name} vs ${match.awayTeam.name} starts in less than 15 minutes!`;
        addNotification({
          id: `match_start_${match.id}`,
          title: '⏱️ Kick-Off Approaching',
          body,
          time: Date.now(),
          type: 'match',
          link: `/matches/${match.id}`,
        }, true);

        notifiedKeys.current.add(key);
      }
    });
  }, [upcomingMatches, favorites, followedMatches, isFollowing, isFavorite, addNotification]);

  return {
    notifications,
    unreadCount,
    markAllRead,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
  };
}

