import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArticle, useBookmarks } from '../services/news/hooks';
import { toggleBookmark } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import { Bookmark, Share2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '../services/storageService';

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { article, isLoading } = useArticle(id || '');
  const { user } = useAuth();
  const { bookmarks, mutate: mutateBookmarks } = useBookmarks(user?.uid);

  const isBookmarked = bookmarks.includes(id || '');

  const handleBookmark = async () => {
    if (!user || !id) return;
    
    // Optimistic update
    const newBookmarks = isBookmarked 
      ? bookmarks.filter(b => b !== id) 
      : [...bookmarks, id];
    mutateBookmarks(newBookmarks, false);

    await toggleBookmark(user.id || user.uid, id, isBookmarked);
    mutateBookmarks();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.summary,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-black text-slate-900">Article not found</h2>
        <Link to="/news" className="mt-4 text-rose-600 font-bold hover:underline">Return to News</Link>
      </div>
    );
  }

  const coverUrl = article.imageUrl ? getImageUrl(article.imageUrl) : null;

  return (
    <article className="mx-auto max-w-3xl space-y-8 pb-16 animate-in fade-in duration-300">
      <Link to="/news" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Back to News
      </Link>

      <header className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-black text-rose-600 uppercase tracking-wider text-xs">{article.category || 'News'}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 font-medium text-xs">{new Date(article.publishedAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight md:leading-[1.15]">
          {article.title}
        </h1>
        
        {article.summary && (
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
            {article.summary}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-black">
              {(article.authorName || 'Maestro Editor').charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{article.authorName || 'Maestro Editor'}</p>
              <p className="text-xs text-slate-400 font-medium">Author</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {user && (
              <button 
                onClick={handleBookmark}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors cursor-pointer ${
                  isBookmarked 
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-label="Bookmark"
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </header>

      {coverUrl && (
        <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900/5 shadow-md border border-slate-200/80 w-full max-h-[520px] flex items-center justify-center p-1 sm:p-2">
          <img 
            src={coverUrl} 
            alt={article.title} 
            className="w-full max-h-[500px] object-contain rounded-xl sm:rounded-2xl" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="prose prose-slate max-w-none text-base sm:text-lg leading-relaxed text-slate-700 font-medium space-y-4">
        {article.content.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
