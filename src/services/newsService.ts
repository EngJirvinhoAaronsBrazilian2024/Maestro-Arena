import { insforge } from '../lib/insforge';
import { Article } from '../types/sports';

export async function getArticles(status: 'draft' | 'published' = 'published'): Promise<Article[]> {
  try {
    const { data, error } = await insforge.database
      .from('articles')
      .select('*')
      .eq('status', status)
      .order('published_at', { ascending: false });
      
    if (error) throw error;
    
    return (data || []).map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      imageUrl: a.image_url,
      authorId: a.author_id,
      status: a.status,
      category: a.category,
      publishedAt: a.published_at
    } as any)); // as any to avoid type complaints for now
  } catch (error: any) {
    const isNetworkError = error?.message?.includes('timed out') || error?.message?.includes('Failed to fetch') || error?.message?.includes('Network request failed');
    if (!isNetworkError) {
      console.error("Error fetching articles:", error);
    }
    return [];
  }
}

export async function getArticleById(id: string): Promise<Article | null> {
  try {
    const { data, error } = await insforge.database
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    if (data) {
      return {
        id: data.id,
        title: data.title,
        content: data.content,
        imageUrl: data.image_url,
        authorId: data.author_id,
        status: data.status,
        category: data.category,
        publishedAt: data.published_at
      } as any;
    }
    return null;
  } catch (error: any) {
    const isNetworkError = error?.message?.includes('timed out') || error?.message?.includes('Failed to fetch') || error?.message?.includes('Network request failed');
    if (!isNetworkError) {
      console.error("Error fetching article:", error);
    }
    return null;
  }
}

// Editor actions
export async function createArticle(article: Omit<Article, 'id'>): Promise<string> {
  try {
    const res = await fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
    if (res.ok) {
      const data = await res.json();
      return data.id || 'ok';
    }
  } catch (e) {
    // fallback
  }

  const { data, error } = await insforge.database
    .from('articles')
    .insert([{
      title: article.title,
      content: article.content,
      image_url: article.imageUrl,
      author_id: article.authorId || '2886ae6d-b563-44a3-b4b8-ae932cc188ad',
      status: article.status,
      category: article.category || 'general',
      published_at: article.publishedAt
    }])
    .select()
    .single();
    
  if (error) throw error;
  return data.id;
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<void> {
  try {
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) return;
  } catch (e) {
    // fallback
  }

  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
  if (updates.authorId !== undefined) payload.author_id = updates.authorId;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.publishedAt !== undefined) payload.published_at = updates.publishedAt;

  const { error } = await insforge.database
    .from('articles')
    .update(payload)
    .eq('id', id);
    
  if (error) throw error;
}

export async function deleteArticle(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
    if (res.ok) return;
  } catch (e) {
    // fallback
  }

  const { error } = await insforge.database
    .from('articles')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

// Bookmarks
export async function getBookmarks(userId: string): Promise<string[]> {
  try {
    const { data, error } = await insforge.database
      .from('bookmarks')
      .select('article_id')
      .eq('user_id', userId);
      
    if (error) throw error;
    return (data || []).map(b => b.article_id);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return [];
  }
}

export async function toggleBookmark(userId: string, articleId: string, isBookmarked: boolean): Promise<void> {
  try {
    if (isBookmarked) {
      const { error } = await insforge.database
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId);
      if (error) throw error;
    } else {
      const { error } = await insforge.database
        .from('bookmarks')
        .insert([{
          user_id: userId,
          article_id: articleId,
          created_at: Date.now()
        }]);
      if (error) throw error;
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
  }
}
