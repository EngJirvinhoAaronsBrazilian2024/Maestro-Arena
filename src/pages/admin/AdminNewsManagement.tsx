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
      <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{currentArticle.id ? 'Edit Article' : 'Compose New Article'}</h1>
            <p className="text-sm text-slate-500">Fill in the details below to {currentArticle.id ? 'update' : 'publish'} the news piece.</p>
          </div>
          <button
            onClick={() => { setIsEditing(false); setCurrentArticle({}); }}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Headline</label>
              <input
                type="text"
                placeholder="Breaking news headline..."
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 transition-all"
                value={currentArticle.title || ''}
                onChange={(e) => setCurrentArticle({ ...currentArticle, title: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Summary (Excerpt)</label>
              <textarea
                placeholder="A brief summary for the news feed..."
                className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 transition-all"
                rows={2}
                value={currentArticle.summary || ''}
                onChange={(e) => setCurrentArticle({ ...currentArticle, summary: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category</label>
                <input
                  type="text"
                  placeholder="e.g., Transfers, Match Report..."
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 transition-all"
                  value={currentArticle.category || ''}
                  onChange={(e) => setCurrentArticle({ ...currentArticle, category: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Cover Image</label>
                <ImageInput 
                  value={currentArticle.imageUrl || ''} 
                  onChange={(url) => setCurrentArticle({ ...currentArticle, imageUrl: url })}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Full Content</label>
              <textarea
                placeholder="Write the full article content here..."
                className="w-full min-h-[300px] rounded-lg border border-slate-300 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 transition-all"
                value={currentArticle.content || ''}
                onChange={(e) => setCurrentArticle({ ...currentArticle, content: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              onClick={() => { setIsEditing(false); setCurrentArticle({}); }}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave('draft')}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-900 transition-colors shadow-sm"
            >
              <Clock className="h-4 w-4" />
              Save as Draft
            </button>
            <button
              onClick={() => handleSave('published')}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors shadow-sm"
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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">News Management</h1>
          <p className="text-sm text-slate-500">Manage and publish articles to the news feed.</p>
        </div>
        <button
          onClick={() => { setCurrentArticle({}); setIsEditing(true); }}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Compose Article
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50">
          <div className="flex rounded-lg bg-slate-200 p-1">
            <button
              onClick={() => setActiveTab('published')}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                activeTab === 'published' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Published ({publishedArticles?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                activeTab === 'draft' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
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
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Article</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Author</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
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
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{article.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(article.publishedAt).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">{article.authorName}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setCurrentArticle(article); setIsEditing(true); }}
                          className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
            <div className="p-12 text-center text-slate-500">
              No articles found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
