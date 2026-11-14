import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useArticles, useBookmarks, useReadingHistory } from '../services/news/hooks';
import {
  toggleBookmark,
  getSavedArticleSnapshots,
  removeReadingHistoryItem,
  clearReadingHistory,
  getFullArticleById,
  recordReadingHistory,
} from '../services/newsService';
import { sanitizeNewsText } from '../lib/newsText';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import {
  RefreshCw,
  Newspaper,
  ArrowRight,
  Sparkles,
  Clock,
  Globe,
  Bookmark,
  History,
  Search,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  RotateCcw,
  BookOpen,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { getImageUrl } from '../services/storageService';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { JirvinhoAdBanner } from '../components/ads/JirvinhoAdBanner';

const DEFAULT_CATEGORIES = ['All', 'Premier League', 'Champions League', 'European Football', 'Transfers', 'World Football'];

const TOP_SOURCES = ['All Sources', 'BBC Sport', 'Sky Sports', 'The Guardian', 'The Independent', 'ESPN FC', 'talkSPORT', 'Evening Standard'];

type NewsTab = 'all' | 'saved';

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
      label: 'Sky Sports',
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
  if (name.includes('ESPN')) {
    return {
      label: 'ESPN FC',
      className: 'bg-red-950/85 border-rose-400/50 text-rose-200 shadow-red-950/30',
      dot: 'bg-rose-400',
    };
  }
  if (name.includes('talkSPORT')) {
    return {
      label: 'talkSPORT',
      className: 'bg-amber-950/85 border-amber-400/50 text-amber-200 shadow-amber-950/30',
      dot: 'bg-amber-400',
    };
  }
  if (name.includes('Standard')) {
    return {
      label: 'Evening Standard',
      className: 'bg-indigo-950/85 border-indigo-400/50 text-indigo-200 shadow-indigo-950/30',
      dot: 'bg-indigo-400',
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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as NewsTab) || 'all';
  const [activeTab, setActiveTab] = useState<NewsTab>(
    initialTab === 'saved' ? 'saved' : 'all'
  );
  const [category, setCategory] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All Sources');
  const [newsQuery, setNewsQuery] = useState<string>('');
  const [savedCategory, setSavedCategory] = useState<string>('All');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [fullContentCache, setFullContentCache] = useState<Record<string, string>>({});
  const [loadingFullId, setLoadingFullId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'saved' | 'history'>('history');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const { user } = useAuth();
  const userId = user?.id || (user as any)?.uid || 'guest';

  const { articles, isLoading, mutate } = useArticles('published');
  const { bookmarks, mutate: mutateBookmarks } = useBookmarks(userId);
  const { history } = useReadingHistory(userId);

  const handleTabChange = (tab: NewsTab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams, { replace: true });
  };

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
    const q = newsQuery.trim().toLowerCase();
    return articles.filter(a => {
      const matchesCategory = category === 'All' || (a.category || '').toLowerCase() === category.toLowerCase();
      const badgeInfo = getSourceBadgeInfo(a.authorName);
      const matchesSource =
        selectedSource === 'All Sources' ||
        badgeInfo.label.toLowerCase().includes(selectedSource.toLowerCase()) ||
        (selectedSource === 'Sky Sports' && badgeInfo.label.includes('Sky'));
      const matchesQuery =
        !q ||
        (a.title || '').toLowerCase().includes(q) ||
        (a.summary || '').toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q);
      return matchesCategory && matchesSource && matchesQuery;
    });
  }, [articles, category, selectedSource, newsQuery]);

  // Saved / Bookmarked Articles (merging live articles + offline snapshots)
  const savedArticles = useMemo(() => {
    const bookmarkSet = new Set(bookmarks);
    const map = new Map<string, any>();

    (articles || []).forEach(a => {
      if (bookmarkSet.has(a.id)) map.set(a.id, a);
    });
    getSavedArticleSnapshots(userId).forEach(snap => {
      if (bookmarkSet.has(snap.id) && !map.has(snap.id)) {
        map.set(snap.id, snap);
      }
    });

    return Array.from(map.values()).sort((a, b) => Number(b.publishedAt || 0) - Number(a.publishedAt || 0));
  }, [articles, bookmarks, userId]);

  const savedCategories = useMemo(() => {
    const set = new Set<string>(['All']);
    savedArticles.forEach(a => {
      if (a.category && String(a.category).trim()) {
        set.add(String(a.category).trim());
      }
    });
    return Array.from(set);
  }, [savedArticles]);

  const filteredSavedArticles = useMemo(() => {
    if (savedCategory === 'All') return savedArticles;
    return savedArticles.filter(a => (a.category || '').toLowerCase() === savedCategory.toLowerCase());
  }, [savedArticles, savedCategory]);

  const handleToggleExpand = async (e: React.MouseEvent, article: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (expandedArticleId === article.id) {
      setExpandedArticleId(null);
      return;
    }

    setExpandedArticleId(article.id);
    recordReadingHistory(article, userId);

    const existingFull = fullContentCache[article.id];
    const currentText = String(article.content || '').trim();
    const needsEnrichment =
      !existingFull &&
      (currentText.length < 450 ||
        currentText.includes('Follow live tactical reactions, line-ups, and post-match quotes on Maestro Arena.'));

    if (needsEnrichment) {
      setLoadingFullId(article.id);
      try {
        const enriched = await getFullArticleById(article.id);
        if (enriched?.content) {
          setFullContentCache(prev => ({ ...prev, [article.id]: enriched.content }));
        }
      } finally {
        setLoadingFullId(curr => (curr === article.id ? null : curr));
      }
    }
  };

  const handleToggleBookmark = async (e: React.MouseEvent, article: any) => {
    e.preventDefault();
    e.stopPropagation();
    const currentlyBookmarked = bookmarks.includes(article.id);
    const optimistic = currentlyBookmarked
      ? bookmarks.filter(b => b !== article.id)
      : [article.id, ...bookmarks];
    mutateBookmarks(optimistic, false);
    await toggleBookmark(userId, article.id, currentlyBookmarked, article);
    toast.success(currentlyBookmarked ? 'Removed from Saved Stories' : 'Saved to Saved Stories', { duration: 1800 });
    mutateBookmarks();
  };

  // Handle 1-click auto-sync
  const handleSyncNews = async (silent = false) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/news/auto-sync?force=true', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (!silent) {
          if (data.added > 0) {
            toast.success(`Synced ${data.added} fresh current stories from global football newsrooms!`);
          } else {
            toast.info('All active global football feeds are already up to date!');
          }
        }
        await mutate();
      } else if (!silent) {
        toast.error(data.error || 'Could not sync latest stories. Please retry.');
      }
    } catch {
      if (!silent) {
        toast.error('Sync request failed. Checking connection...');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    const latestPub = articles && articles.length > 0 ? Number(articles[0].publishedAt || 0) : 0;
    const needsFreshSync = !articles || articles.length === 0 || Date.now() - latestPub > 60 * 60 * 1000;
    if (needsFreshSync) {
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

  const renderArticleCard = (article: any, index: number, showAd = true) => {
    const sourceBadge = getSourceBadgeInfo(article.authorName);
    const isSaved = bookmarks.includes(article.id);
    const isExpanded = expandedArticleId === article.id;
    const isFetchingFull = loadingFullId === article.id;
    const resolvedFullContent = sanitizeNewsText(
      (fullContentCache[article.id] || article.content || article.summary || '')
        .replace(/\n*Full reporting and coverage from .*?Maestro Arena\./is, '')
        .trim(),
      true
    );
    const fullParagraphs = resolvedFullContent
      ? resolvedFullContent.split(/\n{2,}/).map((p: string) => p.trim()).filter(Boolean)
      : [];
    const cleanHeadline = sanitizeNewsText(article.title || '', false);
    const cleanSummary = sanitizeNewsText(article.summary || '', false);

    return (
      <React.Fragment key={article.id}>
        <div
          className={cn(
            'group flex flex-col transition-all duration-300',
            isExpanded && 'md:col-span-2'
          )}
        >
          <Card
            className={cn(
              'h-full overflow-hidden transition-all duration-300 border bg-white/90 backdrop-blur-xl flex flex-col',
              isExpanded
                ? 'border-rose-300 shadow-2xl ring-2 ring-rose-500/10'
                : 'border-slate-200/80 hover:shadow-xl hover:-translate-y-1'
            )}
          >
            <div
              onClick={(e) => handleToggleExpand(e, article)}
              className={cn(
                'w-full overflow-hidden bg-slate-900 relative cursor-pointer',
                isExpanded ? 'aspect-[21/9] max-h-[340px]' : 'aspect-[16/9]'
              )}
            >
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

              {/* Top-right source badge + Bookmark icon */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleToggleBookmark(e, article)}
                  className={cn(
                    'w-8 h-8 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer shadow-md',
                    isSaved
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-slate-950/70 border-white/25 text-white hover:bg-rose-600 hover:border-rose-500'
                  )}
                  title={isSaved ? 'Remove from Saved Stories' : 'Save story'}
                  aria-label="Toggle bookmark"
                >
                  <Bookmark className={cn('w-3.5 h-3.5', isSaved && 'fill-white')} />
                </button>
                <span className={cn(
                  'inline-flex items-center gap-1.5 text-[10px] font-black tracking-wide backdrop-blur-md border px-2.5 py-1 rounded-full shadow-lg',
                  sourceBadge.className
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', sourceBadge.dot)} />
                  {sourceBadge.label}
                </span>
              </div>
            </div>

            <CardContent className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatTimeAgo(article.publishedAt)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate max-w-[150px] font-medium text-slate-600">
                      {sourceBadge.label}
                    </span>
                  </div>

                  {isExpanded && (
                    <Link
                      to={`/news/${article.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors"
                      title="Open dedicated article page"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Full Page</span>
                    </Link>
                  )}
                </div>

                <h3
                  onClick={(e) => handleToggleExpand(e, article)}
                  className={cn(
                    'mb-2 font-black text-slate-900 leading-snug hover:text-rose-600 transition-colors cursor-pointer',
                    isExpanded ? 'text-xl sm:text-2xl mb-4' : 'text-base sm:text-lg line-clamp-2'
                  )}
                >
                  {cleanHeadline}
                </h3>

                {!isExpanded ? (
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {cleanSummary || (resolvedFullContent ? resolvedFullContent.slice(0, 160) + '...' : '')}
                  </p>
                ) : (
                  <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed pt-2 border-t border-slate-100 animate-in fade-in duration-300">
                    {isFetchingFull && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading full multi-paragraph report...</span>
                      </div>
                    )}
                    {fullParagraphs.length > 0 ? (
                      fullParagraphs.map((paragraph: string, pIdx: number) => (
                        <p key={pIdx} className={pIdx === 0 ? 'font-semibold text-slate-800' : 'font-normal'}>
                          {paragraph}
                        </p>
                      ))
                    ) : (
                      <p>{article.summary || article.title}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={(e) => handleToggleExpand(e, article)}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-black cursor-pointer transition-colors',
                    isExpanded ? 'text-slate-700 hover:text-rose-600' : getCategoryTheme(article.category).readMore
                  )}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={15} />
                      <span>Collapse Story</span>
                    </>
                  ) : (
                    <>
                      <BookOpen size={14} />
                      <span>Read Full Story</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {!isExpanded && (
                  <Link
                    to={`/news/${article.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors"
                    title="Open on separate page"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {showAd && (index === 1 || index === 7) && (
          <JirvinhoAdBanner key={`jirvinho-ad-feed-${index}`} variant="feed" />
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header bar with auto-sync indicator & controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/95 border border-emerald-300/80 text-emerald-800 text-[10px] font-black uppercase tracking-wider shadow-2xs backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>Live Global Feeds Active</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">Latest Football News</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Real-time breaking stories, match previews, and full football reports curated from global newsrooms.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDrawerTab('history');
              setDrawerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-slate-700 hover:text-rose-600 hover:border-rose-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Open Reading History & Saved Stories Drawer"
          >
            <History className="w-3.5 h-3.5 text-rose-600" />
            <span>History</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-black text-slate-700">
                {history.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleSyncNews(false)}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-sm shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Fetch the freshest current football stories from active global newsrooms"
          >
            <Sparkles className={cn('w-3.5 h-3.5 text-amber-200', isSyncing && 'animate-spin')} />
            <span>{isSyncing ? 'Fetching...' : 'Auto-Sync'}</span>
          </button>

          <button
            onClick={() => mutate()}
            className="p-2.5 rounded-2xl bg-white border border-slate-200/90 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh News"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-rose-600' : ''} />
          </button>
        </div>
      </div>

      {/* Primary News Mode Tabs: All News | Saved Stories */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 border border-slate-200/90 shadow-2xs">
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          )}
        >
          <Newspaper className="w-4 h-4" />
          <span>All News</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('saved')}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'saved'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/70'
          )}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Stories</span>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-black',
            activeTab === 'saved' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
          )}>
            {savedArticles.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ALL NEWS */}
      {activeTab === 'all' && (
        <>
          {/* Compact Dropdown Filter Bar (prevents pill congestion) */}
          <div className="rounded-2xl bg-white/95 border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* Newsroom / Source Dropdown */}
              <div className="sm:col-span-4 relative">
                <Globe className="w-4 h-4 text-rose-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  aria-label="Filter by newsroom source"
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer transition-colors"
                >
                  {TOP_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source === 'All Sources' ? 'Newsroom: All Sources' : source}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Category Dropdown */}
              <div className="sm:col-span-4 relative">
                <Tag className="w-4 h-4 text-rose-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  aria-label="Filter by category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer transition-colors"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'All' ? 'Category: All Topics' : cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search Headlines + Optional Reset */}
              <div className="sm:col-span-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={newsQuery}
                    onChange={(e) => setNewsQuery(e.target.value)}
                    placeholder="Search headlines..."
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
                {(category !== 'All' || selectedSource !== 'All Sources' || newsQuery.trim() !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('All');
                      setSelectedSource('All Sources');
                      setNewsQuery('');
                    }}
                    className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
                    title="Reset filters"
                    aria-label="Reset filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
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
                {category !== 'All' || selectedSource !== 'All Sources' || newsQuery.trim() !== ''
                  ? `No articles currently match ${selectedSource !== 'All Sources' ? `"${selectedSource}"` : ''} ${category !== 'All' ? `in category "${category}"` : ''}${newsQuery.trim() ? ` for "${newsQuery.trim()}"` : ''}.`
                  : 'Pulling latest breaking football stories from active global newsrooms.'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => handleSyncNews(false)}
                  disabled={isSyncing}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Syncing...' : 'Fetch Breaking News Now'}</span>
                </button>
                {(category !== 'All' || selectedSource !== 'All Sources' || newsQuery.trim() !== '') && (
                  <button
                    onClick={() => {
                      setCategory('All');
                      setSelectedSource('All Sources');
                      setNewsQuery('');
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
              {filteredArticles.map((article, index) => renderArticleCard(article, index, true))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: SAVED STORIES */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Saved Stories ({savedArticles.length})</h2>
              <p className="text-xs text-slate-500">Articles you bookmarked for quick offline & mobile reading</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {savedCategories.length > 2 && (
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-rose-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    aria-label="Filter saved stories by category"
                    value={savedCategory}
                    onChange={(e) => setSavedCategory(e.target.value)}
                    className="appearance-none pl-8 pr-8 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
                  >
                    {savedCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'All' ? 'All Saved Topics' : cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setDrawerTab('history');
                  setDrawerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-rose-600 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                View Reading History
              </button>
            </div>
          </div>

          {filteredSavedArticles.length === 0 ? (
            <div className="rounded-3xl bg-white/80 border border-slate-200 p-12 text-center space-y-3">
              <Bookmark className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="text-base font-black text-slate-800">
                {savedArticles.length === 0 ? 'No Saved Stories Yet' : `No Saved Stories in "${savedCategory}"`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                {savedArticles.length === 0
                  ? 'Tap the bookmark icon on any article card or inside an article to save it here for quick access.'
                  : 'Select "All Saved Topics" from the dropdown to view all your bookmarked stories.'}
              </p>
              <button
                type="button"
                onClick={() => (savedArticles.length === 0 ? handleTabChange('all') : setSavedCategory('All'))}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                {savedArticles.length === 0 ? 'Browse Latest News' : 'Show All Saved Stories'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {filteredSavedArticles.map((article, index) => renderArticleCard(article, index, false))}
            </div>
          )}
        </div>
      )}

      {/* SLIDE-OVER BOOKMARKS & READING HISTORY DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-2xs"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-rose-600" />
                <h2 className="text-sm font-black text-slate-900">Saved & Reading History</h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerTab('history')}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer',
                  drawerTab === 'history' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                )}
              >
                Reading History ({history.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('saved')}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer',
                  drawerTab === 'saved' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                )}
              >
                Saved ({savedArticles.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {drawerTab === 'history' ? (
                <>
                  {history.length > 0 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          clearReadingHistory(userId);
                          toast.success('Reading history cleared', { duration: 2000 });
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear History
                      </button>
                    </div>
                  )}
                  {history.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      Articles you read will appear here automatically.
                    </div>
                  ) : (
                    history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-2 p-3 rounded-2xl border border-slate-200/80 hover:border-rose-200 bg-slate-50/70 hover:bg-white transition-all"
                      >
                        <Link
                          to={`/news/${item.id}`}
                          onClick={() => setDrawerOpen(false)}
                          className="flex-1 min-w-0 group"
                        >
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <span className="text-rose-600 uppercase">{item.category || 'News'}</span>
                            <span>·</span>
                            <span>Read {formatTimeAgo(item.readAt)}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 line-clamp-2 mt-0.5">
                            {item.title}
                          </h4>
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeReadingHistoryItem(item.id, userId)}
                          className="p-1 text-slate-300 hover:text-rose-600 cursor-pointer shrink-0"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </>
              ) : savedArticles.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  Tap the bookmark icon on any story to save it here.
                </div>
              ) : (
                savedArticles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-2 p-3 rounded-2xl border border-slate-200/80 hover:border-rose-200 bg-slate-50/70 hover:bg-white transition-all"
                  >
                    <Link
                      to={`/news/${item.id}`}
                      onClick={() => setDrawerOpen(false)}
                      className="flex-1 min-w-0 group"
                    >
                      <span className="text-[10px] font-black uppercase text-rose-600">{item.category || 'News'}</span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 line-clamp-2 mt-0.5">
                        {item.title}
                      </h4>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(e, item)}
                      className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer shrink-0"
                      title="Remove bookmark"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default NewsList;
