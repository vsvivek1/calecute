/**
 * The OpenAPI 3.1 contract.
 *
 * This document is the agreement between the API and its two clients. The web
 * frontend generates its types from it; the Android app will be written against
 * it. Nothing in the frontend may depend on API behaviour that is not described
 * here, because the whole point is that either client can be replaced without
 * touching the other side.
 *
 * Request body schemas are generated from the same Zod schemas the handlers
 * validate with, via Zod 4's native JSON Schema output. That is deliberate:
 * a hand-written spec drifts from the implementation, and a drifted contract is
 * worse than none.
 */
import { z } from "zod";

/* ------------------------------------------------------------- primitives */

const json = (schema: z.ZodType) =>
  z.toJSONSchema(schema, { target: "draft-2020-12", io: "input" });

type Json = Record<string, unknown>;

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

/** Every error in the API has this shape. Clients branch on `code`. */
const errorEnvelope: Json = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message", "requestId"],
      properties: {
        code: {
          type: "string",
          description:
            "Machine-readable error code. Branch on this, never on the message or status alone.",
        },
        message: { type: "string", description: "Developer-facing English text." },
        details: {
          description: "Shape varies by code. For VALIDATION_FAILED: { fields: [...] }.",
        },
        requestId: { type: "string", description: "Quote this when reporting a problem." },
      },
    },
  },
};

const pageInfo: Json = {
  type: "object",
  required: ["hasNextPage", "nextCursor", "limit"],
  properties: {
    hasNextPage: { type: "boolean" },
    nextCursor: {
      type: ["string", "null"],
      description: "Pass back as ?cursor= to fetch the next page.",
    },
    limit: { type: "integer" },
  },
};

/** A paginated list response. */
const page = (itemSchema: Json): Json => ({
  type: "object",
  required: ["data", "pageInfo"],
  properties: {
    data: { type: "array", items: itemSchema },
    pageInfo: ref("PageInfo"),
  },
});

/* --------------------------------------------------- reusable definitions */

const errorResponse = (description: string): Json => ({
  description,
  content: { "application/json": { schema: ref("Error") } },
});

const COMMON_ERRORS: Json = {
  "400": errorResponse("Validation failed, or a geography id was not recognised."),
  "401": errorResponse("Missing, malformed or expired access token."),
  "403": errorResponse("Authenticated but not permitted, or outside district scope."),
  "429": errorResponse("Rate limit exceeded. See RateLimit-* and Retry-After headers."),
  "500": errorResponse("Unexpected error. The requestId identifies it in the logs."),
};

const RATE_LIMIT_HEADERS: Json = {
  "RateLimit-Limit": { schema: { type: "integer" }, description: "Requests allowed per window." },
  "RateLimit-Remaining": { schema: { type: "integer" }, description: "Requests left in this window." },
  "RateLimit-Reset": { schema: { type: "integer" }, description: "Seconds until the window resets." },
};

/** Query parameter helpers. */
const queryParam = (
  name: string,
  schema: Json,
  description: string,
  required = false,
): Json => ({ name, in: "query", required, schema, description });

const pathParam = (name: string, description: string): Json => ({
  name,
  in: "path",
  required: true,
  schema: { type: "integer", minimum: 1 },
  description,
});

const PAGINATION_PARAMS = [
  queryParam("limit", { type: "integer", minimum: 1, maximum: 200, default: 50 }, "Page size."),
  queryParam("cursor", { type: "string" }, "Opaque cursor from a previous pageInfo.nextCursor."),
];

const GEO_FILTER_PARAMS = [
  queryParam("districtId", { type: "integer" }, "Narrow to one district."),
  queryParam("blockId", { type: "integer" }, "Narrow to one block panchayat."),
  queryParam("localBodyId", { type: "integer" }, "Narrow to one panchayat, municipality or corporation."),
  queryParam("wardId", { type: "integer" }, "Narrow to one ward."),
  queryParam("from", { type: "string", format: "date-time" }, "Start of the date range, inclusive."),
  queryParam("to", { type: "string", format: "date-time" }, "End of the date range, inclusive."),
];

const IDEMPOTENCY_HEADER: Json = {
  name: "Idempotency-Key",
  in: "header",
  required: true,
  schema: { type: "string", minLength: 8, maxLength: 200 },
  description:
    "Required on every endpoint that writes money. A retry with the same key replays the original response instead of repeating the work. Reusing a key with a different body is an error.",
};

/* ------------------------------------------------------ request body zods */
// Mirrors of the handler schemas. Kept next to the paths that use them so a
// change to one is visible alongside the other.

const googleAuthBody = z.union([
  z.object({ idToken: z.string().describe("Google ID token, from a native client.") }),
  z.object({
    code: z.string().describe("Authorization code, from the web authorization-code flow."),
    redirectUri: z.string().url(),
    codeVerifier: z.string().optional().describe("PKCE verifier, if the flow used one."),
  }),
]);

const signupBody = z.object({
  name: z.string().min(2).max(120),
  mobile: z.string().describe("10-digit Indian mobile number. Not verified at this stage."),
  districtId: z.number().int().positive(),
  localBodyId: z.number().int().positive(),
  wardId: z.number().int().positive().nullish().describe("Optional: ward data is incomplete for some local bodies."),
  occupation: z.string().min(2).max(120),
  termsVersion: z.string().describe("Version of the terms actually shown to the applicant."),
  acceptedTerms: z.literal(true),
  privacyConsent: z.literal(true),
  honeypot: z.string().nullish().describe("Hidden field. Must be empty; a value rejects the request."),
  fillMs: z.number().int().nullish().describe("Milliseconds between form render and submit. Under 3000 is rejected."),
  deviceFingerprint: z.string().nullish().describe("Hashed server-side; the raw value is never stored."),
});

const qualificationsBody = z.object({
  education: z.enum(["SSLC", "PLUS_TWO", "DEGREE", "PG", "DIPLOMA", "ITI", "OTHER"]).nullish(),
  educationOther: z.string().nullish(),
  experience: z
    .array(
      z.enum([
        "INSURANCE_AGENCY",
        "AKSHAYA_CSC",
        "MARKETING_SALES",
        "BANKING_FINANCE",
        "BUSINESS_SHOP",
        "NONE",
      ]),
    )
    .nullish(),
  hoursPerDay: z.enum(["ONE", "TWO_TO_THREE", "FOUR_PLUS", "FULL_TIME"]).nullish(),
  hasVehicle: z.boolean().nullish(),
  computerLiteracy: z.enum(["YES", "BASIC", "NO"]).nullish(),
  reach: z
    .array(
      z.enum([
        "BANK_EMPLOYEES",
        "CONTRACTORS",
        "STUDENTS",
        "SHOP_OWNERS",
        "GOVERNMENT_OFFICES",
        "OTHERS",
      ]),
    )
    .nullish(),
});

const payoutProfileBody = z.object({
  pan: z.string().nullish().describe("Format AAAAA9999A. Encrypted at rest; never returned."),
  bankAccountNumber: z.string().nullish(),
  bankIfsc: z.string().nullish(),
  bankHolderName: z.string().nullish(),
  upiId: z.string().nullish(),
});

const attributionClaimBody = z.object({
  customerExternalRef: z.string(),
  customerName: z.string(),
  agentCode: z.string(),
  source: z.string().optional(),
});

const paymentBody = z.object({
  externalRef: z.string(),
  customerExternalRef: z.string(),
  productId: z.number().int().nullish(),
  grossPaise: z.number().int().min(0).describe("Amounts are integer paise. Never a float."),
  gstPaise: z.number().int().min(0).default(0),
  gatewayFeePaise: z.number().int().min(0).default(0),
  paidAt: z.string().describe("ISO 8601 timestamp."),
});

const eventBody = z.object({
  sessionId: z.string().min(8).max(64).describe("Client-generated and rotating. Never joined to a user."),
  event: z.enum([
    "page_view",
    "scroll_depth",
    "signup_start",
    "field_focus",
    "field_blur",
    "field_abandon",
    "google_auth_started",
    "google_auth_completed",
    "google_auth_failed",
    "signup_submitted",
    "signup_failed",
    "qualifications_started",
    "qualifications_submitted",
    "qualifications_skipped",
    "waitlist_joined",
  ]),
  properties: z.record(z.string(), z.unknown()).optional(),
  districtId: z.number().int().optional(),
  localBodyId: z.number().int().optional(),
});

/* ------------------------------------------------------------ entity docs */

const districtSchema: Json = {
  type: "object",
  required: ["id", "nameEn", "nameMl", "codeSlug"],
  properties: {
    id: { type: "integer", description: "Stable numeric id. Always match on this, never on a name." },
    nameEn: { type: "string" },
    nameMl: { type: "string" },
    codeSlug: { type: "string", description: 'District token used in agent codes, e.g. "KKD".' },
    lgdCode: { type: ["integer", "null"], description: "Official LGD code, where loaded." },
    wardData: { type: "string", enum: ["COMPLETE", "PARTIAL", "PENDING"] },
  },
};

const localBodySchema: Json = {
  type: "object",
  required: ["id", "nameEn", "nameMl", "type", "districtId"],
  properties: {
    id: { type: "integer" },
    nameEn: { type: "string" },
    nameMl: { type: "string" },
    type: {
      type: "string",
      enum: ["GRAM_PANCHAYAT", "MUNICIPALITY", "CORPORATION"],
      description:
        "Gram panchayats sit under a block; municipalities and corporations do not. Clients need not branch on this — blockPanchayatId is simply null for urban bodies.",
    },
    districtId: { type: "integer" },
    blockPanchayatId: { type: ["integer", "null"] },
    slotCapacity: { type: "integer", description: "Places available to agents. Programme default is 10." },
    signupsOpen: { type: "boolean" },
    wardData: { type: "string", enum: ["COMPLETE", "PARTIAL", "PENDING"] },
    filled: { type: "integer" },
    remaining: { type: "integer" },
    waitlisted: { type: "integer" },
  },
};

const availabilitySchema: Json = {
  type: "object",
  required: ["localBodyId", "slotCapacity", "filled", "remaining", "state"],
  properties: {
    localBodyId: { type: "integer" },
    slotCapacity: { type: "integer" },
    filled: { type: "integer" },
    remaining: { type: "integer" },
    signupsOpen: { type: "boolean" },
    waitlisted: { type: "integer" },
    state: {
      type: "string",
      enum: ["OPEN", "FULL", "CLOSED"],
      description: "Read live from the database on every request. Never cached, never estimated.",
    },
  },
};

const sessionSchema: Json = {
  type: "object",
  required: ["accessToken", "refreshToken", "tokenType", "expiresIn", "user"],
  properties: {
    accessToken: {
      type: "string",
      description: "Short-lived JWT. Send as `Authorization: Bearer <token>`.",
    },
    refreshToken: {
      type: "string",
      description:
        "Long-lived and single-use. Rotated on every refresh; presenting a rotated token revokes every session for that user.",
    },
    tokenType: { type: "string", enum: ["Bearer"] },
    expiresIn: { type: "integer", description: "Access token lifetime in seconds." },
    user: ref("SessionUser"),
  },
};

const sessionUserSchema: Json = {
  type: "object",
  required: ["id", "email", "name", "role"],
  properties: {
    id: { type: "integer" },
    email: { type: "string", format: "email" },
    name: { type: "string" },
    role: {
      type: "string",
      enum: ["AGENT", "DISTRICT_ADMIN", "SUPER_ADMIN"],
      description:
        "Read from the user row in the database. Render from this; it grants nothing on its own, because every endpoint re-derives it from the signed token.",
    },
    pictureUrl: { type: ["string", "null"] },
    agentId: { type: ["integer", "null"] },
  },
};

const commissionTermsSchema: Json = {
  type: "object",
  description: "The published commission terms, served so no client hardcodes them.",
  properties: {
    rateBps: { type: "integer", description: "1000 = 10% of every payment." },
    tdsRateBps: { type: "integer", description: "200 = 2%." },
    tdsSection: { type: "string", description: "194H." },
    basis: { type: "string", description: "Net of GST and payment gateway charges." },
    payoutFrequency: { type: "string", enum: ["MONTHLY"] },
  },
};


/* ------------------------------------------------- response body schemas */
// The frontend generates its types from these, so the endpoints it actually
// calls describe their responses properly rather than as a bare object.

const agentSummarySchema: Json = {
  type: ["object", "null"],
  properties: {
    id: { type: "integer" },
    agentCode: { type: "string", examples: ["CA-KKD-000123"] },
    status: {
      type: "string",
      enum: ["PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED", "WAITLISTED", "WITHDRAWN"],
    },
    districtId: { type: "integer" },
    districtNameEn: { type: "string" },
    districtNameMl: { type: "string" },
    localBodyId: { type: "integer" },
    localBodyNameEn: { type: "string" },
    localBodyNameMl: { type: "string" },
    mobileVerifiedAt: { type: ["string", "null"], format: "date-time" },
  },
};

const meResponseSchema: Json = {
  type: "object",
  required: ["user", "agent", "districtScope", "landing"],
  properties: {
    user: ref("SessionUser"),
    agent: ref("AgentSummary"),
    districtScope: {
      description: '"ALL" for a super admin, otherwise the assigned district ids.',
      oneOf: [
        { type: "string", enum: ["ALL"] },
        { type: "array", items: { type: "integer" } },
      ],
    },
    districtScopeDetail: {
      type: "array",
      items: {
        type: "object",
        properties: {
          districtId: { type: "integer" },
          nameEn: { type: "string" },
          nameMl: { type: "string" },
        },
      },
    },
    landing: {
      type: "string",
      description:
        "Where this client should navigate after sign-in. Follow it rather than deciding from the role.",
      examples: ["/agents/dashboard", "/agents/signup", "/admin"],
    },
  },
};

const wardSchema: Json = {
  type: "object",
  required: ["id", "number", "status"],
  properties: {
    id: { type: "integer" },
    number: { type: "integer" },
    nameEn: { type: ["string", "null"] },
    nameMl: { type: ["string", "null"] },
    status: {
      type: "string",
      enum: ["COMPLETE", "PARTIAL", "PENDING"],
      description: "PENDING means the ward exists but no official name has been loaded.",
    },
  },
};

const wardListSchema: Json = {
  type: "object",
  required: ["data", "wardData"],
  properties: {
    data: { type: "array", items: ref("Ward") },
    wardData: { type: "string", enum: ["COMPLETE", "PARTIAL", "PENDING"] },
    note: {
      type: ["string", "null"],
      description: "Present when the list is empty, explaining why.",
    },
  },
};

const signupResponseSchema: Json = {
  type: "object",
  required: ["agent", "slotsRemainingAfter"],
  properties: {
    agent: {
      type: "object",
      properties: {
        id: { type: "integer" },
        agentCode: { type: "string" },
        status: { type: "string" },
        districtId: { type: "integer" },
        localBodyId: { type: "integer" },
        wardId: { type: ["integer", "null"] },
      },
    },
    slotsRemainingAfter: { type: "integer" },
    nextStep: { type: "string" },
  },
};

const eligibilitySchema: Json = {
  type: "object",
  required: ["canApply"],
  properties: {
    canApply: { type: "boolean" },
    existingApplication: {
      type: ["object", "null"],
      properties: {
        id: { type: "integer" },
        agentCode: { type: "string" },
        status: { type: "string" },
      },
    },
    currentTerms: {
      type: ["object", "null"],
      properties: { version: { type: "string" }, url: { type: "string" } },
    },
    availability: { oneOf: [ref("Availability"), { type: "null" }] },
  },
};

const earningsSummarySchema: Json = {
  type: "object",
  required: ["pendingPaise", "paidPaise", "lifetimePaise", "currency"],
  properties: {
    pendingPaise: { type: "integer", description: "Accrued and approved, not yet paid." },
    paidPaise: { type: "integer" },
    lifetimePaise: { type: "integer" },
    tdsWithheldPaise: { type: "integer" },
    currency: { type: "string", enum: ["INR"] },
  },
};

const payoutStateSchema: Json = {
  type: "object",
  properties: {
    panStatus: {
      type: "string",
      enum: ["NOT_SUBMITTED", "PENDING_VERIFICATION", "VERIFIED", "REJECTED", "DUPLICATE_CANCELLED"],
    },
    pan: { type: ["string", "null"], description: "Masked, e.g. XXXXX1234F. Never the real value." },
    bankConfigured: { type: "boolean" },
    withdrawalBlocked: { type: "boolean" },
    blockedReason: { type: ["string", "null"] },
  },
};

const agentDashboardSchema: Json = {
  type: "object",
  required: ["agent", "referral", "earnings", "payout", "customers", "products"],
  properties: {
    agent: {
      type: "object",
      properties: {
        id: { type: "integer" },
        agentCode: { type: "string" },
        status: { type: "string" },
        mobileVerified: { type: "boolean" },
      },
    },
    referral: {
      type: "object",
      properties: {
        code: { type: "string" },
        link: { type: "string" },
        qrUrl: { type: "string" },
        whatsappShareUrl: { type: "string" },
      },
    },
    earnings: ref("EarningsSummary"),
    payout: ref("PayoutState"),
    customers: {
      type: "object",
      properties: {
        total: { type: "integer" },
        recent: {
          type: "array",
          items: {
            type: "object",
            properties: {
              customerId: { type: "integer" },
              displayName: { type: "string" },
              status: { type: "string" },
              lockedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          slug: { type: "string" },
          nameEn: { type: "string" },
          nameMl: { type: "string" },
        },
      },
    },
  },
};

const reportCatalogueSchema: Json = {
  type: "object",
  required: ["defaultReport", "data"],
  properties: {
    defaultReport: { type: "string" },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          slug: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          columns: {
            type: "array",
            items: {
              type: "object",
              properties: { key: { type: "string" }, header: { type: "string" } },
            },
          },
          formats: { type: "array", items: { type: "string" } },
          filters: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

const reportResultSchema: Json = {
  type: "object",
  required: ["report", "columns", "rowCount", "data"],
  properties: {
    report: {
      type: "object",
      properties: {
        slug: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
      },
    },
    filter: { type: "object" },
    columns: {
      type: "array",
      items: { type: "object", properties: { key: { type: "string" }, header: { type: "string" } } },
    },
    rowCount: { type: "integer" },
    truncated: { type: "boolean", description: "True when the row cap was hit." },
    data: {
      type: "array",
      description: "Row shape varies by report; use `columns` to render generically.",
      items: { type: "object", additionalProperties: true },
    },
  },
};

const payoutProfileSchema: Json = {
  type: "object",
  properties: {
    pan: { type: ["string", "null"] },
    panStatus: { type: "string" },
    panVerifiedAt: { type: ["string", "null"], format: "date-time" },
    bankAccount: { type: ["string", "null"] },
    bankIfsc: { type: ["string", "null"] },
    bankHolderName: { type: ["string", "null"] },
    upiId: { type: ["string", "null"] },
    mobileVerified: { type: "boolean" },
    withdrawal: {
      type: "object",
      properties: {
        blocked: { type: "boolean" },
        reasons: { type: "array", items: { type: "string" } },
        pendingBalancePaise: { type: "integer" },
      },
    },
  },
};

/* ------------------------------------------------------------------ paths */

const ok200 = (schema: Json, description = "Success."): Json => ({
  description,
  headers: RATE_LIMIT_HEADERS,
  content: { "application/json": { schema } },
});

const body = (schema: Json, required = true): Json => ({
  required,
  content: { "application/json": { schema } },
});

function operation(params: {
  tag: string;
  summary: string;
  description: string;
  security?: boolean;
  roles?: string;
  parameters?: Json[];
  requestBody?: Json;
  responses: Json;
}): Json {
  return {
    tags: [params.tag],
    summary: params.summary,
    description:
      params.description + (params.roles ? `\n\n**Requires role:** ${params.roles}` : ""),
    ...(params.security === false ? { security: [] } : {}),
    ...(params.parameters ? { parameters: params.parameters } : {}),
    ...(params.requestBody ? { requestBody: params.requestBody } : {}),
    responses: {
      ...params.responses,
      ...(params.security === false
        ? {
            "400": COMMON_ERRORS["400"],
            "429": COMMON_ERRORS["429"],
            "500": COMMON_ERRORS["500"],
          }
        : COMMON_ERRORS),
    },
  };
}

export function buildSpec(serverUrl: string): Json {
  return {
    openapi: "3.1.0",
    info: {
      title: "Calecute Technologies — Commission Agent Programme API",
      version: "1.0.0",
      description: [
        "REST API for the Kerala commission agent programme.",
        "",
        "**This document is the contract.** Two clients consume it — the web frontend",
        "at calecutech.com and an Android app — and neither may depend on behaviour",
        "that is not described here. The web frontend generates its TypeScript types",
        "from this file.",
        "",
        "## Authentication",
        "",
        "Google Sign-In only; there are no passwords and no OTP login. A client",
        "obtains a Google credential (an ID token natively, or an authorization code",
        "on the web), posts it to `/auth/google`, and receives our own JWT pair. A",
        "Google token is never accepted as a session.",
        "",
        "Send the access token as `Authorization: Bearer <token>`. It is stateless:",
        "every endpoint authorises from its claims. Refresh tokens are single-use and",
        "rotate; presenting a rotated one revokes all sessions for that user.",
        "",
        "## Authorisation",
        "",
        "Roles live on the user row: `AGENT`, `DISTRICT_ADMIN`, `SUPER_ADMIN`. Call",
        "`GET /me` and render whatever role comes back — do not infer it from an",
        "email address or any client-side list.",
        "",
        "District admins are scoped to assigned districts, and that scoping is",
        "enforced by Postgres row-level security rather than by query filters. A",
        "modified client asking for another district's rows receives an empty set,",
        "not an error.",
        "",
        "## Conventions",
        "",
        "- Errors always use the `Error` envelope. Branch on `error.code`.",
        "- Every list endpoint is cursor paginated. Offsets are not supported.",
        "- All money is integer **paise**. Never a float.",
        "- Geography is referenced by stable numeric id, never by name.",
        "- Endpoints that write money require an `Idempotency-Key` header.",
        "- Rate limits are reported in `RateLimit-Limit`, `RateLimit-Remaining` and",
        "  `RateLimit-Reset`; a 429 also carries `Retry-After`.",
      ].join("\n"),
      contact: {
        name: "Calecute Technologies",
        email: "info@calecutech.com",
      },
    },
    servers: [
      { url: serverUrl, description: "This deployment" },
      { url: "http://localhost:3001/api/v1", description: "Local development" },
    ],
    tags: [
      { name: "auth", description: "Google Sign-In, token refresh, logout." },
      { name: "me", description: "The current user, their role, and DPDP export/erasure." },
      { name: "geography", description: "Kerala hierarchy and live slot availability. Public." },
      { name: "signup", description: "Agent application: required fields, optional qualifications, waitlist." },
      { name: "agent", description: "Agent dashboard, referral, earnings, customers, products, inbox." },
      { name: "payouts", description: "PAN and bank details, mobile verification. PAN is collected here and only here." },
      { name: "products", description: "Product catalogue and sales material." },
      { name: "admin-reports", description: "Coverage, agents, revenue and funnel reports. JSON, CSV or PDF." },
      { name: "admin-actions", description: "Approvals, assignments, slots, payouts, messaging, admin users." },
      { name: "attribution", description: "Referral attribution. First code wins, permanently." },
      { name: "meta", description: "Health and this specification." },
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token from POST /auth/google or POST /auth/refresh.",
        },
      },
      schemas: {
        Error: errorEnvelope,
        PageInfo: pageInfo,
        District: districtSchema,
        LocalBody: localBodySchema,
        Availability: availabilitySchema,
        Session: sessionSchema,
        SessionUser: sessionUserSchema,
        CommissionTerms: commissionTermsSchema,
        AgentSummary: agentSummarySchema,
        MeResponse: meResponseSchema,
        Ward: wardSchema,
        WardList: wardListSchema,
        SignupResponse: signupResponseSchema,
        Eligibility: eligibilitySchema,
        EarningsSummary: earningsSummarySchema,
        PayoutState: payoutStateSchema,
        PayoutProfile: payoutProfileSchema,
        AgentDashboard: agentDashboardSchema,
        ReportCatalogue: reportCatalogueSchema,
        ReportResult: reportResultSchema,
        GoogleAuthRequest: json(googleAuthBody) as Json,
        SignupRequest: json(signupBody) as Json,
        QualificationsRequest: json(qualificationsBody) as Json,
        PayoutProfileRequest: json(payoutProfileBody) as Json,
        AttributionClaimRequest: json(attributionClaimBody) as Json,
        PaymentRequest: json(paymentBody) as Json,
        EventRequest: json(eventBody) as Json,
      },
    },
    paths: {
      /* ------------------------------------------------------------ meta */
      "/health": {
        get: operation({
          tag: "meta",
          summary: "Liveness and database reachability",
          description: "Used by the deployment check. Returns 503 if the database is unreachable.",
          security: false,
          responses: {
            "200": ok200({
              type: "object",
              properties: {
                status: { type: "string", enum: ["ok", "degraded"] },
                version: { type: "string" },
                database: { type: "string" },
              },
            }),
            "503": errorResponse("Database unreachable."),
          },
        }),
      },
      "/openapi.json": {
        get: operation({
          tag: "meta",
          summary: "This specification",
          description: "Served so clients can generate types against the running deployment.",
          security: false,
          responses: { "200": ok200({ type: "object" }, "The OpenAPI 3.1 document.") },
        }),
      },

      /* ------------------------------------------------------------ auth */
      "/auth/google": {
        post: operation({
          tag: "auth",
          summary: "Exchange a Google credential for our tokens",
          description: [
            "Accepts either an ID token (native clients) or an authorization code plus",
            "redirect URI and PKCE verifier (web). Both are verified against Google",
            "server-side.",
            "",
            "A new account is always created as `AGENT`. Elevation to an admin role is",
            "an explicit, audited admin action — it never happens here, and no email",
            "address is compared against a constant anywhere in the codebase.",
          ].join("\n"),
          security: false,
          requestBody: body(ref("GoogleAuthRequest")),
          responses: {
            "200": ok200(ref("Session"), "Session established."),
            "401": errorResponse("INVALID_GOOGLE_TOKEN — Google rejected or we could not verify the credential."),
          },
        }),
      },
      "/auth/refresh": {
        post: operation({
          tag: "auth",
          summary: "Rotate a refresh token",
          description:
            "Returns a new token pair and invalidates the presented one. Presenting an already-rotated token revokes every session for that user — treat REFRESH_TOKEN_REUSED as 'sign in again'.",
          security: false,
          requestBody: body({
            type: "object",
            required: ["refreshToken"],
            properties: { refreshToken: { type: "string" } },
          }),
          responses: {
            "200": ok200(ref("Session")),
            "401": errorResponse("INVALID_TOKEN, TOKEN_EXPIRED or REFRESH_TOKEN_REUSED."),
          },
        }),
      },
      "/auth/logout": {
        post: operation({
          tag: "auth",
          summary: "Revoke a refresh token",
          description:
            "The access token remains valid until it expires — that is the cost of stateless auth, and why its lifetime is 15 minutes.",
          security: false,
          requestBody: body({
            type: "object",
            required: ["refreshToken"],
            properties: { refreshToken: { type: "string" } },
          }),
          responses: { "200": ok200({ type: "object", properties: { revoked: { type: "boolean" } } }) },
        }),
      },

      /* -------------------------------------------------------------- me */
      "/me": {
        get: operation({
          tag: "me",
          summary: "Current user, role, agent summary and where to land",
          description:
            "The endpoint the frontend renders its navigation from. `landing` says where this client should go after sign-in, so routing by role is a server decision.",
          responses: { "200": ok200(ref("MeResponse")) },
        }),
        patch: operation({
          tag: "me",
          summary: "Update the fields a user owns",
          description: "Name only. Email comes from Google and is not editable.",
          requestBody: body({
            type: "object",
            properties: { name: { type: "string", minLength: 2, maxLength: 120 } },
          }),
          responses: { "200": ok200({ type: "object" }) },
        }),
        delete: operation({
          tag: "me",
          summary: "DPDP erasure request",
          description:
            "Clears identifying fields and tombstones the account. Commission and TDS records are retained for the statutory period stated in the privacy policy, so the row is not hard-deleted.",
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/me/export": {
        get: operation({
          tag: "me",
          summary: "DPDP data portability export",
          description:
            "Everything held about the caller. PAN and bank account appear as masks only — plaintext is never returned over the API, even to its owner, because that would put it in caches and proxy logs.",
          responses: { "200": ok200({ type: "object" }) },
        }),
      },

      /* ------------------------------------------------------- geography */
      "/geography/districts": {
        get: operation({
          tag: "geography",
          summary: "The 14 districts of Kerala",
          description: "Public. Rendered server-side by the recruitment page before anyone signs in.",
          security: false,
          responses: {
            "200": ok200({
              type: "object",
              properties: { data: { type: "array", items: ref("District") } },
            }),
          },
        }),
      },
      "/geography/districts/{id}/blocks": {
        get: operation({
          tag: "geography",
          summary: "Block panchayats in a district",
          description: "Used by admin report filters. The signup flow does not need it — applicants pick a local body directly.",
          security: false,
          parameters: [pathParam("id", "District id.")],
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/geography/local-bodies": {
        get: operation({
          tag: "geography",
          summary: "Search panchayats, municipalities and corporations",
          description: [
            "Public, searchable, cursor paginated.",
            "",
            "`q` matches either script and tolerates transliteration: 'Kodenchery',",
            "'കോടഞ്ചേരി' and 'kodancheri' all reach the same row, via trigram",
            "similarity over both name columns. Exact and prefix matches rank first.",
            "",
            "Urban bodies appear in the same list as gram panchayats, distinguished by",
            "`type`. Each row carries live `filled` / `remaining` counts.",
          ].join("\n"),
          security: false,
          parameters: [
            queryParam("districtId", { type: "integer" }, "Restrict to one district."),
            queryParam("q", { type: "string", maxLength: 80 }, "Search text, Malayalam or English."),
            queryParam(
              "type",
              { type: "string", enum: ["GRAM_PANCHAYAT", "MUNICIPALITY", "CORPORATION"] },
              "Restrict to one kind of local body.",
            ),
            queryParam("onlyOpen", { type: "boolean" }, "Only bodies still accepting applications."),
            ...PAGINATION_PARAMS,
          ],
          responses: { "200": ok200(page(ref("LocalBody"))) },
        }),
      },
      "/geography/local-bodies/{id}/wards": {
        get: operation({
          tag: "geography",
          summary: "Wards in a local body",
          description:
            "Wards with `status: PENDING` exist because the official count is known but no name has been loaded. They are returned with a null name rather than omitted, so the picker can still offer 'Ward 7' and our data gap does not block an applicant. An empty list carries an explanatory `note`.",
          security: false,
          parameters: [pathParam("id", "Local body id.")],
          responses: { "200": ok200(ref("WardList")) },
        }),
      },
      "/geography/local-bodies/{id}/availability": {
        get: operation({
          tag: "geography",
          summary: "Live slot availability",
          description:
            "Read from the database on every request. This number appears on the public recruitment page as a trust signal, so it is never cached and never estimated.",
          security: false,
          parameters: [pathParam("id", "Local body id.")],
          responses: { "200": ok200(ref("Availability")) },
        }),
      },

      /* ---------------------------------------------------------- signup */
      "/signup/eligibility": {
        get: operation({
          tag: "signup",
          summary: "Can this account apply, and is the panchayat open",
          description: "Answered server-side so the 'you already applied' case never reaches the form.",
          parameters: [queryParam("localBodyId", { type: "integer" }, "Check availability for this body too.")],
          responses: { "200": ok200(ref("Eligibility")) },
        }),
      },
      "/signup": {
        post: operation({
          tag: "signup",
          summary: "Submit an application",
          description: [
            "Step 2 of the flow; step 1 is Google Sign-In. Six required fields and",
            "nothing more — no PAN, no bank details, no document upload.",
            "",
            "Runs as one transaction: validate the geography triple, lock the local",
            "body and take a slot, issue the agent code, write the agent, record",
            "consent, record abuse signals. A failure anywhere leaves no half-created",
            "agent and no consumed slot.",
            "",
            "The agent code format is `CA-<district>-<sequence>`, e.g. `CA-KKD-000123`.",
          ].join("\n"),
          roles: "AGENT (any signed-in user without an existing application)",
          requestBody: body(ref("SignupRequest")),
          responses: {
            "201": ok200(ref("SignupResponse"), "Application created; agent code issued."),
            "409": errorResponse(
              "ALREADY_REGISTERED, MOBILE_ALREADY_USED, SLOT_UNAVAILABLE or PANCHAYAT_CLOSED.",
            ),
          },
        }),
      },
      "/signup/qualifications": {
        post: operation({
          tag: "signup",
          summary: "Optional qualification answers",
          description:
            "Step 3, optional in every sense: every field is nullable, the step may be skipped entirely, and skipping it does not affect the application.",
          requestBody: body(ref("QualificationsRequest")),
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/signup/waitlist": {
        post: operation({
          tag: "signup",
          summary: "Join the waitlist for a full panchayat",
          description:
            "What a full panchayat offers instead of an application. Waitlist counts drive the admin report that identifies where to raise the slot count.",
          requestBody: body({
            type: "object",
            required: ["districtId", "localBodyId", "mobile"],
            properties: {
              districtId: { type: "integer" },
              localBodyId: { type: "integer" },
              mobile: { type: "string" },
            },
          }),
          responses: { "201": ok200({ type: "object" }) },
        }),
      },

      /* ----------------------------------------------------------- agent */
      "/agent/dashboard": {
        get: operation({
          tag: "agent",
          summary: "Everything for the agent home screen",
          description:
            "One request on purpose. The target device is a budget Android phone on one bar of 4G, where four sequential round trips is the difference between usable and not.",
          roles: "AGENT",
          responses: { "200": ok200(ref("AgentDashboard")) },
        }),
      },
      "/agent/referral": {
        get: operation({
          tag: "agent",
          summary: "Referral code, link, QR and WhatsApp share",
          description: "Separate from the dashboard so a share sheet can refresh it without refetching earnings.",
          roles: "AGENT",
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/agent/referral/qr": {
        get: operation({
          tag: "agent",
          summary: "Referral QR image",
          description:
            "Rendered server-side so both clients get an identical image and neither ships a QR library. The only endpoint that returns an image rather than JSON.",
          roles: "AGENT",
          parameters: [queryParam("format", { type: "string", enum: ["png", "svg"], default: "png" }, "Image format.")],
          responses: {
            "200": {
              description: "The QR image.",
              content: { "image/png": { schema: { type: "string", format: "binary" } }, "image/svg+xml": { schema: { type: "string" } } },
            },
          },
        }),
      },
      "/agent/earnings": {
        get: operation({
          tag: "agent",
          summary: "Earnings summary and commission ledger",
          description:
            "Pending, paid and lifetime totals, plus the individual commission rows behind them so an agent can see which payment each came from. The published terms are returned alongside, so no client hardcodes the 10% or the 2% TDS.",
          roles: "AGENT",
          parameters: [
            queryParam("status", { type: "string", enum: ["ACCRUED", "APPROVED", "PAID", "CANCELLED", "FORFEITED"] }, "Filter the ledger."),
            ...PAGINATION_PARAMS,
          ],
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/agent/customers": {
        get: operation({
          tag: "agent",
          summary: "Referred customers, their status and what they pay",
          description: "Only customers locked to this agent's code. Enforced by row-level security, not by the query.",
          roles: "AGENT",
          parameters: PAGINATION_PARAMS,
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/agent/products": {
        get: operation({
          tag: "agent",
          summary: "Assigned products and downloadable sales material",
          description: "Assets are visible only for products assigned to this agent; a guessed product id returns nothing.",
          roles: "AGENT",
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/agent/messages": {
        get: operation({
          tag: "agent",
          summary: "Inbox",
          description: "Messages sent by admins. Malayalam body first; render whichever is present.",
          roles: "AGENT",
          parameters: PAGINATION_PARAMS,
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/agent/profile": {
        get: operation({
          tag: "agent",
          summary: "Profile and settings",
          description: "Geography is not editable — moving panchayat vacates one slot and takes another, and rewrites every coverage report. It is an admin action on request.",
          roles: "AGENT",
          responses: { "200": ok200({ type: "object" }) },
        }),
        put: operation({
          tag: "agent",
          summary: "Update name and occupation",
          description: "The only two fields an agent may change themselves.",
          roles: "AGENT",
          requestBody: body({
            type: "object",
            properties: { name: { type: "string" }, occupation: { type: "string" } },
          }),
          responses: { "200": ok200({ type: "object" }) },
        }),
      },

      /* --------------------------------------------------------- payouts */
      "/payouts/profile": {
        get: operation({
          tag: "payouts",
          summary: "Payout details, masked, and what is blocking a withdrawal",
          description:
            "PAN is returned only as `XXXXX1234F`. `withdrawal.reasons` lists what is outstanding, and `withdrawal.pendingBalancePaise` is the prompt to complete it.",
          roles: "AGENT",
          responses: { "200": ok200(ref("PayoutProfile")) },
        }),
        put: operation({
          tag: "payouts",
          summary: "Submit PAN and bank or UPI details",
          description: [
            "The only place PAN is collected. It is deliberately not asked for at",
            "signup: requesting a PAN from a stranger before they have earned anything",
            "is the strongest scam signal on a Kerala recruitment page, and the public",
            "page states that we do not do it.",
            "",
            "On the way in a PAN is validated, fingerprinted with a keyed HMAC for",
            "duplicate detection, encrypted with AES-256-GCM, and reduced to four",
            "characters for display. The plaintext is never logged, returned, or",
            "written to an audit row.",
            "",
            "One account per PAN. A collision returns `PAN_ALREADY_USED`; per the",
            "accepted terms, duplicates are cancelled and accrued commission forfeited.",
          ].join("\n"),
          roles: "AGENT",
          requestBody: body(ref("PayoutProfileRequest")),
          responses: {
            "200": ok200({ type: "object" }),
            "409": errorResponse("PAN_ALREADY_USED — this PAN belongs to another agent."),
          },
        }),
      },
      "/payouts/mobile/start": {
        post: operation({
          tag: "payouts",
          summary: "Send a verification code to the registered mobile",
          description:
            "The number is not accepted from the client: verifying a number the applicant did not register would defeat the one-account-per-mobile rule. Mobile verification happens here rather than at signup, because a weak connection makes an OTP a failure point and the number is not needed until money moves.",
          roles: "AGENT",
          responses: {
            "200": ok200({ type: "object" }),
            "503": errorResponse("DEPENDENCY_UNAVAILABLE — no SMS provider is configured."),
          },
        }),
      },
      "/payouts/mobile/verify": {
        post: operation({
          tag: "payouts",
          summary: "Confirm the verification code",
          description: "Together with a verified PAN, this unblocks payouts.",
          roles: "AGENT",
          requestBody: body({
            type: "object",
            required: ["code"],
            properties: { code: { type: "string", pattern: "^\\d{6}$" } },
          }),
          responses: { "200": ok200({ type: "object" }) },
        }),
      },

      /* -------------------------------------------------------- products */
      "/products": {
        get: operation({
          tag: "products",
          summary: "Product catalogue",
          description: "Agents see active products; admins see all. No products are seeded — the brief did not name them.",
          responses: { "200": ok200({ type: "object" }) },
        }),
      },

      /* --------------------------------------------------- admin reports */
      "/admin/reports": {
        get: operation({
          tag: "admin-reports",
          summary: "Report catalogue",
          description:
            "Lets a client discover the available reports and their columns instead of hardcoding a list. `defaultReport` names the admin landing view.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          responses: { "200": ok200(ref("ReportCatalogue")) },
        }),
      },
      "/admin/reports/{slug}": {
        get: operation({
          tag: "admin-reports",
          summary: "Run a report as JSON, CSV or PDF",
          description: [
            "One endpoint for every report; the slug selects the query and the filters",
            "are uniform. Available slugs come from `GET /admin/reports`, and include:",
            "",
            "- `zero-agent-panchayats` — the default admin landing view",
            "- `below-threshold-panchayats`, `panchayat-coverage`, `zero-agent-wards`,",
            "  `full-panchayats-waitlist`",
            "- `signups-over-time`, `pending-verification`, `agent-directory`,",
            "  `no-sales-30`, `no-sales-60`, `no-sales-90`, `top-agents`",
            "- `revenue-by-geography`, `outstanding-liability`,",
            "  `tds-by-financial-year`",
            "- `funnel`",
            "",
            "A DISTRICT_ADMIN running a statewide report receives only their own",
            "districts, because the scoping is in the database rather than in the query.",
            "",
            "CSV is UTF-8 with a BOM so Malayalam survives Excel on Windows. **PDF",
            "carries English names only** — the PDF library does not do Indic text",
            "shaping, and emitting broken glyphs would be worse than omitting them;",
            "every PDF says so in its footer.",
          ].join("\n"),
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Report identifier from GET /admin/reports.",
            },
            queryParam("format", { type: "string", enum: ["json", "csv", "pdf"], default: "json" }, "Output format."),
            queryParam("limit", { type: "integer", minimum: 1, maximum: 5000, default: 500 }, "Row cap. `truncated` reports when it was hit."),
            ...GEO_FILTER_PARAMS,
          ],
          responses: {
            "200": {
              description: "The report.",
              headers: RATE_LIMIT_HEADERS,
              content: {
                "application/json": { schema: ref("ReportResult") },
                "text/csv": { schema: { type: "string" } },
                "application/pdf": { schema: { type: "string", format: "binary" } },
              },
            },
            "404": errorResponse("Unknown report slug."),
          },
        }),
      },

      /* --------------------------------------------------- admin actions */
      "/admin/agents/{id}/approve": {
        post: operation({
          tag: "admin-actions",
          summary: "Approve an application",
          description: "Audited. An agent outside the caller's districts returns 404 — confirming it exists would leak that someone is registered elsewhere.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          parameters: [pathParam("id", "Agent id.")],
          requestBody: body({ type: "object", properties: { note: { type: "string" } } }, false),
          responses: { "200": ok200({ type: "object" }), "404": errorResponse("Not found, or outside your districts.") },
        }),
      },
      "/admin/agents/{id}/reject": {
        post: operation({
          tag: "admin-actions",
          summary: "Reject an application",
          description: "A reason is required: rejections are visible to the applicant and recorded in the audit log, so 'no reason given' is not an acceptable state.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          parameters: [pathParam("id", "Agent id.")],
          requestBody: body({
            type: "object",
            required: ["reason"],
            properties: { reason: { type: "string", minLength: 3, maxLength: 500 } },
          }),
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/admin/agents/{id}/suspend": {
        post: operation({
          tag: "admin-actions",
          summary: "Suspend an agent",
          description:
            "Frees the panchayat slot but leaves attribution and accrued commission untouched — a suspended agent's customers stay theirs.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          parameters: [pathParam("id", "Agent id.")],
          requestBody: body({
            type: "object",
            required: ["reason"],
            properties: { reason: { type: "string" } },
          }),
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/admin/agents/{id}/products": {
        post: operation({
          tag: "admin-actions",
          summary: "Assign or unassign products for one agent",
          description: "Every product id is checked against the catalogue before use.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          parameters: [pathParam("id", "Agent id.")],
          requestBody: body({
            type: "object",
            properties: {
              assign: { type: "array", items: { type: "integer" } },
              unassign: { type: "array", items: { type: "integer" } },
            },
          }),
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/admin/products/bulk-assign": {
        post: operation({
          tag: "admin-actions",
          summary: "Assign a product to every agent matching a filter",
          description:
            "How a new product reaches a district without clicking through a thousand agents. The filter resolves inside the scoped transaction, so a DISTRICT_ADMIN submitting an empty filter reaches only their own districts. `maxAgents` is a deliberate safety catch: a run that would exceed it is refused rather than executed.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          requestBody: body({
            type: "object",
            required: ["productId"],
            properties: {
              productId: { type: "integer" },
              filter: { type: "object" },
              maxAgents: { type: "integer", default: 5000 },
            },
          }),
          responses: { "200": ok200({ type: "object" }), "422": errorResponse("Filter matches more agents than maxAgents.") },
        }),
      },
      "/admin/local-bodies/{id}": {
        patch: operation({
          tag: "admin-actions",
          summary: "Adjust slot count, or open and close signups",
          description:
            "Lowering capacity below the agents already in place is allowed and removes nobody — it only stops new applications. The response says so explicitly.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          parameters: [pathParam("id", "Local body id.")],
          requestBody: body({
            type: "object",
            properties: {
              slotCapacity: { type: "integer", minimum: 0, maximum: 500 },
              signupsOpen: { type: "boolean" },
              reason: { type: "string" },
            },
          }),
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/admin/payout-batches": {
        get: operation({
          tag: "admin-actions",
          summary: "List payout batches",
          description: "Newest first.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          responses: { "200": ok200({ type: "object" }) },
        }),
        post: operation({
          tag: "admin-actions",
          summary: "Open a payout batch for a month",
          description:
            "Gathers every releasable commission for the period. A commission is only pulled in when the agent's PAN is verified and their mobile confirmed, which is what the published terms say.",
          roles: "SUPER_ADMIN",
          parameters: [IDEMPOTENCY_HEADER],
          requestBody: body({
            type: "object",
            required: ["period"],
            properties: {
              period: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$", examples: ["2026-09"] },
              note: { type: "string" },
            },
          }),
          responses: { "201": ok200({ type: "object" }) },
        }),
      },
      "/admin/payout-batches/{id}/mark-paid": {
        post: operation({
          tag: "admin-actions",
          summary: "Record that a batch has been transferred",
          description:
            "Moves money in the ledger, so an `Idempotency-Key` is mandatory — a retry on a dropped connection must not mark a batch paid twice. A bank reference is required so the ledger ties to a statement.",
          roles: "SUPER_ADMIN",
          parameters: [pathParam("id", "Batch id."), IDEMPOTENCY_HEADER],
          requestBody: body({
            type: "object",
            required: ["reference"],
            properties: { reference: { type: "string" }, note: { type: "string" } },
          }),
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/admin/payouts/{agentId}/pan": {
        post: operation({
          tag: "admin-actions",
          summary: "Verify, reject, or cancel a duplicate PAN",
          description:
            "The endpoint neither receives nor returns a PAN; an admin sees only the mask and records the outcome of whatever offline check they performed. `DUPLICATE_CANCELLED` forfeits accrued commission, as the accepted terms describe, and therefore requires SUPER_ADMIN.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN (DUPLICATE_CANCELLED: SUPER_ADMIN only)",
          parameters: [pathParam("agentId", "Agent id.")],
          requestBody: body({
            type: "object",
            required: ["decision"],
            properties: {
              decision: { type: "string", enum: ["VERIFIED", "REJECTED", "DUPLICATE_CANCELLED"] },
              note: { type: "string" },
            },
          }),
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/admin/messages": {
        get: operation({
          tag: "admin-actions",
          summary: "Messages sent",
          description: "Each row records the filter that selected its recipients.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          responses: { "200": ok200({ type: "object" }) },
        }),
        post: operation({
          tag: "admin-actions",
          summary: "Message agents, filtered by geography or status",
          description:
            "Recipients resolve inside the scoped transaction. Delivery is in-app only: no SMS or email provider is configured.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          requestBody: body({
            type: "object",
            required: ["subject"],
            properties: {
              subject: { type: "string" },
              bodyMl: { type: "string" },
              bodyEn: { type: "string" },
              audience: { type: "object" },
              maxRecipients: { type: "integer", default: 5000 },
            },
          }),
          responses: { "201": ok200({ type: "object" }) },
        }),
      },
      "/admin/users": {
        get: operation({
          tag: "admin-actions",
          summary: "List admin users and their district assignments",
          description: "SUPER_ADMIN rows show `districts: \"ALL\"`.",
          roles: "SUPER_ADMIN",
          responses: { "200": ok200({ type: "object" }) },
        }),
        post: operation({
          tag: "admin-actions",
          summary: "Grant a role and district assignments",
          description:
            "This is why no email address is hardcoded anywhere: who is an admin is a row, changed here, recorded in the audit log. A DISTRICT_ADMIN with no districts is rejected, because they would be able to see nothing.",
          roles: "SUPER_ADMIN",
          requestBody: body({
            type: "object",
            required: ["email", "role"],
            properties: {
              email: { type: "string", format: "email" },
              role: { type: "string", enum: ["AGENT", "DISTRICT_ADMIN", "SUPER_ADMIN"] },
              districtIds: { type: "array", items: { type: "integer" } },
            },
          }),
          responses: { "201": ok200({ type: "object" }) },
        }),
      },
      "/admin/review-flags": {
        get: operation({
          tag: "admin-actions",
          summary: "The abuse review queue",
          description:
            "Flags are raised automatically and never block anyone. A shared device in an Akshaya centre is a normal case for this programme, so several signups from one device is a question for a human rather than grounds for rejection.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          parameters: [
            queryParam("status", { type: "string", enum: ["OPEN", "DISMISSED", "ACTIONED"], default: "OPEN" }, "Queue to read."),
            queryParam("districtId", { type: "integer" }, "Narrow to one district."),
            ...PAGINATION_PARAMS,
          ],
          responses: { "200": ok200({ type: "object" }) },
        }),
        patch: operation({
          tag: "admin-actions",
          summary: "Dismiss or action flags",
          description: "`outOfScope` reports any ids that fell outside the caller's districts, rather than silently ignoring them.",
          roles: "DISTRICT_ADMIN or SUPER_ADMIN",
          requestBody: body({
            type: "object",
            required: ["flagIds", "status"],
            properties: {
              flagIds: { type: "array", items: { type: "integer" } },
              status: { type: "string", enum: ["DISMISSED", "ACTIONED"] },
            },
          }),
          responses: { "200": ok200({ type: "object" }) },
        }),
      },
      "/admin/audit-log": {
        get: operation({
          tag: "admin-actions",
          summary: "The immutable audit trail",
          description:
            "Every admin action: who, what, when, and the before/after of the change. The table has no UPDATE or DELETE policy, the application role lacks the privilege, and a trigger rejects both — so entries cannot be edited away. There is no write endpoint; entries are written by the actions themselves, in the same transaction as the change.",
          roles: "SUPER_ADMIN",
          parameters: [
            queryParam("actorUserId", { type: "integer" }, "Filter by who acted."),
            queryParam("action", { type: "string" }, "Filter by action, e.g. agent.approve."),
            queryParam("entityType", { type: "string" }, "Filter by entity type."),
            queryParam("entityId", { type: "string" }, "Filter by entity id."),
            ...PAGINATION_PARAMS,
          ],
          responses: { "200": ok200({ type: "object" }) },
        }),
      },

      /* ----------------------------------------------------- attribution */
      "/attribution/claim": {
        post: operation({
          tag: "attribution",
          summary: "Claim a customer for an agent code",
          description: [
            "**First code wins, permanently.** With ten agents per panchayat, two",
            "agents claiming the same customer is certain, so the rule is decided in",
            "the schema: one attribution row per customer, a unique constraint on",
            "`customer_id`, and no UPDATE policy on the table at all. There is no",
            "reassignment path in this API.",
            "",
            "Every attempt is recorded, accepted or rejected, with the code as",
            "presented and the reason. That log is the entire basis for settling a",
            "dispute from data. A losing claim receives `heldBy` so the caller can see",
            "who holds it without a second request.",
            "",
            "Called by a product system, not by an agent or a browser.",
          ].join("\n"),
          roles: "SUPER_ADMIN (service credential)",
          requestBody: body(ref("AttributionClaimRequest")),
          responses: {
            "200": ok200({ type: "object" }, "Not attributed. See `reason`: UNKNOWN_CODE, AGENT_NOT_APPROVED or ALREADY_ATTRIBUTED."),
            "201": ok200({ type: "object" }, "Attribution locked to this agent."),
          },
        }),
      },
      "/payments": {
        post: operation({
          tag: "attribution",
          summary: "Record a customer payment and accrue commission",
          description: [
            "Creates money, so: an `Idempotency-Key` is mandatory, `externalRef` is",
            "unique as a second line of defence, and the arithmetic is re-checked by a",
            "database constraint so a bug here cannot write an inconsistent ledger row.",
            "",
            "Commission is 10% of the amount net of GST and gateway charges, less 2%",
            "TDS under Section 194H. It accrues only for an APPROVED agent holding the",
            "attribution; an unattributed payment is recorded with",
            "`commissionAccrued: false` rather than rejected.",
          ].join("\n"),
          roles: "SUPER_ADMIN (service credential)",
          parameters: [IDEMPOTENCY_HEADER],
          requestBody: body(ref("PaymentRequest")),
          responses: { "201": ok200({ type: "object" }) },
        }),
      },

      /* ------------------------------------------------------- analytics */
      "/events": {
        post: operation({
          tag: "meta",
          summary: "Funnel instrumentation beacon",
          description: [
            "Public, because the events that matter most happen before anyone signs in.",
            "",
            "Built so that leaking personal data by accident is hard: the event name",
            "must be on a fixed list, property keys must be allowlisted, values must be",
            "truncated primitives, and no user id, IP address or user agent is stored.",
            "The session id is client-generated, rotating, and never joined to a user.",
            "",
            "The result is a funnel by district rather than by individual — which is",
            "what the reports need. Returns 202: a client should never wait on or retry",
            "a beacon.",
          ].join("\n"),
          security: false,
          requestBody: body(ref("EventRequest")),
          responses: { "202": ok200({ type: "object" }, "Accepted.") },
        }),
      },
    },
  };
}
