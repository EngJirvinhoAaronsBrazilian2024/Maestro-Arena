import useSWR from 'swr';
import { getArticles, getArticleById, getBookmarks } from '../newsService';

export function useArticles(status: 'draft' | 'published' = 'published') {
  const { data, error, isLoading, mutate } = useSWR(
    `articles_${status}`,
    () => getArticles(status)
  );
  return { articles: data, isLoading, isError: error, mutate };
}

export function useArticle(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `article_${id}` : null,
    () => getArticleById(id)
  );
  return { article: data, isLoading, isError: error, mutate };
}

export function useBookmarks(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `bookmarks_${userId}` : null,
    () => getBookmarks(userId!)
  );
  return { bookmarks: data || [], isLoading, isError: error, mutate };
}
