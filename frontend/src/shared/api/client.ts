import { getApiBaseUrl } from "./baseUrl";

type RequestBody = Record<string, unknown>;

function buildUrl(path: string): string {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
  return `${baseUrl}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    let message = `API 요청 실패: ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        message = body.detail;
      }
    } catch {
      // 응답 본문이 JSON이 아닐 수 있으므로 기본 메시지를 사용한다.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T>(path: string, body: RequestBody): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function apiPut<T>(path: string, body: RequestBody): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

export function apiDelete(path: string): Promise<void> {
  return request<void>(path, { method: "DELETE" });
}
