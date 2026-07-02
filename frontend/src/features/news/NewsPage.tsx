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
      setError(unknownError instanceof Error ? unknownError.message : '뉴스 데이터를 불러오지 못했습니다.');
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
          ? `수집 완료: ${result.count}건`
          : result.status === 'failed'
            ? `수집 실패: ${result.error_message ?? '알 수 없는 오류'}`
            : `수집 생략: ${targetDate}`
      );
      await refresh();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : '뉴스 수집에 실패했습니다.');
    } finally {
      setIsCollecting(false);
    }
  }

  const latestRun = useMemo(() => runs[0], [runs]);

  return (
    <main className="schedule-shell">
      <header className="schedule-hero">
        <div>
          <p className="eyebrow">뉴스 수집</p>
          <h1>정책브리핑 기사 수집</h1>
          <p className="lead">
            선택한 날짜의 정책브리핑 기사를 수집하고, 최신 실행 상태와 실패 내용을 바로 확인할 수 있습니다.
          </p>
        </div>
        <div className="hero-actions">
          <label className="news-date-field">
            수집 날짜
            <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
          </label>
          <button type="button" className="primary-button" onClick={handleCollect} disabled={isCollecting}>
            {isCollecting ? '수집 중...' : '수집 실행'}
          </button>
        </div>
      </header>

      <section className="toolbar-card news-toolbar">
        <div>
          <p className="eyebrow">최근 실행</p>
          <strong>{latestRun ? `${latestRun.status} / ${latestRun.mode}` : '실행 기록 없음'}</strong>
          <div className="news-meta-row">
            <span>{latestRun ? `날짜: ${latestRun.collect_date}` : '날짜: -'}</span>
            <span>{latestRun ? `시작: ${latestRun.started_at}` : '시작: -'}</span>
          </div>
        </div>
        <div className="news-summary-card">
          <span className="news-summary-label">DB 저장 기사 수</span>
          <strong>{articles.length}</strong>
          <span className="news-summary-caption">현재 날짜: {targetDate}</span>
        </div>
      </section>

      {statusMessage && <div className="empty-state">{statusMessage}</div>}
      {error && <div className="error-banner">{error}</div>}

      <section className="schedule-layout news-layout">
        <section className="calendar-card">
          <div className="section-heading">
            <p className="eyebrow">수집 기사</p>
            <h2>기사 목록</h2>
          </div>
          {isLoading ? (
            <p className="empty-state">뉴스를 불러오는 중입니다.</p>
          ) : articles.length === 0 ? (
            <p className="empty-state">이 날짜에 저장된 기사가 없습니다.</p>
          ) : (
            <div className="news-list">
              {articles.map((article) => (
                <article className="news-card" key={article.id}>
                  <div className="news-card-head">
                    <span className="type-badge">{article.source}</span>
                    <span className="news-date-pill">{article.published_at}</span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.summary ?? '요약이 없습니다.'}</p>
                  <a href={article.url} target="_blank" rel="noreferrer">
                    원문 보기
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="member-card">
          <div className="section-heading">
            <p className="eyebrow">실행 이력</p>
            <h2>수집 기록</h2>
          </div>
          <div className="news-run-list">
            {runs.length === 0 ? (
              <p className="empty-state">수집 기록이 없습니다.</p>
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
