import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../services/news/hooks';
import { Card, CardContent } from '../components/ui/Card';
import { RefreshCw, Newspaper, ArrowRight, Sparkles, Clock, Globe } from 'lucide-react';
import { getImageUrl } from '../services/storageService';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { JirvinhoAdBanner } from '../components/ads/JirvinhoAdBanner';

const DEFAULT_CATEGORIES = ['All', 'Premier League', 'Champions League', 'European Football', 'Transfers', 'World Football'];

const TOP_SOURCES = ['All Sources', 'BBC Sport', 'Sky Sports', 'The Guardian', 'Marca', 'The Independent'];

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Recent';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getSourceBadgeInfo(authorName?: string) {
  const name = authorName || '';
  if (name.includes('BBC')) {
    return {
      label: 'BBC Sport',
      className: 'bg-red-950/85 border-red-500/50 text-red-200 shadow-red-950/30',
      dot: 'bg-red-400',
    };
  }
  if (name.includes('Sky')) {
    return {
      label: name.includes('Transfer') ? 'Sky Transfers' : 'Sky Sports',
      className: 'bg-sky-950/85 border-sky-400/50 text-sky-200 shadow-sky-950/30',
      dot: 'bg-sky-400',
    };
  }
  if (name.includes('Guardian')) {
    return {
      label: 'The Guardian',
      className: 'bg-blue-950/85 border-cyan-400/50 text-cyan-200 shadow-blue-950/30',
      dot: 'bg-cyan-400',
    };
  }
  if (name.includes('Marca')) {
    return {
      label: 'Marca',
      className: 'bg-amber-950/85 border-amber-400/50 text-amber-200 shadow-amber-950/30',
      dot: 'bg-amber-400',
    };
  }
  if (name.includes('Independent')) {
    return {
      label: 'The Independent',
      className: 'bg-rose-950/85 border-rose-400/50 text-rose-200 shadow-rose-950/30',
      dot: 'bg-rose-400',
    };
  }
  return {
    label: name || 'Sports Desk',
    className: 'bg-slate-950/85 border-white/20 text-slate-200 shadow-slate-950/30',
    dot: 'bg-slate-400',
  };
}

export function NewsList() {
  const [category, setCategory] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All Sources');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { articles, isLoading, mutate } = useArticles('published');

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
    return articles.filter(a => {
      const matchesCategory = category === 'All' || (a.category || '').toLowerCase() === category.toLowerCase();
      const badgeInfo = getSourceBadgeInfo(a.authorName);
      const matchesSource =
        selectedSource === 'All Sources' ||
        badgeInfo.label.toLowerCase().includes(selectedSource.toLowerCase()) ||
        (selectedSource === 'Sky Sports' && badgeInfo.label.includes('Sky'));
      return matchesCategory && matchesSource;
    });
  }, [articles, category, selectedSource]);

  // Handle 1-click auto-sync from the top 5 world football newsrooms
  const handleSyncNews = async (silent = false) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/news/auto-sync?force=true', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (!silent) {
          if (data.added > 0) {
            toast.success(`Auto-synced ${data.added} fresh stories from BBC, Sky, Guardian, Marca & Independent!`);
          } else {
            toast.info('All 5 world-class football feeds are already up to date!');
          }
        }
        await mutate();
      } else if (!silent) {
        toast.error(data.error || 'Could not sync latest stories. Please retry.');
      }
    } catch (e) {
      if (!silent) {
        toast.error('Sync request failed. Checking connection...');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // If no articles exist yet, automatically trigger an initial sync silently
  useEffect(() => {
    if (!isLoading && (!articles || articles.length === 0)) {
      handleSyncNews(true);
    }
  }, [isLoading, articles?.length]);

  const getCategoryTheme = (cat?: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('transfer') || c.includes('rumor')) {
      return {
        pill: 'bg-amber-50/95 text-amber-800 border-amber-300/80',
        activeBtn: 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950 font-black shadow-md shadow-amber-500/25',
        readMore: 'text-amber-700 group-hover:text-amber-800',
      };
    }
    if (c.includes('champions') || c.includes('ucl') || c.includes('tactics') || c.includes('league')) {
      return {
        pill: 'bg-blue-50/95 text-blue-800 border-blue-200/80',
        activeBtn: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/25',
        readMore: 'text-blue-600 group-hover:text-blue-700',
      };
    }
    if (c.includes('preview') || c.includes('report') || c.includes('stats')) {
      return {
        pill: 'bg-emerald-50/95 text-emerald-800 border-emerald-200/80',
        activeBtn: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-600/25',
        readMore: 'text-emerald-600 group-hover:text-emerald-700',
      };
    }
    return {
      pill: 'bg-rose-50/95 text-rose-700 border-rose-200/70',
      activeBtn: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25',
      readMore: 'text-rose-600 group-hover:text-rose-700',
    };
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header bar with auto-sync indicator & controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80">
              <Newspaper className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">World Football Desk</span>
            </div>

            {/* Glowing Live Feed Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/95 border border-emerald-300/80 text-emerald-800 text-[10px] font-black uppercase tracking-wider shadow-2xs backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>5 Top Global Sources Active</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">Latest Football News</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Real-time breaking stories, transfer exclusives, and match reviews automatically curated from BBC Sport, Sky Sports, The Guardian, Marca & The Independent.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* 1-Click Auto Sync Button */}
          <button
            onClick={() => handleSyncNews(false)}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-sm shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Fetch the freshest football stories from all 5 world newsrooms"
          >
            <Sparkles className={cn("w-3.5 h-3.5 text-amber-200", isSyncing && "animate-spin")} />
            <span>{isSyncing ? 'Fetching 5 Feeds...' : 'Auto-Sync News'}</span>
          </button>

          {/* Regular refresh */}
          <button
            onClick={() => mutate()}
            className="p-2.5 rounded-2xl bg-white border border-slate-200/90 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh News"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-rose-600' : ''} />
          </button>
        </div>
      </div>

      {/* 5 TOP GLOBAL SOURCES BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900/5 border border-slate-200/80 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 px-1">
          <Globe className="w-3.5 h-3.5 text-rose-600" />
          <span className="text-[11px] uppercase tracking-wider font-black text-slate-700">Top Newsrooms:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {TOP_SOURCES.map((source) => {
            const isSelected = selectedSource === source;
            return (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs border",
                  isSelected
                    ? "bg-slate-900 text-white border-slate-800 shadow-md"
                    : "bg-white/80 text-slate-600 border-slate-200/80 hover:bg-white hover:text-slate-900"
                )}
              >
                {source}
              </button>
            );
          })}
        </div>
      </div>

      {/* CATEGORY FILTER CONTROLS */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {availableCategories.map(cat => {
          const theme = getCategoryTheme(cat);
          const isSelected = category.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                isSelected
                  ? theme.activeBtn
                  : 'bg-white/80 backdrop-blur-sm text-slate-600 border border-slate-200/90 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
        </div>
      ) : !filteredArticles || filteredArticles.length === 0 ? (
        <div className="rounded-3xl bg-white/70 border border-slate-200/80 p-12 text-center">
          <Newspaper className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-black text-slate-800">No News Articles Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {category !== 'All' || selectedSource !== 'All Sources'
              ? `No articles currently match ${selectedSource !== 'All Sources' ? `"${selectedSource}"` : ''} ${category !== 'All' ? `in category "${category}"` : ''}.`
              : 'Pulling latest breaking football stories from the 5 top world newsrooms.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleSyncNews(false)}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={14} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? 'Syncing...' : 'Fetch Breaking News Now'}</span>
            </button>
            {(category !== 'All' || selectedSource !== 'All Sources') && (
              <button
                onClick={() => {
                  setCategory('All');
                  setSelectedSource('All Sources');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Reset Filters ({articles?.length || 0} stories)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {filteredArticles.map((article, index) => {
            const sourceBadge = getSourceBadgeInfo(article.authorName);
            return (
              <React.Fragment key={article.id}>
                <Link to={`/news/${article.id}`} className="group flex flex-col">
                  <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-200/80 bg-white/80 backdrop-blur-xl flex flex-col">
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900 relative">
                      <img 
                        loading="lazy" 
                        src={getImageUrl(article.imageUrl)} 
                        alt={article.title} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      {/* Category Pill */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider backdrop-blur-md px-3 py-1 rounded-full shadow-2xs border ${getCategoryTheme(article.category).pill}`}>
                          {article.category || 'News'}
                        </span>
                      </div>

                      {/* Top-right source badge for the 5 global newsrooms */}
                      <div className="absolute top-3 right-3">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-black tracking-wide backdrop-blur-md border px-2.5 py-1 rounded-full shadow-lg",
                          sourceBadge.className
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", sourceBadge.dot)} />
                          {sourceBadge.label}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatTimeAgo(article.publishedAt)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-[150px] font-medium text-slate-600">
                            {sourceBadge.label}
                          </span>
                        </div>
                        <h3 className="mb-2 text-base sm:text-lg font-black text-slate-900 leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                          {article.summary || (article.content ? article.content.slice(0, 160) + '...' : '')}
                        </p>
                      </div>
                      <div className={`mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold ${getCategoryTheme(article.category).readMore}`}>
                        <span>Read Full Story</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Seamlessly insert Jirvinho Software World sponsor banner in feed */}
                {(index === 1 || index === 7) && (
                  <JirvinhoAdBanner key={`jirvinho-ad-feed-${index}`} variant="feed" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NewsList;
