import { insforge } from '../lib/insforge';
import { sanitizeNewsText } from '../lib/newsText';
import { Article } from '../types/sports';
import { getImageUrl } from './storageService';

const CACHE_KEY = 'sportshub_articles_cache_v3';
const MAX_NEWS_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const DEPRECATED_AUTHORS = new Set(['Sky Sports Transfer Centre', 'Marca Football']);

function normalizeArticleRecord(a: any): Article {
  const cleanTitle = sanitizeNewsText(a.title || '', false);
  const cleanContent = sanitizeNewsText(a.content || '', true);
  const rawSummary = a.summary ? sanitizeNewsText(a.summary, false) : '';
  const cleanSummary =
    rawSummary && rawSummary.length >= 20
      ? rawSummary
      : cleanContent
      ? (cleanContent.length > 180 ? cleanContent.slice(0, 177).trimEnd() + '...' : cleanContent)
      : '';

  return {
    id: a.id,
    title: cleanTitle,
    content: cleanContent,
    summary: cleanSummary,
    imageUrl: a.imageUrl || a.image_url ? getImageUrl(a.imageUrl || a.image_url) : undefined,
    authorId: a.authorId || a.author_id || '',
    authorName: a.authorName || a.author_name || 'Jirvinho Brazilian sports maestro',
    status: a.status || 'published',
    category: a.category || 'Football',
    publishedAt: Number(a.publishedAt || a.published_at || 0),
  };
}

function isFreshClientArticle(a: Partial<Article>): boolean {
  const author = String(a.authorName || '');
  if (DEPRECATED_AUTHORS.has(author)) return false;

  const ts = Number(a.publishedAt || 0);
  if (!Number.isFinite(ts) || ts <= 0) return false;

  const now = Date.now();
  if (ts > now + 6 * 60 * 60 * 1000) return false;
  if (now - ts > MAX_NEWS_AGE_MS) return false;

  const nowDate = new Date(now);
  const pubDate = new Date(ts);
  const currentYear = nowDate.getUTCFullYear();
  const pubYear = pubDate.getUTCFullYear();
  const isEarlyJan = nowDate.getUTCMonth() === 0 && nowDate.getUTCDate() <= 14;
  if (pubYear < currentYear && !(isEarlyJan && pubYear === currentYear - 1)) {
    return false;
  }

  return true;
}

function sanitizeAndDedupeArticles(list: Article[]): Article[] {
  const seen = new Set<string>();
  const sorted = [...list].sort((a, b) => Number(b.publishedAt || 0) - Number(a.publishedAt || 0));
  const result: Article[] = [];

  for (const a of sorted) {
    if (a.status === 'published' && !isFreshClientArticle(a)) continue;
    const key = (a.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    result.push(a);
  }
  return result;
}

function getCachedArticles(): Article[] {
  if (typeof window === 'undefined') return [];
  try {
    localStorage.removeItem('sportshub_articles_cache');
    localStorage.removeItem('sportshub_articles_cache_v2');
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeAndDedupeArticles(parsed.map(normalizeArticleRecord));
      }
    }
  } catch (e) {
    // ignore localStorage errors
  }
  return [];
}

function saveCachedArticles(articles: Article[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(sanitizeAndDedupeArticles(articles)));
  } catch (e) {
    // ignore
  }
}

export async function getArticles(status: 'draft' | 'published' = 'published'): Promise<Article[]> {
  // 1. Prioritize backend routes (uses service role admin client to bypass client RLS/key restrictions)
  try {
    let res = await fetch('/api/articles').catch(() => null);
    if (!res || !res.ok) {
      res = await fetch('/api/admin/articles').catch(() => null);
    }

    if (res && res.ok) {
      const rawData = await res.json();
      if (Array.isArray(rawData)) {
        const normalized: Article[] = rawData.map(normalizeArticleRecord);

        const clean = sanitizeAndDedupeArticles(normalized);
        saveCachedArticles(clean);

        return clean.filter(a => a.status === status);
      }
    }
  } catch (routeErr) {
    console.warn('Backend articles fetch notice:', routeErr);
  }

  // 2. Secondary fallback: direct InsForge SDK query (if client credentials are valid)
  try {
    const cutoff = Date.now() - MAX_NEWS_AGE_MS;
    const { data, error } = await insforge.database
      .from('articles')
      .select('*')
      .eq('status', status)
      .gte('published_at', cutoff)
      .order('published_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const parsed: Article[] = data.map(normalizeArticleRecord);

      const clean = sanitizeAndDedupeArticles(parsed);
      if (clean.length > 0) {
        return clean;
      }
    }
  } catch (sdkErr) {
    // InsForge direct query not available in browser client
  }

  // 3. Resilient cache fallback: return only fresh cached articles
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
        return normalizeArticleRecord({ ...found, publishedAt: found.publishedAt || found.published_at || Date.now() });
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
      return normalizeArticleRecord({ ...data, published_at: data.published_at || Date.now() });
    }
  } catch (directErr) {
    // Ignore
  }

  // 3. Fallback to cached match
  return cachedMatch || null;
}

export async function getFullArticleById(id: string): Promise<Article | null> {
  try {
    let res = await fetch(`/api/articles/${encodeURIComponent(id)}/full`).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(`/api/admin/articles/${encodeURIComponent(id)}/full`).catch(() => null);
    }
    if (res && res.ok) {
      const a = await res.json();
      if (a && a.id) {
        const enriched = normalizeArticleRecord({
          ...a,
          publishedAt: a.publishedAt || a.published_at || Date.now(),
        });

        // Update cached list so reopening this story stays full & instant
        const existingCache = getCachedArticles();
        if (existingCache.length > 0) {
          saveCachedArticles(existingCache.map(item => (item.id === enriched.id ? enriched : item)));
        }
        return enriched;
      }
    }
  } catch {
    // Fallback to standard lookup
  }
  return getArticleById(id);
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

// Bookmarks & Saved Article Snapshots
const BOOKMARKS_UPDATED_EVENT = 'sportshub_bookmarks_updated';
const READING_HISTORY_UPDATED_EVENT = 'sportshub_reading_history_updated';

function getBookmarksKey(userId?: string) {
  return `sportshub_bookmarks_${userId || 'guest'}`;
}

function getBookmarkSnapshotsKey(userId?: string) {
  return `sportshub_bookmark_snapshots_${userId || 'guest'}`;
}

function getHistoryKey(userId?: string) {
  return `sportshub_reading_history_${userId || 'guest'}`;
}

export interface ReadingHistoryItem {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  authorName?: string;
  imageUrl?: string;
  publishedAt: number;
  readAt: number;
}

export function getLocalBookmarks(userId?: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getBookmarksKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveLocalBookmarks(userId: string | undefined, ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const unique = Array.from(new Set(ids));
    localStorage.setItem(getBookmarksKey(userId), JSON.stringify(unique));
    window.dispatchEvent(new CustomEvent(BOOKMARKS_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

export function getSavedArticleSnapshots(userId?: string): Article[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getBookmarkSnapshotsKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeArticleRecord) : [];
  } catch {
    return [];
  }
}

export function upsertSavedArticleSnapshot(userId: string | undefined, article: Article, remove = false) {
  if (typeof window === 'undefined' || !article?.id) return;
  try {
    const current = getSavedArticleSnapshots(userId).filter((a) => a.id !== article.id);
    const updated = remove ? current : [article, ...current].slice(0, 60);
    localStorage.setItem(getBookmarkSnapshotsKey(userId), JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export async function getBookmarks(userId: string): Promise<string[]> {
  const local = getLocalBookmarks(userId);
  if (!userId || userId === 'guest') return local;

  try {
    const { data, error } = await insforge.database
      .from('bookmarks')
      .select('article_id')
      .eq('user_id', userId);

    if (error) return local;
    const remote = (data || []).map((b: any) => b.article_id).filter(Boolean);
    const merged = Array.from(new Set([...remote, ...local]));
    if (merged.length !== local.length) {
      saveLocalBookmarks(userId, merged);
    }
    return merged;
  } catch {
    return local;
  }
}

export async function toggleBookmark(
  userId: string | undefined,
  articleId: string,
  isBookmarked: boolean,
  articleSnapshot?: Article
): Promise<string[]> {
  const effectiveUser = userId || 'guest';
  const current = getLocalBookmarks(effectiveUser);
  const next = isBookmarked
    ? current.filter((id) => id !== articleId)
    : Array.from(new Set([articleId, ...current]));

  saveLocalBookmarks(effectiveUser, next);
  if (articleSnapshot) {
    upsertSavedArticleSnapshot(effectiveUser, articleSnapshot, isBookmarked);
  }

  if (userId && userId !== 'guest') {
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
            created_at: Date.now(),
          }]);
      }
    } catch (error) {
      console.warn('Bookmark remote sync notice (saved locally):', error);
    }
  }

  return next;
}

// Reading History
export function getReadingHistory(userId?: string): ReadingHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getHistoryKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: any) => ({
        ...item,
        title: sanitizeNewsText(item.title || '', false),
        summary: item.summary ? sanitizeNewsText(item.summary, false) : item.summary,
      }))
      .sort((a, b) => Number(b.readAt || 0) - Number(a.readAt || 0));
  } catch {
    return [];
  }
}

export function recordReadingHistory(article: Article, userId?: string): ReadingHistoryItem[] {
  if (typeof window === 'undefined' || !article?.id) return [];
  try {
    const current = getReadingHistory(userId).filter((item) => item.id !== article.id);
    const entry: ReadingHistoryItem = {
      id: article.id,
      title: article.title,
      summary: article.summary,
      category: article.category,
      authorName: article.authorName,
      imageUrl: article.imageUrl,
      publishedAt: Number(article.publishedAt || Date.now()),
      readAt: Date.now(),
    };
    const updated = [entry, ...current].slice(0, 40);
    localStorage.setItem(getHistoryKey(userId), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(READING_HISTORY_UPDATED_EVENT));
    return updated;
  } catch {
    return [];
  }
}

export function removeReadingHistoryItem(articleId: string, userId?: string): ReadingHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const updated = getReadingHistory(userId).filter((item) => item.id !== articleId);
    localStorage.setItem(getHistoryKey(userId), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(READING_HISTORY_UPDATED_EVENT));
    return updated;
  } catch {
    return [];
  }
}

export function clearReadingHistory(userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getHistoryKey(userId));
    window.dispatchEvent(new CustomEvent(READING_HISTORY_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

export { BOOKMARKS_UPDATED_EVENT, READING_HISTORY_UPDATED_EVENT };

