import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../services/news/hooks';
import { Card, CardContent } from '../components/ui/Card';

export function NewsList() {
  const { articles, isLoading } = useArticles('published');
  const [category, setCategory] = useState<string>('All');

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
      </div>
    );
  }

  const filteredArticles = category === 'All' 
    ? articles 
    : articles?.filter(a => a.category === category) || [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Latest News</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Top stories, analysis, and breaking football coverage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Premier League', 'Champions League', 'World Cup'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                category === cat 
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {!filteredArticles || filteredArticles.length === 0 ? (
        <div className="rounded-3xl bg-white/70 border border-slate-200/80 p-12 text-center">
          <p className="text-slate-500 font-medium">No news articles available in this category.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
          {filteredArticles.map(article => (
            <Link key={article.id} to={`/news/${article.id}`} className="group">
              <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 border border-white/80 bg-white/80">
                <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                  {article.imageUrl ? (
                    <img loading="lazy" src={article.imageUrl} 
                      alt={article.title} 
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400 font-bold">
                      No Image
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-600">
                      {article.category || 'News'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-black text-slate-950 leading-tight group-hover:text-rose-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 line-clamp-3">
                    {article.summary}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
