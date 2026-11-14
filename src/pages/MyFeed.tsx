import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Newspaper,
  Bell,
  BellRing,
  Calendar,
  Activity,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useFavorites, FavoriteItem, isFavoriteTeamOrCompMatch, doesFavoriteMatchName } from '../hooks/useFavorites';
import { useFootballMatches } from '../hooks/useFootballMatches';
import { useArticles } from '../services/news/hooks';
import { useNotifications } from '../context/NotificationContext';
import { FavoriteTeamsBar } from '../components/sports/FavoriteTeamsBar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { cn } from '../lib/utils';

export function MyFeed() {
  const { favorites } = useFavorites();
  const { matches } = useFootballMatches();
  const { articles } = useArticles('published');
  const { isFollowing, toggleFollowMatch } = useNotifications();
  const [filteredFav, setFilteredFav] = useState<FavoriteItem | null>(null);

  const scope = useMemo(
    () => (filteredFav ? [filteredFav] : favorites),
    [filteredFav, favorites]
  );

  const favoriteMatches = useMemo(() => {
    if (!matches.length || scope.length === 0) return [];
    return matches.filter((m) =>
      Boolean(
        isFavoriteTeamOrCompMatch(scope, {
          homeName: m.homeTeam.name,
          awayName: m.awayTeam.name,
          competitionName: m.competition.name,
          homeId: m.homeTeam.id,
          awayId: m.awayTeam.id,
          competitionId: m.competition.id,
        })
      )
    );
  }, [matches, scope]);

  const liveFavoriteMatches = useMemo(() => favoriteMatches.filter((m) => m.isLive), [favoriteMatches]);
  const upcomingFavoriteMatches = useMemo(() => favoriteMatches.filter((m) => m.status === 'UPCOMING'), [favoriteMatches]);
  const finishedFavoriteMatches = useMemo(() => favoriteMatches.filter((m) => m.status === 'FINISHED'), [favoriteMatches]);

  const favoriteArticles = useMemo(() => {
    if (!articles || scope.length === 0) return [];
    return articles
      .filter((a) =>
        scope.some(
          (f) =>
            doesFavoriteMatchName(f.name, a.title) ||
            a.title.toLowerCase().includes(f.name.toLowerCase()) ||
            (a.summary && a.summary.toLowerCase().includes(f.name.toLowerCase())) ||
            (a.content && a.content.toLowerCase().includes(f.name.toLowerCase()))
        )
      )
      .slice(0, 8);
  }, [articles, scope]);

  const renderMatchRow = (match: typeof favoriteMatches[number]) => {
    const followed = isFollowing(String(match.id));
    const kickoff = new Date(match.utcDate);
    return (
      <div
        key={match.id}
        className={cn(
          'rounded-2xl border p-4 bg-white/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs',
          match.isLive ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200/90'
        )}
      >
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
            <span className="truncate">{match.competition.name}</span>
            <span>·</span>
            {match.isLive ? (
              <span className="text-emerald-700 font-black uppercase">
                {match.minute || 'LIVE'}
              </span>
            ) : match.status === 'FINISHED' ? (
              <span className="text-slate-600 font-black">FT</span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {kickoff.toLocaleDateString([], { month: 'short', day: 'numeric' })} ·{' '}
                {kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm sm:text-base font-black text-slate-900">
            <span className="truncate">{match.homeTeam.name}</span>
            <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 font-mono text-sm shrink-0">
              {match.score.home !== null ? match.score.home : '-'} : {match.score.away !== null ? match.score.away : '-'}
            </span>
            <span className="truncate">{match.awayTeam.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {match.status !== 'FINISHED' && (
            <button
              type="button"
              onClick={() =>
                toggleFollowMatch(
                  String(match.id),
                  `${match.homeTeam.shortName || match.homeTeam.name} vs ${match.awayTeam.shortName || match.awayTeam.name}`
                )
              }
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors',
                followed
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600'
              )}
            >
              {followed ? <BellRing className="w-3.5 h-3.5 animate-pulse" /> : <Bell className="w-3.5 h-3.5" />}
              <span>{followed ? 'Alerts On' : 'Remind Me'}</span>
            </button>
          )}
          <Link
            to="/livescore"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            <span>Live</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-14 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-2">
          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
          Personalized Hub
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">My Feed</h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
          Live scores, next fixtures, match reminders, and team-specific stories for everything you pin.
        </p>
      </div>

      {/* Quick-Filter Bar & Personalized Strip */}
      <FavoriteTeamsBar showMyFeedLink={false} showInlineFeed={false} onFilterChange={setFilteredFav} />

      {favorites.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Live Matches */}
            <section className="space-y-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Live Right Now ({liveFavoriteMatches.length})
              </h2>
              {liveFavoriteMatches.length > 0 ? (
                <div className="space-y-2.5">{liveFavoriteMatches.map(renderMatchRow)}</div>
              ) : (
                <Card>
                  <CardContent className="py-6 text-center text-xs sm:text-sm text-slate-500">
                    None of your selected teams are playing right now.
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Upcoming Fixtures */}
            <section className="space-y-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-600" />
                Upcoming Fixtures ({upcomingFavoriteMatches.length})
              </h2>
              {upcomingFavoriteMatches.length > 0 ? (
                <div className="space-y-2.5">{upcomingFavoriteMatches.slice(0, 8).map(renderMatchRow)}</div>
              ) : (
                <Card>
                  <CardContent className="py-6 text-center text-xs sm:text-sm text-slate-500">
                    No upcoming fixtures scheduled in the active window.
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Recent Results */}
            {finishedFavoriteMatches.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-black text-slate-900">Recent Results ({finishedFavoriteMatches.length})</h2>
                <div className="space-y-2.5">{finishedFavoriteMatches.slice(0, 6).map(renderMatchRow)}</div>
              </section>
            )}
          </div>

          {/* Tailored News Column */}
          <div>
            <Card className="bg-white/90 border border-slate-200/90">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-base font-black flex items-center gap-2 text-slate-900">
                  <Newspaper className="h-4 w-4 text-rose-600" />
                  {filteredFav ? `${filteredFav.name} Stories` : 'Your Team News'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {favoriteArticles.length > 0 ? (
                  <div className="space-y-3.5">
                    {favoriteArticles.map((article) => (
                      <Link
                        key={article.id}
                        to={`/news/${article.id}`}
                        className="block group pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                          {article.category || 'Football'}
                        </span>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 mt-0.5">
                          {article.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {new Date(article.publishedAt || Date.now()).toLocaleDateString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-500 text-center py-6">
                    No recent stories found for your current selection.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyFeed;
