import React, { useMemo } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { useLiveMatches, useUpcomingMatches, useFavoriteFixtures } from '../services/sports/hooks';
import { useArticles } from '../services/news/hooks';
import { MatchCard } from '../components/sports/MatchCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Star, Newspaper, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MyFeed() {
  const { favorites, isFavorite } = useFavorites();
  const { matches: liveMatches } = useLiveMatches();
  const { matches: upcomingMatches } = useUpcomingMatches();
  const { articles } = useArticles('published');

  
  const favoriteTeamIds = useMemo(() => favorites.filter(f => f.type === 'team').map(f => f.id.replace('team_', '')), [favorites]);
  const { fixtures: favoriteFixtures } = useFavoriteFixtures(favoriteTeamIds);
  
  const favoriteMatches = favoriteFixtures || [];
  

  const liveFavoriteMatches = favoriteMatches.filter(m => m.status === 'live');
  const upcomingFavoriteMatches = favoriteMatches.filter(m => m.status === 'scheduled');

  // Naive filter for articles: match title/content with favorite names
  const favoriteArticles = useMemo(() => {
    if (!articles) return [];
    if (favorites.length === 0) return [];
    return articles.filter(a => 
      favorites.some(f => 
        a.title.toLowerCase().includes(f.name.toLowerCase()) || 
        (a.content && a.content.toLowerCase().includes(f.name.toLowerCase()))
      )
    ).slice(0, 5);
  }, [articles, favorites]);

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Star className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-slate-900">Your Feed is Empty</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-6">
          You haven't added any favorites yet. Tap the star icon next to any team or competition on the live scores page to build your personal feed.
        </p>
        <Link to="/livescore" className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
          Browse Matches
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">My Feed</h1>
        <p className="text-slate-500 mb-6">Your personalized sports hub based on your favorites.</p>
        
        <div className="flex overflow-x-auto pb-4 hide-scrollbar gap-3">
          {favorites.filter(f => f.type === 'team').map(team => (
            <div key={team.id} className="flex-shrink-0 flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 pl-2 pr-1.5 py-1.5 rounded-full shadow-sm transition-all">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">{team.name.charAt(0)}</div>
              )}
              <span className="text-sm font-bold text-slate-800">{team.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
        <div className="space-y-6 w-full">
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Live Favorites
            </h2>
            {liveFavoriteMatches.length > 0 ? (
              <div className="flex flex-col gap-4 w-full">
                {liveFavoriteMatches.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  No live matches for your favorites right now.
                </CardContent>
              </Card>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Upcoming Favorites</h2>
            {upcomingFavoriteMatches.length > 0 ? (
              <div className="flex flex-col gap-4 w-full">
                {upcomingFavoriteMatches.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  No upcoming matches for your favorites.
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-blue-500" />
                Favorite News
              </CardTitle>
            </CardHeader>
            <CardContent>
              {favoriteArticles.length > 0 ? (
                <div className="space-y-4">
                  {favoriteArticles.map(article => (
                    <Link key={article.id} to={`/news/${article.id}`} className="block group">
                      <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{new Date(article.published_at || article.created_at).toLocaleDateString()}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No recent news about your favorites.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
