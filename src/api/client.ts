import { ApiError } from './errors';

/** The API mounts every route under this prefix (`/health` excepted). */
const API_BASE = '/api';

/**
 * Access token lives in memory only. Persisting it to localStorage would
 * trade the httpOnly refresh cookie's XSS protection for convenience.
 */
let accessToken: string | null = null;
let onSessionLost: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSessionLostHandler(handler: () => void): void {
  onSessionLost = handler;
}

/**
 * Refresh tokens rotate and the API revokes the session when a rotated token
 * is replayed. Two concurrent refreshes would therefore log the user out, so
 * every caller awaits this single in-flight promise.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!response.ok) return false;
      const body = (await response.json()) as { accessToken: string };
      accessToken = body.accessToken;
      return true;
    } catch {
      return false;
    } finally {
      // Cleared in a microtask so callers that awaited this exact promise
      // all observe the same result before a new refresh can start.
      queueMicrotask(() => {
        refreshInFlight = null;
      });
    }
  })();

  return refreshInFlight;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Skip the refresh-and-retry dance (used by the auth endpoints). */
  anonymous?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken && !options.anonymous) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    credentials: 'same-origin',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && !options.anonymous) {
    const body = (await parseBody(response)) as { code?: string } | undefined;

    if (body?.code === 'TOKEN_EXPIRED' || body?.code === 'TOKEN_MISSING') {
      const refreshed = await refreshSession();
      if (refreshed) {
        response = await send(path, options);
      } else {
        accessToken = null;
        onSessionLost?.();
        throw new ApiError(401, body);
      }
    } else {
      accessToken = null;
      onSessionLost?.();
      throw new ApiError(401, body);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (await parseBody(response)) as Record<string, unknown> | undefined,
    );
  }

  return (await parseBody(response)) as T;
}

/**
 * Called once on app start: if a refresh cookie is still valid we recover the
 * session without making the user log in again.
 */
export async function restoreSession(): Promise<boolean> {
  return refreshSession();
}
