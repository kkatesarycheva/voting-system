const DEFAULT_API_BASE_URL = "https://eskvotingsystem.sovworks.com";

/**
 * API origin from `window.__API_BASE_URL__` (set in index.html before the bundle loads, or injected at deploy time).
 * Empty string means same-origin (relative URLs). When unset in the browser, uses `DEFAULT_API_BASE_URL`.
 */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return DEFAULT_API_BASE_URL;
  }
  const injected = window.__API_BASE_URL__;
  if (injected == null) {
    return DEFAULT_API_BASE_URL;
  }
  const trimmed = String(injected).trim();
  if (trimmed === "") {
    return "";
  }
  return trimmed.replace(/\/$/, "");
}

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const { method = "GET", body, token } = options;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = payload?.error || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

/** Resolved once when this module loads; prefer `getApiBaseUrl()` if you need the value after custom `window` setup in tests. */
const API_BASE_URL = getApiBaseUrl();

export { API_BASE_URL, request };
