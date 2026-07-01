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
          <p className="eyebrow">Public Administration Super App</p>
          <h1>공공직군 행정업무 슈퍼앱</h1>
          <p className="lead">
            팀 일정, 엑셀 업무 자동화, 민원 대응 챗봇, 공공 행정 뉴스 수집을 하나의 업무
            포털로 묶기 위한 초기 스캐폴드입니다.
          </p>
        </div>

        <aside className="status-card">
          <p className="eyebrow">Integration Check</p>
          <div className="status-list">
            <StatusRow label="FE" value="React/Vite ready" />
            <StatusRow label="BE API" value={error ? "연결 실패" : status?.api ?? "확인 중"} />
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
        FE-BE 연동 확인: <code>/api/health</code>, BE-DB 연동 확인: <code>/api/health/db</code>
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
