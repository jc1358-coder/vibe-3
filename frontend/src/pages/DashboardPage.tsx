import { useEffect, useState } from "react";
import { featureSummaries } from "../features/featureSummaries";
import { getSystemStatus, type SystemStatus } from "../shared/api/system";

export function DashboardPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    getSystemStatus()
      .then((result) => {
        if (!ignore) {
          setStatus(result);
        }
      })
      .catch((unknownError: unknown) => {
        if (!ignore) {
          setError(unknownError instanceof Error ? unknownError.message : "알 수 없는 오류");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-card">
          <p className="eyebrow">공공행정 통합 앱</p>
          <h1>공공 행정 업무 도우미</h1>
          <p className="lead">
            일정, 엑셀 자동화, 민원 응대, 공공 정책 뉴스 수집을 한곳에서 처리하기 위한 초기 화면입니다.
          </p>
        </div>

        <aside className="status-card">
          <p className="eyebrow">연동 확인</p>
          <div className="status-list">
            <StatusRow label="프론트" value="React/Vite 준비됨" />
            <StatusRow label="백엔드 API" value={error ? "연결 실패" : status?.api ?? "확인 중"} />
            <StatusRow label="SQLite" value={error ? "확인 불가" : status?.database ?? "확인 중"} />
          </div>
          {error && <p className="endpoint-note">오류: {error}</p>}
        </aside>
      </section>

      <section className="feature-grid" aria-label="기능 페이지 구조">
        {featureSummaries.map((feature, index) => (
          <article className="feature-card" key={feature.title}>
            <span className="feature-index">{index + 1}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <p className="endpoint-note">
        프론트-백엔드 연동 확인: <code>/api/health</code>, 백엔드-DB 연동 확인: <code>/api/health/db</code>
      </p>
    </main>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-row">
      <span className="status-label">{label}</span>
      <span className="status-value">{value}</span>
    </div>
  );
}
