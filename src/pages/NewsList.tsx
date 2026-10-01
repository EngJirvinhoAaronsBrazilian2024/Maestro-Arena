import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../services/news/hooks';
import { Card, CardContent } from '../components/ui/Card';
import { RefreshCw, Newspaper, ArrowRight } from 'lucide-react';
import { getImageUrl } from '../services/storageService';

const DEFAULT_CATEGORIES = ['All', 'Premier League', 'Champions League', 'World Football', 'Transfers'];

export function NewsList() {
  const { articles, isLoading, mutate } = useArticles('published');
  const [category, setCategory] = useState<string>('All');

  // Extract unique categories from articles
  const availableCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    if (articles) {
      articles.forEach(a => {
        if (a.category && a.category.trim()) {
          set.add(a.category.trim());
        }
      });
    }
    return Array.from(set);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    if (category === 'All') return articles;
    return articles.filter(a => (a.category || '').toLowerCase() === category.toLowerCase());
  }, [articles, category]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
            <Newspaper className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Maestro Newsroom</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">Latest News</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Top stories, tactical analysis, match breakdowns, and breaking football coverage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => mutate()}
            className="p-2.5 rounded-2xl bg-white border border-slate-200/90 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh News"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-rose-600' : ''} />
          </button>
        </div>
      </div>

      {/* CATEGORY FILTER CHIPS */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {availableCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              category.toLowerCase() === cat.toLowerCase()
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
        </div>
      ) : !filteredArticles || filteredArticles.length === 0 ? (
        <div className="rounded-3xl bg-white/70 border border-slate-200/80 p-12 text-center">
          <Newspaper className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-black text-slate-800">No News Articles Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {category !== 'All' ? `No articles matching "${category}".` : 'No published news articles available yet.'}
          </p>
          {category !== 'All' && (
            <button
              onClick={() => setCategory('All')}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
            >
              View All News ({articles?.length || 0})
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {filteredArticles.map(article => (
            <Link key={article.id} to={`/news/${article.id}`} className="group flex flex-col">
              <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 border border-slate-200/80 bg-white/95 flex flex-col">
                <div className="aspect-[16/9] w-full overflow-hidden bg-slate-950/5 relative">
                  <img 
                    loading="lazy" 
                    src={getImageUrl(article.imageUrl)} 
                    alt={article.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-md text-rose-700 px-3 py-1 rounded-full shadow-2xs border border-rose-200/60">
                      {article.category || 'News'}
                    </span>
                  </div>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
                      <span>{new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="font-bold text-slate-600 truncate max-w-[200px]">By {article.authorName || 'Jirvinho Brazilian sports maestro'}</span>
                    </div>
                    <h3 className="mb-2.5 text-lg sm:text-xl font-black text-slate-950 leading-tight group-hover:text-rose-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 line-clamp-3 leading-relaxed">
                      {article.summary || (article.content ? article.content.slice(0, 160) + '...' : '')}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
                    <span>Read Full Story</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
