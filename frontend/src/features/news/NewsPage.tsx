import { useEffect, useMemo, useState } from 'react';
import { collectNews, fetchNewsArticles, fetchNewsCollectRuns, type NewsArticle, type NewsCollectRun } from './api';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function NewsPage() {
  const [targetDate, setTargetDate] = useState(formatDateInput(yesterday));
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [runs, setRuns] = useState<NewsCollectRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const [articleResult, runResult] = await Promise.all([
        fetchNewsArticles(targetDate),
        fetchNewsCollectRuns()
      ]);
      setArticles(articleResult);
      setRuns(runResult);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Failed to load news data.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [targetDate]);

  async function handleCollect() {
    setIsCollecting(true);
    setError(null);
    setStatusMessage(null);
    try {
      const result = await collectNews(targetDate);
      setStatusMessage(
        result.status === 'completed'
          ? `Collect completed: ${result.count} article(s)`
          : result.status === 'failed'
            ? `Collect failed: ${result.error_message ?? 'Unknown error'}`
            : `Collect skipped for ${targetDate}`
      );
      await refresh();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Failed to collect news.');
    } finally {
      setIsCollecting(false);
    }
  }

  const latestRun = useMemo(() => runs[0], [runs]);

  return (
    <main className="schedule-shell">
      <header className="schedule-hero">
        <div>
          <p className="eyebrow">News Collector</p>
          <h1>Policy briefing collection</h1>
          <p className="lead">
            Collect Korea.kr articles for a chosen date, review the latest run status, and inspect failures directly on screen.
          </p>
        </div>
        <div className="hero-actions">
          <label className="news-date-field">
            Target date
            <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
          </label>
          <button type="button" className="primary-button" onClick={handleCollect} disabled={isCollecting}>
            {isCollecting ? 'Collecting...' : 'Run collection'}
          </button>
        </div>
      </header>

      <section className="toolbar-card news-toolbar">
        <div>
          <p className="eyebrow">Latest run</p>
          <strong>{latestRun ? `${latestRun.status} / ${latestRun.mode}` : 'No runs yet'}</strong>
          <div className="news-meta-row">
            <span>{latestRun ? `Date: ${latestRun.collect_date}` : 'Date: -'}</span>
            <span>{latestRun ? `Started: ${latestRun.started_at}` : 'Started: -'}</span>
          </div>
        </div>
        <div className="news-summary-card">
          <span className="news-summary-label">Articles in DB</span>
          <strong>{articles.length}</strong>
          <span className="news-summary-caption">Showing articles for {targetDate}</span>
        </div>
      </section>

      {statusMessage && <div className="empty-state">{statusMessage}</div>}
      {error && <div className="error-banner">{error}</div>}

      <section className="schedule-layout news-layout">
        <section className="calendar-card">
          <div className="section-heading">
            <p className="eyebrow">Collected articles</p>
            <h2>Articles</h2>
          </div>
          {isLoading ? (
            <p className="empty-state">Loading news...</p>
          ) : articles.length === 0 ? (
            <p className="empty-state">No articles stored for this date.</p>
          ) : (
            <div className="news-list">
              {articles.map((article) => (
                <article className="news-card" key={article.id}>
                  <div className="news-card-head">
                    <span className="type-badge">{article.source}</span>
                    <span className="news-date-pill">{article.published_at}</span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.summary ?? 'No summary captured.'}</p>
                  <a href={article.url} target="_blank" rel="noreferrer">
                    Open source
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="member-card">
          <div className="section-heading">
            <p className="eyebrow">Run history</p>
            <h2>Collection runs</h2>
          </div>
          <div className="news-run-list">
            {runs.length === 0 ? (
              <p className="empty-state">No collection history yet.</p>
            ) : (
              runs.map((run) => (
                <article className={`news-run ${run.status}`} key={run.id}>
                  <div className="news-run-head">
                    <strong>{run.collect_date}</strong>
                    <span className={`status-pill ${run.status}`}>{run.status}</span>
                  </div>
                  <div className="news-run-meta">
                    <span>{run.mode}</span>
                    <span>{run.started_at}</span>
                  </div>
                  {run.error_message && <p className="news-run-error">{run.error_message}</p>}
                </article>
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
