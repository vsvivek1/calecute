/**
 * One error shape for the whole API.
 *
 * Both clients — the web frontend and the Android app — branch on `error.code`,
 * never on the message or the HTTP status alone. Messages are for developers
 * and logs; user-facing text is the client's job, in the client's language.
 *
 *   { "error": { "code": "SLOT_UNAVAILABLE",
 *                "message": "…",
 *                "details": { … },
 *                "requestId": "…" } }
 */

export const ERROR_CODES = {
  // 400
  VALIDATION_FAILED: 400,
  MALFORMED_JSON: 400,
  INVALID_CURSOR: 400,
  UNKNOWN_GEOGRAPHY: 400,
  HONEYPOT_TRIPPED: 400,
  SUBMITTED_TOO_FAST: 400,
  // 401
  UNAUTHENTICATED: 401,
  INVALID_TOKEN: 401,
  TOKEN_EXPIRED: 401,
  INVALID_GOOGLE_TOKEN: 401,
  REFRESH_TOKEN_REUSED: 401,
  // 403
  FORBIDDEN: 403,
  ROLE_REQUIRED: 403,
  OUT_OF_DISTRICT_SCOPE: 403,
  ACCOUNT_SUSPENDED: 403,
  PAN_NOT_VERIFIED: 403,
  // 404
  NOT_FOUND: 404,
  // 409
  ALREADY_REGISTERED: 409,
  MOBILE_ALREADY_USED: 409,
  PAN_ALREADY_USED: 409,
  SLOT_UNAVAILABLE: 409,
  PANCHAYAT_CLOSED: 409,
  ALREADY_ATTRIBUTED: 409,
  IDEMPOTENCY_KEY_REUSED: 409,
  // 422
  UNPROCESSABLE: 422,
  // 429
  RATE_LIMITED: 429,
  // 500
  INTERNAL_ERROR: 500,
  DEPENDENCY_UNAVAILABLE: 503,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;
  /** Extra response headers, e.g. Retry-After on a rate limit. */
  readonly headers?: Record<string, string>;

  constructor(
    code: ErrorCode,
    message?: string,
    options?: { details?: unknown; headers?: Record<string, string> },
  ) {
    super(message ?? code);
    this.name = "ApiError";
    this.code = code;
    this.status = ERROR_CODES[code];
    this.details = options?.details;
    this.headers = options?.headers;
  }
}

export const badRequest = (code: ErrorCode, message?: string, details?: unknown) =>
  new ApiError(code, message, { details });

export const notFound = (what: string) =>
  new ApiError("NOT_FOUND", `${what} not found`);

export const forbidden = (message = "Not permitted") =>
  new ApiError("FORBIDDEN", message);

export const unauthenticated = (message = "Authentication required") =>
  new ApiError("UNAUTHENTICATED", message);
