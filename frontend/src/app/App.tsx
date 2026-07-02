import { useEffect, useState } from "react";
import { SchedulePage } from "../features/schedules/SchedulePage";
import { NewsPage } from "../features/news/NewsPage";
import { clearApiBaseUrl, getApiBaseUrl, setApiBaseUrl } from "../shared/api/baseUrl";
import { testBackendConnection, type BackendConnectionTestResult } from "../shared/api/system";

type View = "schedule" | "news";

export function App() {
  const [view, setView] = useState<View>("news");
  const [backendUrl, setBackendUrl] = useState(() => getApiBaseUrl());
  const [testResult, setTestResult] = useState<BackendConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setBackendUrl(getApiBaseUrl());
  }, []);

  function handleSaveBackendUrl() {
    const normalized = backendUrl.trim().replace(/\/+$/, "");
    if (!normalized) {
      clearApiBaseUrl();
      setBackendUrl("");
      setTestResult(null);
      return;
    }

    setApiBaseUrl(normalized);
    setBackendUrl(normalized);
    setTestResult(null);
  }

  async function handleTestConnection() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testBackendConnection(backendUrl);
      setTestResult(result);
      if (result.ok) {
        setApiBaseUrl(result.baseUrl);
        setBackendUrl(result.baseUrl);
      }
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <>
      <header className="app-shell-top">
        <section className="backend-config" aria-label="백엔드 연결 설정">
          <div className="backend-config-copy">
            <p className="eyebrow">백엔드 연결</p>
            <h1>연결 주소를 직접 설정하고 테스트할 수 있습니다.</h1>
            <p className="lead">
              GitHub Pages 같은 외부 프론트엔드에서 사용할 백엔드 주소를 저장하고, 바로 연결 여부를 확인하세요.
            </p>
          </div>

          <div className="backend-config-form">
            <label className="backend-url-field">
              백엔드 URL
              <input
                type="url"
                inputMode="url"
                placeholder="예: http://127.0.0.1:8000 또는 https://xxxx.trycloudflare.com"
                value={backendUrl}
                onChange={(event) => setBackendUrl(event.target.value)}
              />
            </label>
            <div className="backend-actions">
              <button className="secondary-button" type="button" onClick={handleSaveBackendUrl}>
                저장
              </button>
              <button className="primary-button" type="button" onClick={handleTestConnection} disabled={isTesting}>
                {isTesting ? "테스트 중..." : "연결 테스트"}
              </button>
            </div>
            <p className="backend-hint">저장된 주소: {getApiBaseUrl() || "현재 페이지와 같은 주소를 사용 중"}</p>
            {testResult && (
              <div className={`backend-result ${testResult.ok ? "success" : "failure"}`}>
                {testResult.ok ? (
                  <>
                    <strong>연결 성공</strong>
                    <span>
                      API: {testResult.apiStatus} / DB: {testResult.databaseStatus} / 저장 경로: {testResult.databasePath}
                    </span>
                  </>
                ) : (
                  <>
                    <strong>연결 실패</strong>
                    <span>{testResult.message}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <nav className="app-nav" aria-label="기능 전환">
          <button className={view === "news" ? "active" : ""} onClick={() => setView("news")} type="button">
            뉴스
          </button>
          <button className={view === "schedule" ? "active" : ""} onClick={() => setView("schedule")} type="button">
            일정
          </button>
        </nav>
      </header>
      {view === "news" ? <NewsPage /> : <SchedulePage />}
    </>
  );
}
