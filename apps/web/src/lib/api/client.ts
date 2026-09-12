/**
 * The frontend's only route to the API.
 *
 * Everything here speaks HTTP to apps/api. Nothing in apps/web imports a
 * database client, a schema, or any server module from the API — the boundary is
 * the network, so the API can be redeployed, rewritten, or replaced by the same
 * endpoints served from anywhere else, and this app does not change.
 *
 * Types come from `schema.d.ts`, generated from the OpenAPI document. If an
 * endpoint's shape changes without the spec changing, this file stops compiling.
 */
import type { paths, components } from "./schema";

export type Schemas = components["schemas"];

/** The error envelope every endpoint uses. */
export type ApiErrorBody = Schemas["Error"];

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly requestId: string | undefined;

  constructor(status: number, body: ApiErrorBody | null, fallback: string) {
    super(body?.error?.message ?? fallback);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error?.code ?? "UNKNOWN";
    this.details = body?.error?.details;
    this.requestId = body?.error?.requestId;
  }

  /** Field-level messages from a VALIDATION_FAILED response, if present. */
  fieldErrors(): Record<string, string> {
    const details = this.details as { fields?: Array<{ field: string; message: string }> };
    const out: Record<string, string> = {};
    for (const item of details?.fields ?? []) {
      if (!out[item.field]) out[item.field] = item.message;
    }
    return out;
  }
}

function baseUrl(): string {
  const url = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error(
      "API_BASE_URL is not set. The frontend has no database of its own — it cannot start without an API to call.",
    );
  }
  return url.replace(/\/$/, "");
}

export interface RequestOptions {
  /** Access token. Server components read it from the session cookie. */
  token?: string | null;
  /** Forwarded so an API log line can be tied to a page render. */
  requestId?: string;
  idempotencyKey?: string;
  signal?: AbortSignal;
  /** Seconds to cache. Omit for anything user-specific. */
  revalidate?: number;
}

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.requestId) headers["X-Request-Id"] = options.requestId;
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
  headers["X-Client"] = "web";

  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: options.signal,
    // Public reference data may be cached briefly; anything else must not be.
    ...(options.revalidate !== undefined
      ? { next: { revalidate: options.revalidate } }
      : { cache: "no-store" as const }),
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof payload === "object" ? (payload as ApiErrorBody) : null,
      `${method} ${path} failed with ${response.status}`,
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body ?? {}, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body ?? {}, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body ?? {}, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};

/* ------------------------------------------------- typed endpoint helpers */
// Thin named wrappers, so a page reads as `getDistricts()` rather than a raw
// path, and a spec change surfaces here rather than in a dozen components.

type Json<P extends keyof paths, M extends keyof paths[P]> =
  paths[P][M] extends { responses: { 200: { content: { "application/json": infer R } } } }
    ? R
    : paths[P][M] extends { responses: { 201: { content: { "application/json": infer R } } } }
      ? R
      : never;

export type DistrictList = Json<"/geography/districts", "get">;
export type LocalBodyList = Json<"/geography/local-bodies", "get">;
export type WardList = Schemas["WardList"];
export type Availability = Schemas["Availability"];
export type MeResponse = Schemas["MeResponse"];
export type AgentDashboard = Schemas["AgentDashboard"];
export type Eligibility = Schemas["Eligibility"];
export type SignupResponse = Schemas["SignupResponse"];
export type PayoutProfile = Schemas["PayoutProfile"];
export type ReportCatalogue = Schemas["ReportCatalogue"];
export type ReportResult = Schemas["ReportResult"];
export type LocalBody = Schemas["LocalBody"];
export type District = Schemas["District"];
export type Session = Schemas["Session"];

/** Public reference data. Cached briefly — the 14 districts rarely change. */
export const getDistricts = () =>
  api.get<DistrictList>("/geography/districts", { revalidate: 3600 });

export const searchLocalBodies = (params: {
  districtId?: number;
  q?: string;
  onlyOpen?: boolean;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params.districtId) query.set("districtId", String(params.districtId));
  if (params.q) query.set("q", params.q);
  if (params.onlyOpen) query.set("onlyOpen", "true");
  query.set("limit", String(params.limit ?? 50));
  // Not cached: each row carries live slot counts.
  return api.get<LocalBodyList>(`/geography/local-bodies?${query}`);
};

export const getWards = (localBodyId: number) =>
  api.get<WardList>(`/geography/local-bodies/${localBodyId}/wards`, {
    revalidate: 3600,
  });

/** Never cached. The public page presents this number as a fact. */
export const getAvailability = (localBodyId: number) =>
  api.get<Availability>(`/geography/local-bodies/${localBodyId}/availability`);

export const getMe = (token: string) => api.get<MeResponse>("/me", { token });

export const getAgentDashboard = (token: string) =>
  api.get<AgentDashboard>("/agent/dashboard", { token });

export const getPayoutProfile = (token: string) =>
  api.get<PayoutProfile>("/payouts/profile", { token });

export const getEligibility = (token: string, localBodyId?: number) =>
  api.get<Eligibility>(
    `/signup/eligibility${localBodyId ? `?localBodyId=${localBodyId}` : ""}`,
    { token },
  );

export const getReportCatalogue = (token: string) =>
  api.get<ReportCatalogue>("/admin/reports", { token });

export const runReport = (
  token: string,
  slug: string,
  filter: Record<string, string | number | undefined> = {},
) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString() ? `?${query}` : "";
  return api.get<ReportResult>(`/admin/reports/${slug}${suffix}`, { token });
};
