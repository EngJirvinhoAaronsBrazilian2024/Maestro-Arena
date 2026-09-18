import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArticle, useBookmarks } from '../services/news/hooks';
import { toggleBookmark } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import { Bookmark, Share2, ArrowLeft } from 'lucide-react';

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
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold">Article not found</h2>
        <Link to="/news" className="mt-4 text-blue-600 hover:underline">Return to News</Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-8 pb-16">
      <Link to="/news" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to News
      </Link>

      <header className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-bold text-blue-600 uppercase tracking-wider">{article.category || 'News'}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">{new Date(article.publishedAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:leading-[1.1]">{article.title}</h1>
        
        <p className="text-xl text-slate-600 leading-relaxed">
          {article.summary}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-bold">
              {article.authorName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold">{article.authorName}</p>
              <p className="text-xs text-slate-500">Author</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
            {user && (
              <button 
                onClick={handleBookmark}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  isBookmarked 
                    ? 'bg-green-100 text-blue-600 hover:bg-blue-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-label="Bookmark"
              >
                <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </header>

      {article.imageUrl && (
        <div className="overflow-hidden rounded-2xl bg-slate-100 aspect-[21/9] shadow-md border border-slate-100">
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="prose prose-slate max-w-none text-lg leading-relaxed">
        {article.content.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
