const STORAGE_KEY = "api_base_url";
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return DEFAULT_API_BASE_URL;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored ?? DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(baseUrl: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = baseUrl.trim().replace(/\/+$/, "");
  window.localStorage.setItem(STORAGE_KEY, normalized);
}

export function clearApiBaseUrl(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
