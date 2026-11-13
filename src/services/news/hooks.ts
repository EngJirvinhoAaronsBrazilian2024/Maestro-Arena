import { useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  getArticles,
  getArticleById,
  getBookmarks,
  getLocalBookmarks,
  getReadingHistory,
  ReadingHistoryItem,
  BOOKMARKS_UPDATED_EVENT,
  READING_HISTORY_UPDATED_EVENT,
} from '../newsService';

export function useArticles(status: 'draft' | 'published' = 'published') {
  const { data, error, isLoading, mutate } = useSWR(
    `articles_${status}`,
    () => getArticles(status),
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
      dedupingInterval: 2000
    }
  );
  return { articles: data, isLoading, isError: error, mutate };
}

export function useArticle(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `article_${id}` : null,
    () => getArticleById(id),
    {
      revalidateOnFocus: true
    }
  );
  return { article: data, isLoading, isError: error, mutate };
}

export function useBookmarks(userId?: string) {
  const effectiveUser = userId || 'guest';
  const { data, error, isLoading, mutate } = useSWR(
    `bookmarks_${effectiveUser}`,
    () => getBookmarks(effectiveUser),
    {
      fallbackData: getLocalBookmarks(effectiveUser),
      revalidateOnFocus: true
    }
  );

  useEffect(() => {
    const sync = () => {
      mutate(getLocalBookmarks(effectiveUser), false);
    };
    window.addEventListener(BOOKMARKS_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(BOOKMARKS_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [effectiveUser, mutate]);

  return { bookmarks: data || [], isLoading, isError: error, mutate };
}

export function useReadingHistory(userId?: string) {
  const effectiveUser = userId || 'guest';
  const [history, setHistory] = useState<ReadingHistoryItem[]>(() => getReadingHistory(effectiveUser));

  const refresh = useCallback(() => {
    setHistory(getReadingHistory(effectiveUser));
  }, [effectiveUser]);

  useEffect(() => {
    refresh();
    window.addEventListener(READING_HISTORY_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(READING_HISTORY_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return { history, refresh };
}
