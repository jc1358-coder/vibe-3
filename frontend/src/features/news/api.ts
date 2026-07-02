import { apiGet, apiPost } from '../../shared/api/client';

export type NewsArticle = {
  id: number;
  source: string;
  title: string;
  url: string;
  summary: string | null;
  published_at: string;
  collected_date: string;
  collected_at: string;
};

export type NewsCollectRun = {
  id: number;
  source: string;
  collect_date: string;
  mode: string;
  status: 'running' | 'completed' | 'failed' | 'skipped' | string;
  started_at: string;
  ended_at: string | null;
  error_message: string | null;
};

export type NewsCollectResponse = {
  target_date: string;
  mode: string;
  status: string;
  count: number;
  items: NewsArticle[];
  error_message?: string;
};

export async function fetchNewsArticles(targetDate?: string): Promise<NewsArticle[]> {
  const path = targetDate ? `/api/news/articles?date=${encodeURIComponent(targetDate)}` : '/api/news/articles';
  const response = await apiGet<{ items: NewsArticle[] }>(path);
  return response.items;
}

export async function fetchNewsCollectRuns(): Promise<NewsCollectRun[]> {
  const response = await apiGet<{ items: NewsCollectRun[] }>('/api/news/collect-runs');
  return response.items;
}

export function collectNews(targetDate: string): Promise<NewsCollectResponse> {
  return apiPost<NewsCollectResponse>('/api/news/collect', { target_date: targetDate });
}
