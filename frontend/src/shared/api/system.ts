import { apiGet } from "./client";
import { getApiBaseUrl } from "./baseUrl";

export type SystemStatus = {
  api: string;
  database: string;
  databasePath: string;
};

export type BackendConnectionTestResult =
  | {
      ok: true;
      baseUrl: string;
      apiStatus: string;
      databaseStatus: string;
      databasePath: string;
    }
  | {
      ok: false;
      baseUrl: string;
      message: string;
    };

export async function getSystemStatus(): Promise<SystemStatus> {
  const [apiHealth, dbHealth] = await Promise.all([
    apiGet<{ status: string }>("/api/health"),
    apiGet<{ status: string; database_path: string }>("/api/health/db")
  ]);

  return {
    api: apiHealth.status,
    database: dbHealth.status,
    databasePath: dbHealth.database_path
  };
}

export async function testBackendConnection(baseUrl = getApiBaseUrl()): Promise<BackendConnectionTestResult> {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");

  if (!normalizedBaseUrl) {
    return {
      ok: false,
      baseUrl: "",
      message: "백엔드 URL을 먼저 입력해 주세요."
    };
  }

  try {
    const [apiResponse, dbResponse] = await Promise.all([
      fetch(`${normalizedBaseUrl}/api/health`, {
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store"
      }),
      fetch(`${normalizedBaseUrl}/api/health/db`, {
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store"
      })
    ]);

    if (!apiResponse.ok || !dbResponse.ok) {
      return {
        ok: false,
        baseUrl: normalizedBaseUrl,
        message: `연결은 되었지만 상태 코드가 정상적이지 않습니다. API: ${apiResponse.status}, DB: ${dbResponse.status}`
      };
    }

    const apiBody = (await apiResponse.json()) as { status?: string };
    const dbBody = (await dbResponse.json()) as { status?: string; database_path?: string };

    return {
      ok: true,
      baseUrl: normalizedBaseUrl,
      apiStatus: apiBody.status ?? "unknown",
      databaseStatus: dbBody.status ?? "unknown",
      databasePath: dbBody.database_path ?? "unknown"
    };
  } catch (unknownError) {
    return {
      ok: false,
      baseUrl: normalizedBaseUrl,
      message: unknownError instanceof Error ? unknownError.message : "백엔드 연결에 실패했습니다."
    };
  }
}
