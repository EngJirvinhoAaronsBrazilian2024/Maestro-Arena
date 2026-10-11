import { insforge } from '../lib/insforge';
import { Article } from '../types/sports';
import { getImageUrl } from './storageService';

const CACHE_KEY = 'sportshub_articles_cache';

const SEED_ARTICLES: Article[] = [
  {
    id: '50404b0f-257d-480f-8cec-557a5bdc76dc',
    title: 'Manchester united grab their first win of the Women Super League.',
    content: 'Manchester united through Andrea Medina and Elizabeth Terland have scooped a 2-1 victory over Westham United at home as they keep their eyes on European football come next season under Coach Eva Olid.',
    summary: 'Eva Olid coming back to winning ways at Manchester united.',
    imageUrl: 'https://gci83gu5.us-east.insforge.app/api/storage/buckets/images/objects/1790527440883-1001262153.jpg',
    authorId: '2886ae6d-b563-44a3-b4b8-ae932cc188ad',
    authorName: 'Jirvinho Brazilian sports maestro',
    status: 'published',
    category: 'Women premier league ',
    publishedAt: 1790527342550
  },
  {
    id: 'c89d7268-6ddc-41b6-b93a-f197302ed8ba',
    title: 'Halaand meets his idol in a tight game tonight 🔥',
    content: 'Today at exactly 9:45pm, a game between the goal machine currently, Halaand and the all time goal machine face Ronaldo meet in the second game of the UEFA Nations league tension emerge to CR7 fans to the critisms from haters over Jorge Jesus starting the old man in the game.Lets wait to seen whether he starts in the second consecutive game under the new manager.',
    summary: 'Today at exactly 9:45pm, a game between the goal machine currently, Halaand and the all time goal machine face Ronaldo meet in the second game of the UEFA Nations league tension em...',
    imageUrl: 'https://gci83gu5.us-east.insforge.app/api/storage/buckets/images/objects/1790526541744-1001262147.jpg',
    authorId: '2886ae6d-b563-44a3-b4b8-ae932cc188ad',
    authorName: 'Jirvinho Brazilian sports maestro',
    status: 'published',
    category: 'Trending news',
    publishedAt: 1790526783374
  }
];

function getCachedArticles(): Article[] {
  if (typeof window === 'undefined') return SEED_ARTICLES;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore localStorage errors
  }
  return SEED_ARTICLES;
}

function saveCachedArticles(articles: Article[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(articles));
  } catch (e) {
    // ignore
  }
}

export async function getArticles(status: 'draft' | 'published' = 'published'): Promise<Article[]> {
  // 1. Prioritize backend routes (uses service role admin client to bypass client RLS/key restrictions)
  try {
    // Try /api/articles or fallback to /api/admin/articles
    let res = await fetch('/api/articles').catch(() => null);
    if (!res || !res.ok) {
      res = await fetch('/api/admin/articles').catch(() => null);
    }

    if (res && res.ok) {
      const rawData = await res.json();
      if (Array.isArray(rawData)) {
        const normalized: Article[] = rawData.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content || '',
          summary: a.summary || (a.content ? a.content.slice(0, 180) + '...' : ''),
          imageUrl: a.imageUrl || a.image_url ? getImageUrl(a.imageUrl || a.image_url) : undefined,
          authorId: a.authorId || a.author_id,
          authorName: a.authorName || a.author_name || 'Jirvinho Brazilian sports maestro',
          status: a.status,
          category: a.category || 'Football',
          publishedAt: Number(a.publishedAt || a.published_at || Date.now())
        }));

        // Cache all articles for offline / instant availability
        saveCachedArticles(normalized);

        return normalized.filter(a => a.status === status);
      }
    }
  } catch (routeErr) {
    // Quiet warning, continue to secondary fallback
    console.warn('Backend articles fetch notice:', routeErr);
  }

  // 2. Secondary fallback: direct InsForge SDK query (if client credentials are valid)
  try {
    const { data, error } = await insforge.database
      .from('articles')
      .select('*')
      .eq('status', status)
      .order('published_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const parsed: Article[] = data.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content || '',
        summary: a.summary || (a.content ? a.content.slice(0, 180) + '...' : ''),
        imageUrl: a.image_url ? getImageUrl(a.image_url) : undefined,
        authorId: a.author_id,
        authorName: a.author_name || 'Jirvinho Brazilian sports maestro',
        status: a.status,
        category: a.category || 'Football',
        publishedAt: Number(a.published_at || Date.now())
      }));

      if (parsed.length > 0) {
        return parsed;
      }
    }
  } catch (sdkErr) {
    // InsForge direct query not available in browser client
  }

  // 3. Resilient cache fallback: return cached or seed articles smoothly
  const cached = getCachedArticles();
  return cached.filter(a => a.status === status);
}

export async function getArticleById(id: string): Promise<Article | null> {
  // Check local cache first for instant lookup
  const cached = getCachedArticles();
  const cachedMatch = cached.find(a => a.id === id);

  // 1. Try backend routes
  try {
    let res = await fetch('/api/articles').catch(() => null);
    if (!res || !res.ok) {
      res = await fetch('/api/admin/articles').catch(() => null);
    }
    if (res && res.ok) {
      const list = await res.json();
      const found = (list || []).find((a: any) => a.id === id);
      if (found) {
        return {
          id: found.id,
          title: found.title,
          content: found.content || '',
          summary: found.summary || (found.content ? found.content.slice(0, 180) + '...' : ''),
          imageUrl: found.imageUrl || found.image_url ? getImageUrl(found.imageUrl || found.image_url) : undefined,
          authorId: found.authorId || found.author_id,
          authorName: found.authorName || found.author_name || 'Jirvinho Brazilian sports maestro',
          status: found.status,
          category: found.category || 'Football',
          publishedAt: Number(found.publishedAt || found.published_at || Date.now())
        };
      }
    }
  } catch (e) {
    // Quiet warning
  }

  // 2. Direct InsForge query fallback
  try {
    const { data, error } = await insforge.database
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        title: data.title,
        content: data.content || '',
        summary: data.summary || (data.content ? data.content.slice(0, 180) + '...' : ''),
        imageUrl: data.image_url ? getImageUrl(data.image_url) : undefined,
        authorId: data.author_id,
        authorName: data.author_name || 'Jirvinho Brazilian sports maestro',
        status: data.status,
        category: data.category || 'Football',
        publishedAt: Number(data.published_at || Date.now())
      };
    }
  } catch (directErr) {
    // Ignore
  }

  // 3. Fallback to cached match or seed
  return cachedMatch || SEED_ARTICLES.find(a => a.id === id) || null;
}

export async function createArticle(article: Omit<Article, 'id'>): Promise<string> {
  // 1. Try backend route (uses service role admin client)
  try {
    const res = await fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...article,
        authorName: article.authorName || 'Jirvinho Brazilian sports maestro'
      })
    });
    if (res.ok) {
      const data = await res.json();
      try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
      return data.id || 'ok';
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  } catch (e: any) {
    // If it's a validation error or known server error from response, throw immediately
    if (e.message && !e.message.includes('Failed to fetch') && !e.message.includes('NetworkError')) {
      throw e;
    }
    console.warn('POST /api/admin/articles failed, trying direct insert:', e);
  }

  // 2. Direct insert fallback
  const { data, error } = await insforge.database
    .from('articles')
    .insert([{
      title: article.title,
      content: article.content,
      summary: article.summary || (article.content ? article.content.slice(0, 180) + '...' : ''),
      image_url: article.imageUrl,
      author_id: article.authorId || '2886ae6d-b563-44a3-b4b8-ae932cc188ad',
      author_name: article.authorName || 'Jirvinho Brazilian sports maestro',
      status: article.status || 'published',
      category: article.category || 'Football',
      published_at: article.publishedAt || Date.now()
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Direct InsForge insert error for article:', error);
    throw new Error(error.message || 'Failed to create article in database');
  }
  return data.id;
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<void> {
  // 1. Try backend route
  try {
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
      return;
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  } catch (e: any) {
    if (e.message && !e.message.includes('Failed to fetch') && !e.message.includes('NetworkError')) {
      throw e;
    }
    console.warn(`PUT /api/admin/articles/${id} failed, trying direct update:`, e);
  }

  // 2. Direct update fallback
  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.summary !== undefined) payload.summary = updates.summary;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
  if (updates.authorId !== undefined) payload.author_id = updates.authorId;
  if (updates.authorName !== undefined) payload.author_name = updates.authorName;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.publishedAt !== undefined) payload.published_at = updates.publishedAt;

  const { error } = await insforge.database
    .from('articles')
    .update(payload)
    .eq('id', id);
    
  if (error) {
    console.error('Direct InsForge update error for article:', error);
    throw new Error(error.message || 'Failed to update article in database');
  }
}

export async function deleteArticle(id: string): Promise<void> {
  // 1. Try backend route
  try {
    const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
    if (res.ok) {
      try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
      return;
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  } catch (e: any) {
    if (e.message && !e.message.includes('Failed to fetch') && !e.message.includes('NetworkError')) {
      throw e;
    }
    console.warn(`DELETE /api/admin/articles/${id} failed, trying direct delete:`, e);
  }

  // 2. Direct delete fallback
  try {
    await insforge.database.from('bookmarks').delete().eq('article_id', id);
  } catch (bkErr) {}
  
  const { error } = await insforge.database
    .from('articles')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Direct InsForge delete error for article:', error);
    throw new Error(error.message || 'Failed to delete article from database');
  }
}

// Bookmarks
export async function getBookmarks(userId: string): Promise<string[]> {
  try {
    const { data, error } = await insforge.database
      .from('bookmarks')
      .select('article_id')
      .eq('user_id', userId);
      
    if (error) return [];
    return (data || []).map(b => b.article_id);
  } catch (error) {
    return [];
  }
}

export async function toggleBookmark(userId: string, articleId: string, isBookmarked: boolean): Promise<void> {
  try {
    if (isBookmarked) {
      await insforge.database
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId);
    } else {
      await insforge.database
        .from('bookmarks')
        .insert([{
          user_id: userId,
          article_id: articleId,
          created_at: Date.now()
        }]);
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
  }
}
