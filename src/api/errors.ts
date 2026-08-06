export const AUTH_ERROR_CODES = [
  'TOKEN_MISSING',
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'INVALID_CREDENTIALS',
  'REFRESH_REUSED',
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

interface ApiErrorBody {
  message?: string | string[];
  code?: string;
  statusCode?: number;
  outcome?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly outcome?: string;
  readonly messages: string[];

  constructor(status: number, body: ApiErrorBody | undefined) {
    const messages = Array.isArray(body?.message)
      ? body.message
      : body?.message
        ? [body.message]
        : [];
    super(messages[0] ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code;
    this.outcome = body?.outcome;
    this.messages = messages;
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  /** The access token expired: refreshing and retrying should succeed. */
  get isExpiredToken(): boolean {
    return this.code === 'TOKEN_EXPIRED';
  }

  /** The session is unrecoverable — the user has to sign in again. */
  get requiresReauth(): boolean {
    return (
      this.status === 401 &&
      (this.code === 'TOKEN_INVALID' ||
        this.code === 'TOKEN_MISSING' ||
        this.code === 'REFRESH_REUSED')
    );
  }
}
