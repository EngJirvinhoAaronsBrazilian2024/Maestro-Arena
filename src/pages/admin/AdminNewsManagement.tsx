import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useArticles } from '../../services/news/hooks';
import { createArticle, updateArticle, deleteArticle } from '../../services/newsService';
import { Article } from '../../types/sports';
import { ImageInput } from '../../components/ui/ImageInput';
import { Plus, Edit2, Trash2, Search, X, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function AdminNewsManagement() {
  const { user, userData: profile } = useAuth();
  const { articles: publishedArticles, mutate: mutatePublished } = useArticles('published');
  const { articles: draftArticles, mutate: mutateDrafts } = useArticles('draft');
  const [isEditing, setIsEditing] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Partial<Article>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'published' | 'draft'>('published');

  const handleSave = async (status: 'draft' | 'published') => {
    try {
      const validAuthorId = user?.id || (user as any)?.uid || '2886ae6d-b563-44a3-b4b8-ae932cc188ad';
      if (currentArticle.id) {
        await updateArticle(currentArticle.id, {
          ...currentArticle,
          status,
          publishedAt: currentArticle.publishedAt || Date.now()
        });
        toast.success(`Article ${status === 'published' ? 'published' : 'saved as draft'}!`);
      } else {
        await createArticle({
          title: currentArticle.title || 'Untitled',
          content: currentArticle.content || '',
          summary: currentArticle.summary || '',
          category: currentArticle.category || 'News',
          imageUrl: currentArticle.imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2',
          authorId: validAuthorId,
          authorName: profile?.displayName || user?.email || 'Admin Editor',
          status,
          publishedAt: Date.now()
        });
        toast.success(`New article ${status === 'published' ? 'published' : 'created as draft'}!`);
      }
      setIsEditing(false);
      setCurrentArticle({});
      mutatePublished();
      mutateDrafts();
    } catch (error: any) {
      console.error("Error saving article:", error);
      toast.error(error.message || "Failed to save article.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      try {
        await deleteArticle(id);
        toast.success("Article deleted");
        mutatePublished();
        mutateDrafts();
      } catch (err: any) {
        toast.error("Failed to delete article: " + err.message);
      }
    }
  };

  const allArticles = activeTab === 'published' ? publishedArticles : draftArticles;
  const filteredArticles = allArticles?.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isEditing) {
    return (
      <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Maestro Newsroom</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">{currentArticle.id ? 'Edit Article' : 'Compose New Article'}</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Fill in the details below to {currentArticle.id ? 'update' : 'publish'} the news piece.</p>
          </div>
          <button
            onClick={() => { setIsEditing(false); setCurrentArticle({}); }}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Headline</label>
              <input
                type="text"
                placeholder="Breaking news headline..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                value={currentArticle.title || ''}
                onChange={(e) => setCurrentArticle({ ...currentArticle, title: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Summary (Excerpt)</label>
              <textarea
                placeholder="A brief summary for the news feed..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                rows={2}
                value={currentArticle.summary || ''}
                onChange={(e) => setCurrentArticle({ ...currentArticle, summary: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Category</label>
                <input
                  type="text"
                  placeholder="e.g., Transfers, Match Report..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                  value={currentArticle.category || ''}
                  onChange={(e) => setCurrentArticle({ ...currentArticle, category: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Cover Image</label>
                <ImageInput 
                  value={currentArticle.imageUrl || ''} 
                  onChange={(url) => setCurrentArticle({ ...currentArticle, imageUrl: url })}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Full Content</label>
              <textarea
                placeholder="Write the full article content here..."
                className="w-full min-h-[300px] rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                value={currentArticle.content || ''}
                onChange={(e) => setCurrentArticle({ ...currentArticle, content: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              onClick={() => { setIsEditing(false); setCurrentArticle({}); }}
              className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave('draft')}
              className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Clock className="h-4 w-4" />
              Save as Draft
            </button>
            <button
              onClick={() => handleSave('published')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-6 py-2.5 text-xs sm:text-sm font-black text-white transition-all shadow-md shadow-rose-600/25 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              Publish Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Maestro Newsroom</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">News Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Manage and publish articles to the news feed.</p>
        </div>
        <button
          onClick={() => { setCurrentArticle({}); setIsEditing(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-5 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-rose-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Compose Article
        </button>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/70">
          <div className="flex rounded-xl bg-slate-200/80 p-1">
            <button
              onClick={() => setActiveTab('published')}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
                activeTab === 'published' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Published ({publishedArticles?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
                activeTab === 'draft' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Drafts ({draftArticles?.length || 0})
            </button>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs sm:text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-black border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Article</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <AnimatePresence>
                {filteredArticles?.map(article => (
                  <motion.tr 
                    key={article.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-rose-50/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{article.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{new Date(article.publishedAt).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-md bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 text-xs font-black text-rose-700">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 text-xs sm:text-sm">{article.authorName}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setCurrentArticle(article); setIsEditing(true); }}
                          className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Edit Article"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {(!filteredArticles || filteredArticles.length === 0) && (
            <div className="p-12 text-center text-slate-500 font-medium text-sm">
              No articles found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
