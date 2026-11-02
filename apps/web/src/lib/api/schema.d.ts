/**
 * GENERATED FILE — do not edit.
 *
 * Produced from the API's OpenAPI 3.1 document by scripts/generate-api-types.mjs.
 * Regenerate with: npm run api:types --workspace=apps/web
 *
 * Source: apps/api/openapi/openapi.json
 */

export interface paths {
    "/admin/agents/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Approve an application
         * @description Audited. An agent outside the caller's districts returns 404 — confirming it exists would leak that someone is registered elsewhere.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Agent id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        note?: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Not found, or outside your districts. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/agents/{id}/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Assign or unassign products for one agent
         * @description Every product id is checked against the catalogue before use.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Agent id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        assign?: number[];
                        unassign?: number[];
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/agents/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Reject an application
         * @description A reason is required: rejections are visible to the applicant and recorded in the audit log, so 'no reason given' is not an acceptable state.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Agent id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        reason: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/agents/{id}/suspend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Suspend an agent
         * @description Frees the panchayat slot but leaves attribution and accrued commission untouched — a suspended agent's customers stay theirs.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Agent id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        reason: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/audit-log": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * The immutable audit trail
         * @description Every admin action: who, what, when, and the before/after of the change. The table has no UPDATE or DELETE policy, the application role lacks the privilege, and a trigger rejects both — so entries cannot be edited away. There is no write endpoint; entries are written by the actions themselves, in the same transaction as the change.
         *
         *     **Requires role:** SUPER_ADMIN
         */
        get: {
            parameters: {
                query?: {
                    /** @description Filter by action, e.g. agent.approve. */
                    action?: string;
                    /** @description Filter by who acted. */
                    actorUserId?: number;
                    /** @description Opaque cursor from a previous pageInfo.nextCursor. */
                    cursor?: string;
                    /** @description Filter by entity id. */
                    entityId?: string;
                    /** @description Filter by entity type. */
                    entityType?: string;
                    /** @description Page size. */
                    limit?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/local-bodies/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Adjust slot count, or open and close signups
         * @description Lowering capacity below the agents already in place is allowed and removes nobody — it only stops new applications. The response says so explicitly.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Local body id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        reason?: string;
                        signupsOpen?: boolean;
                        slotCapacity?: number;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/admin/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Messages sent
         * @description Each row records the filter that selected its recipients.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Message agents, filtered by geography or status
         * @description Recipients resolve inside the scoped transaction. Delivery is in-app only: no SMS or email provider is configured.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        audience?: Record<string, unknown>;
                        bodyEn?: string;
                        bodyMl?: string;
                        /** @default 5000 */
                        maxRecipients?: number;
                        subject: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                201: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/payout-batches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List payout batches
         * @description Newest first.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Open a payout batch for a month
         * @description Gathers every releasable commission for the period. A commission is only pulled in when the agent's PAN is verified and their mobile confirmed, which is what the published terms say.
         *
         *     **Requires role:** SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description Required on every endpoint that writes money. A retry with the same key replays the original response instead of repeating the work. Reusing a key with a different body is an error. */
                    "Idempotency-Key": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        note?: string;
                        /** @example 2026-09 */
                        period: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                201: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/payout-batches/{id}/mark-paid": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Record that a batch has been transferred
         * @description Moves money in the ledger, so an `Idempotency-Key` is mandatory — a retry on a dropped connection must not mark a batch paid twice. A bank reference is required so the ledger ties to a statement.
         *
         *     **Requires role:** SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description Required on every endpoint that writes money. A retry with the same key replays the original response instead of repeating the work. Reusing a key with a different body is an error. */
                    "Idempotency-Key": string;
                };
                path: {
                    /** @description Batch id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        note?: string;
                        reference: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/payouts/{agentId}/pan": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Verify, reject, or cancel a duplicate PAN
         * @description The endpoint neither receives nor returns a PAN; an admin sees only the mask and records the outcome of whatever offline check they performed. `DUPLICATE_CANCELLED` forfeits accrued commission, as the accepted terms describe, and therefore requires SUPER_ADMIN.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN (DUPLICATE_CANCELLED: SUPER_ADMIN only)
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Agent id. */
                    agentId: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        decision: "VERIFIED" | "REJECTED" | "DUPLICATE_CANCELLED";
                        note?: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Set a product's fee, referral rates and links
         * @description `feePaise: null` makes the product FREE: a member's friends then earn them
         *     diamonds rather than cash. `sellerRateBps` is the seller band, 1000 to
         *     3000. `userRateBps` is what a member earns on a paid product, default 100.
         *     `webUrl` and `playUrl` are where `/r/{code}?app=slug` sends a visitor.
         *
         *     SUPER_ADMIN only: the rates are a company-wide decision, and the products
         *     write policy admits nobody else.
         *
         *     **Requires role:** SUPER_ADMIN
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Product id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["ProductSettingsRequest"];
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            product: components["schemas"]["AdminProduct"];
                        };
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unknown product. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/admin/products/{id}/api-keys": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List a product's API keys
         * @description Never the hash, never the plaintext. Revoked keys are listed with `revokedAt` set.
         *
         *     **Requires role:** SUPER_ADMIN
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Product id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            data: components["schemas"]["ApiKey"][];
                        };
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Mint an API key for a product system
         * @description The plaintext is in this response and nowhere else, ever: only its
         *     SHA-256 is stored. A `client` key ships inside an app and may call
         *     `/members`, `/attribution/claim` and the click log; a `server` key is
         *     held by the product's backend and may additionally call `/payments`.
         *     The same can be done offline with `scripts/mint-api-key.mts`.
         *
         *     **Requires role:** SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Product id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["ApiKeyMintRequest"];
                };
            };
            responses: {
                /** @description Minted. */
                201: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            key: components["schemas"]["ApiKey"] & {
                                /** @description Product slug. */
                                product?: string;
                            };
                            /**
                             * @description Shown once.
                             * @example ck_live_7k2m9qx4w3e8r5t6y1u0p9a2s3d4f5g6
                             */
                            plaintext: string;
                        };
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unknown product. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/products/{id}/api-keys/{keyId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Revoke an API key
         * @description The row stays, stamped, for the audit trail; the next request with the key gets 401.
         *
         *     **Requires role:** SUPER_ADMIN
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Product id. */
                    id: number;
                    /** @description Key id. */
                    keyId: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            key?: components["schemas"]["ApiKey"];
                            revoked: boolean;
                        };
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description No active key with that id for this product. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/products/bulk-assign": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Assign a product to every agent matching a filter
         * @description How a new product reaches a district without clicking through a thousand agents. The filter resolves inside the scoped transaction, so a DISTRICT_ADMIN submitting an empty filter reaches only their own districts. `maxAgents` is a deliberate safety catch: a run that would exceed it is refused rather than executed.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        filter?: Record<string, unknown>;
                        /** @default 5000 */
                        maxAgents?: number;
                        productId: number;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Filter matches more agents than maxAgents. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Report catalogue
         * @description Lets a client discover the available reports and their columns instead of hardcoding a list. `defaultReport` names the admin landing view.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ReportCatalogue"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/reports/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Run a report as JSON, CSV or PDF
         * @description One endpoint for every report; the slug selects the query and the filters
         *     are uniform. Available slugs come from `GET /admin/reports`, and include:
         *
         *     - `zero-agent-panchayats` — the default admin landing view
         *     - `below-threshold-panchayats`, `panchayat-coverage`, `zero-agent-wards`,
         *       `full-panchayats-waitlist`
         *     - `signups-over-time`, `pending-verification`, `agent-directory`,
         *       `no-sales-30`, `no-sales-60`, `no-sales-90`, `top-agents`
         *     - `revenue-by-geography`, `outstanding-liability`,
         *       `tds-by-financial-year`
         *     - `funnel`
         *
         *     A DISTRICT_ADMIN running a statewide report receives only their own
         *     districts, because the scoping is in the database rather than in the query.
         *
         *     CSV is UTF-8 with a BOM so Malayalam survives Excel on Windows. **PDF
         *     carries English names only** — the PDF library does not do Indic text
         *     shaping, and emitting broken glyphs would be worse than omitting them;
         *     every PDF says so in its footer.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        get: {
            parameters: {
                query?: {
                    /** @description Narrow to one block panchayat. */
                    blockId?: number;
                    /** @description Narrow to one district. */
                    districtId?: number;
                    /** @description Output format. */
                    format?: "json" | "csv" | "pdf";
                    /** @description Start of the date range, inclusive. */
                    from?: string;
                    /** @description Row cap. `truncated` reports when it was hit. */
                    limit?: number;
                    /** @description Narrow to one panchayat, municipality or corporation. */
                    localBodyId?: number;
                    /** @description End of the date range, inclusive. */
                    to?: string;
                    /** @description Narrow to one ward. */
                    wardId?: number;
                };
                header?: never;
                path: {
                    /** @description Report identifier from GET /admin/reports. */
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The report. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ReportResult"];
                        "application/pdf": string;
                        "text/csv": string;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unknown report slug. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/review-flags": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * The abuse review queue
         * @description Flags are raised automatically and never block anyone. A shared device in an Akshaya centre is a normal case for this programme, so several signups from one device is a question for a human rather than grounds for rejection.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        get: {
            parameters: {
                query?: {
                    /** @description Opaque cursor from a previous pageInfo.nextCursor. */
                    cursor?: string;
                    /** @description Narrow to one district. */
                    districtId?: number;
                    /** @description Page size. */
                    limit?: number;
                    /** @description Queue to read. */
                    status?: "OPEN" | "DISMISSED" | "ACTIONED";
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Dismiss or action flags
         * @description `outOfScope` reports any ids that fell outside the caller's districts, rather than silently ignoring them.
         *
         *     **Requires role:** DISTRICT_ADMIN or SUPER_ADMIN
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        flagIds: number[];
                        /** @enum {string} */
                        status: "DISMISSED" | "ACTIONED";
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/admin/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List admin users and their district assignments
         * @description SUPER_ADMIN rows show `districts: "ALL"`.
         *
         *     **Requires role:** SUPER_ADMIN
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Grant a role and district assignments
         * @description This is why no email address is hardcoded anywhere: who is an admin is a row, changed here, recorded in the audit log. A DISTRICT_ADMIN with no districts is rejected, because they would be able to see nothing.
         *
         *     **Requires role:** SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        districtIds?: number[];
                        /** Format: email */
                        email: string;
                        /** @enum {string} */
                        role: "AGENT" | "DISTRICT_ADMIN" | "SUPER_ADMIN";
                    };
                };
            };
            responses: {
                /** @description Success. */
                201: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent/customers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Referred customers, their status and what they pay
         * @description Only customers locked to this agent's code. Enforced by row-level security, not by the query.
         *
         *     **Requires role:** AGENT
         */
        get: {
            parameters: {
                query?: {
                    /** @description Opaque cursor from a previous pageInfo.nextCursor. */
                    cursor?: string;
                    /** @description Page size. */
                    limit?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Everything for the agent home screen
         * @description One request on purpose. The target device is a budget Android phone on one bar of 4G, where four sequential round trips is the difference between usable and not.
         *
         *     **Requires role:** AGENT
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AgentDashboard"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent/earnings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Earnings summary and commission ledger
         * @description Pending, paid and lifetime totals, plus the individual commission rows behind them so an agent can see which payment each came from. The terms that apply to this agent are returned alongside as `terms` (see CommissionTerms): the rate is per product and per tier, so no client hardcodes a percentage or the 2% TDS.
         *
         *     **Requires role:** AGENT
         */
        get: {
            parameters: {
                query?: {
                    /** @description Opaque cursor from a previous pageInfo.nextCursor. */
                    cursor?: string;
                    /** @description Page size. */
                    limit?: number;
                    /** @description Filter the ledger. */
                    status?: "ACCRUED" | "APPROVED" | "PAID" | "CANCELLED" | "FORFEITED";
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            data: {
                                /** Format: date-time */
                                accruedAt?: string;
                                basePaise?: number;
                                customerName?: string;
                                financialYear?: string;
                                grossCommissionPaise?: number;
                                id?: number;
                                netCommissionPaise?: number;
                                /** Format: date-time */
                                paidAt?: string | null;
                                /** Format: date-time */
                                paymentPaidAt?: string;
                                productName?: string | null;
                                productSlug?: string | null;
                                rateBps?: number;
                                /** @enum {string} */
                                status?: "ACCRUED" | "APPROVED" | "PAID" | "CANCELLED" | "FORFEITED";
                                tdsPaise?: number;
                                /** @enum {string|null} */
                                tier?: "USER" | "SELLER" | null;
                            }[];
                            pageInfo: components["schemas"]["PageInfo"];
                            summary: components["schemas"]["EarningsSummary"];
                            terms: components["schemas"]["CommissionTerms"];
                        };
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Inbox
         * @description Messages sent by admins. Malayalam body first; render whichever is present.
         *
         *     **Requires role:** AGENT
         */
        get: {
            parameters: {
                query?: {
                    /** @description Opaque cursor from a previous pageInfo.nextCursor. */
                    cursor?: string;
                    /** @description Page size. */
                    limit?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Assigned products and downloadable sales material
         * @description Assets are visible only for products assigned to this agent; a guessed product id returns nothing.
         *
         *     **Requires role:** AGENT
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Profile and settings
         * @description Geography is not editable — moving panchayat vacates one slot and takes another, and rewrites every coverage report. It is an admin action on request.
         *
         *     **Requires role:** AGENT
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /**
         * Update name and occupation
         * @description The only two fields an agent may change themselves.
         *
         *     **Requires role:** AGENT
         */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name?: string;
                        occupation?: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent/referral": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Referral code, link, QR and WhatsApp share
         * @description Separate from the dashboard so a share sheet can refresh it without refetching earnings.
         *
         *     **Requires role:** AGENT
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent/referral/qr": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Referral QR image
         * @description Rendered server-side so both clients get an identical image and neither ships a QR library. The only endpoint that returns an image rather than JSON.
         *
         *     **Requires role:** AGENT
         */
        get: {
            parameters: {
                query?: {
                    /** @description Image format. */
                    format?: "png" | "svg";
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The QR image. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "image/png": string;
                        "image/svg+xml": string;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attribution/claim": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Claim a customer for an agent code
         * @description **First code wins, permanently.** With ten agents per panchayat, two
         *     agents claiming the same customer is certain, so the rule is decided in
         *     the schema: one attribution row per customer, a unique constraint on
         *     `customer_id`, and no UPDATE policy on the table at all. There is no
         *     reassignment path in this API.
         *
         *     Every attempt is recorded, accepted or rejected, with the code as
         *     presented and the reason. That log is the entire basis for settling a
         *     dispute from data. A losing claim receives `heldBy` so the caller can see
         *     who holds it without a second request.
         *
         *     Called by a product system with its API key (client or server), or by a
         *     SUPER_ADMIN naming `productSlug`. The customer reference is stored as
         *     `<product slug>:<customerExternalRef>`, so send the app's own user id —
         *     the same value sent to `POST /members` for that user.
         *
         *     The code may be a seller's `CA-…` or a member's `RF-…`; both live in one
         *     namespace. A member cannot claim themselves (`SELF_REFERRAL`). On a FREE
         *     product a member earns one diamond when the claim is accepted; on a PAID
         *     product nothing is earned until the friend pays (`POST /payments`).
         *
         *     **Requires role:** API key (client or server), or SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["AttributionClaimRequest"];
                };
            };
            responses: {
                /** @description Not attributed. See `reason`: UNKNOWN_CODE, AGENT_NOT_APPROVED, SELF_REFERRAL or ALREADY_ATTRIBUTED. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AttributionResult"];
                    };
                };
                /** @description Attribution locked to this code. */
                201: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AttributionResult"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/google": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Exchange a Google credential for our tokens
         * @description Accepts either an ID token (native clients) or an authorization code plus
         *     redirect URI and PKCE verifier (web). Both are verified against Google
         *     server-side.
         *
         *     A new account is always created as `AGENT`. Elevation to an admin role is
         *     an explicit, audited admin action — it never happens here, and no email
         *     address is compared against a constant anywhere in the codebase.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["GoogleAuthRequest"];
                };
            };
            responses: {
                /** @description Session established. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Session"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description INVALID_GOOGLE_TOKEN — Google rejected or we could not verify the credential. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Revoke a refresh token
         * @description The access token remains valid until it expires — that is the cost of stateless auth, and why its lifetime is 15 minutes.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        refreshToken: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            revoked?: boolean;
                        };
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Rotate a refresh token
         * @description Returns a new token pair and invalidates the presented one. Presenting an already-rotated token revokes every session for that user — treat REFRESH_TOKEN_REUSED as 'sign in again'.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        refreshToken: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Session"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description INVALID_TOKEN, TOKEN_EXPIRED or REFRESH_TOKEN_REUSED. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Funnel instrumentation beacon
         * @description Public, because the events that matter most happen before anyone signs in.
         *
         *     Built so that leaking personal data by accident is hard: the event name
         *     must be on a fixed list, property keys must be allowlisted, values must be
         *     truncated primitives, and no user id, IP address or user agent is stored.
         *     The session id is client-generated, rotating, and never joined to a user.
         *
         *     The result is a funnel by district rather than by individual — which is
         *     what the reports need. Returns 202: a client should never wait on or retry
         *     a beacon.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["EventRequest"];
                };
            };
            responses: {
                /** @description Accepted. */
                202: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geography/districts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * The 14 districts of Kerala
         * @description Public. Rendered server-side by the recruitment page before anyone signs in.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            data?: components["schemas"]["District"][];
                        };
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geography/districts/{id}/blocks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Block panchayats in a district
         * @description Used by admin report filters. The signup flow does not need it — applicants pick a local body directly.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description District id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geography/local-bodies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Search panchayats, municipalities and corporations
         * @description Public, searchable, cursor paginated.
         *
         *     `q` matches either script and tolerates transliteration: 'Kodenchery',
         *     'കോടഞ്ചേരി' and 'kodancheri' all reach the same row, via trigram
         *     similarity over both name columns. Exact and prefix matches rank first.
         *
         *     Urban bodies appear in the same list as gram panchayats, distinguished by
         *     `type`. Each row carries live `filled` / `remaining` counts.
         */
        get: {
            parameters: {
                query?: {
                    /** @description Opaque cursor from a previous pageInfo.nextCursor. */
                    cursor?: string;
                    /** @description Restrict to one district. */
                    districtId?: number;
                    /** @description Page size. */
                    limit?: number;
                    /** @description Only bodies still accepting applications. */
                    onlyOpen?: boolean;
                    /** @description Search text, Malayalam or English. */
                    q?: string;
                    /** @description Restrict to one kind of local body. */
                    type?: "GRAM_PANCHAYAT" | "MUNICIPALITY" | "CORPORATION";
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            data: components["schemas"]["LocalBody"][];
                            pageInfo: components["schemas"]["PageInfo"];
                        };
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geography/local-bodies/{id}/availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Live slot availability
         * @description Read from the database on every request. This number appears on the public recruitment page as a trust signal, so it is never cached and never estimated.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Local body id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Availability"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geography/local-bodies/{id}/wards": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Wards in a local body
         * @description Wards with `status: PENDING` exist because the official count is known but no name has been loaded. They are returned with a null name rather than omitted, so the picker can still offer 'Ward 7' and our data gap does not block an applicant. An empty list carries an explanatory `note`.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Local body id. */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WardList"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Liveness and database reachability
         * @description Used by the deployment check. Returns 503 if the database is unreachable.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            database?: string;
                            /** @enum {string} */
                            status?: "ok" | "degraded";
                            version?: string;
                        };
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Database unreachable. */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Current user, role, agent summary and where to land
         * @description The endpoint the frontend renders its navigation from. `landing` says where this client should go after sign-in, so routing by role is a server decision.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MeResponse"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * DPDP erasure request
         * @description Clears identifying fields and tombstones the account. Commission and TDS records are retained for the statutory period stated in the privacy policy, so the row is not hard-deleted.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Update the fields a user owns
         * @description Name only. Email comes from Google and is not editable.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name?: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/me/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * DPDP data portability export
         * @description Everything held about the caller. PAN and bank account appear as masks only — plaintext is never returned over the API, even to its owner, because that would put it in caches and proxy logs.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Find or create a user's invite code
         * @description Call this when a user signs in to your app. The first call creates the
         *     member and their immutable `RF-…` code; every later call returns the same
         *     code with fresh stats. Idempotent, so calling it on every sign-in is the
         *     intended usage.
         *
         *     `externalRef` is your own user id. It is namespaced per product, and it is
         *     the same value you send as `customerExternalRef` when this user joins
         *     through somebody else's code.
         *
         *     **Requires role:** API key (client or server)
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["MemberRequest"];
                };
            };
            responses: {
                /** @description Existing member. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Member"];
                    };
                };
                /** @description Member created. */
                201: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Member"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/members/{externalRef}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * A member's code and stats
         * @description The same shape as POST /members, for refreshing stats without re-sending the profile. 404 until POST /members has been called for that user.
         *
         *     **Requires role:** API key (client or server)
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Your own user id, as sent to POST /members. */
                    externalRef: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Member"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description No member with that reference. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/openapi.json": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * This specification
         * @description Served so clients can generate types against the running deployment.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The OpenAPI 3.1 document. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Record a customer payment and accrue commission
         * @description Creates money, so: an `Idempotency-Key` is mandatory, `externalRef` is
         *     unique as a second line of defence, and the arithmetic is re-checked by a
         *     database constraint so a bug here cannot write an inconsistent ledger row.
         *
         *     Commission is a percentage of the amount net of GST and gateway charges,
         *     less 2% TDS under Section 194H. The percentage depends on who holds the
         *     attribution: a SELLER earns the product's `sellerRateBps` (10% to 30%),
         *     a USER-tier member earns the product's `userRateBps` (default 1%). It
         *     accrues only for an APPROVED referrer; an unattributed payment is recorded
         *     with `commissionAccrued: false` rather than rejected.
         *
         *     Only a SERVER key may call this — a client key ships inside an app. The
         *     customer reference is namespaced exactly as in `/attribution/claim`.
         *
         *     **Requires role:** API key (server only), or SUPER_ADMIN
         */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description Required on every endpoint that writes money. A retry with the same key replays the original response instead of repeating the work. Reusing a key with a different body is an error. */
                    "Idempotency-Key": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PaymentRequest"];
                };
            };
            responses: {
                /** @description Already recorded under this externalRef; nothing changed. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PaymentResult"];
                    };
                };
                /** @description Recorded. `commissionAccrued` says whether a commission row was written. */
                201: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PaymentResult"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unknown customer reference — call /attribution/claim first, or the customer joined with no code. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payouts/mobile/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Send a verification code to the registered mobile
         * @description The number is not accepted from the client: verifying a number the applicant did not register would defeat the one-account-per-mobile rule. Mobile verification happens here rather than at signup, because a weak connection makes an OTP a failure point and the number is not needed until money moves.
         *
         *     **Requires role:** AGENT
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description DEPENDENCY_UNAVAILABLE — no SMS provider is configured. */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payouts/mobile/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirm the verification code
         * @description Together with a verified PAN, this unblocks payouts.
         *
         *     **Requires role:** AGENT
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        code: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payouts/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Payout details, masked, and what is blocking a withdrawal
         * @description PAN is returned only as `XXXXX1234F`. `withdrawal.reasons` lists what is outstanding, and `withdrawal.pendingBalancePaise` is the prompt to complete it.
         *
         *     **Requires role:** AGENT
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PayoutProfile"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /**
         * Submit PAN and bank or UPI details
         * @description The only place PAN is collected. It is deliberately not asked for at
         *     signup: requesting a PAN from a stranger before they have earned anything
         *     is the strongest scam signal on a Kerala recruitment page, and the public
         *     page states that we do not do it.
         *
         *     On the way in a PAN is validated, fingerprinted with a keyed HMAC for
         *     duplicate detection, encrypted with AES-256-GCM, and reduced to four
         *     characters for display. The plaintext is never logged, returned, or
         *     written to an audit row.
         *
         *     One account per PAN. A collision returns `PAN_ALREADY_USED`; per the
         *     accepted terms, duplicates are cancelled and accrued commission forfeited.
         *
         *     **Requires role:** AGENT
         */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PayoutProfileRequest"];
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description PAN_ALREADY_USED — this PAN belongs to another agent. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Product catalogue
         * @description Agents see active products; admins see all. The catalogue is seeded from scripts/seed.mts, so it is the same everywhere and cannot drift.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public/leaderboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Public leaderboard of referral earnings
         * @description Who has earned the most from referrals, both tiers, across every app or
         *     filtered to one. Names are masked to first name and last initial and
         *     nothing identifying is returned. Cached for 60 seconds.
         */
        get: {
            parameters: {
                query?: {
                    /** @description Product slug. Omit for every product. */
                    app?: string;
                    /** @description Rows to return. */
                    limit?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Leaderboard"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Active products and what a referrer earns on each
         * @description Public. Used by the rewards page filter and by the /r/{code} redirect on the website.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            data: components["schemas"]["PublicProduct"][];
                        };
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public/products/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * One product's public referral facts
         * @description Free or paid, the rates, and the web and Play URLs a referral link resolves to.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Product slug. */
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublicProduct"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unknown or inactive product. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public/qr": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * QR image for an invite link
         * @description Encodes `https://<web>/r/{code}?app={app}`. Public and cacheable; no app ships a QR library.
         */
        get: {
            parameters: {
                query: {
                    /** @description Product slug. */
                    app: string;
                    /** @description The invite code. */
                    code: string;
                    /** @description Image format. */
                    format?: "png" | "svg";
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The QR image. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "image/png": string;
                        "image/svg+xml": string;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/public/referral-clicks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Log a click on an invite link
         * @description Fired by the website's /r/{code} redirect before it sends the visitor on. No user id and no full IP is stored. Returns 202; never wait on it.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["ReferralClickRequest"];
                };
            };
            responses: {
                /** @description Accepted. */
                202: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            accepted?: boolean;
                        };
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/signup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Submit an application
         * @description Step 2 of the flow; step 1 is Google Sign-In. Six required fields and
         *     nothing more — no PAN, no bank details, no document upload.
         *
         *     Runs as one transaction: validate the geography triple, lock the local
         *     body and take a slot, issue the agent code, write the agent, record
         *     consent, record abuse signals. A failure anywhere leaves no half-created
         *     agent and no consumed slot.
         *
         *     The agent code format is `CA-<district>-<sequence>`, e.g. `CA-KKD-000123`.
         *
         *     **Requires role:** AGENT (any signed-in user without an existing application)
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["SignupRequest"];
                };
            };
            responses: {
                /** @description Application created; agent code issued. */
                201: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SignupResponse"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description ALREADY_REGISTERED, MOBILE_ALREADY_USED or PANCHAYAT_CLOSED. A panchayat at capacity is NOT a rejection. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/signup/eligibility": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Can this account apply, and is the panchayat open
         * @description Answered server-side so the 'you already applied' case never reaches the form.
         */
        get: {
            parameters: {
                query?: {
                    /** @description Check availability for this body too. */
                    localBodyId?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Eligibility"];
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/signup/qualifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Optional qualification answers
         * @description Step 3, optional in every sense: every field is nullable, the step may be skipped entirely, and skipping it does not affect the application.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["QualificationsRequest"];
                };
            };
            responses: {
                /** @description Success. */
                200: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/signup/waitlist": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Join the waitlist for a full panchayat
         * @description What a full panchayat offers instead of an application. Waitlist counts drive the admin report that identifies where to raise the slot count.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        districtId: number;
                        localBodyId: number;
                        mobile: string;
                    };
                };
            };
            responses: {
                /** @description Success. */
                201: {
                    headers: {
                        /** @description Requests allowed per window. */
                        "RateLimit-Limit"?: number;
                        /** @description Requests left in this window. */
                        "RateLimit-Remaining"?: number;
                        /** @description Seconds until the window resets. */
                        "RateLimit-Reset"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": Record<string, unknown>;
                    };
                };
                /** @description Validation failed, or a geography id was not recognised. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Missing, malformed or expired access token. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Authenticated but not permitted, or outside district scope. */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Rate limit exceeded. See RateLimit-* and Retry-After headers. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Unexpected error. The requestId identifies it in the logs. */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AdminProduct: components["schemas"]["PublicProduct"] & {
            active?: boolean;
            /** Format: date-time */
            createdAt?: string;
        };
        AgentDashboard: {
            agent: {
                agentCode?: string;
                id?: number;
                mobileVerified?: boolean;
                status?: string;
            };
            customers: {
                recent?: {
                    customerId?: number;
                    displayName?: string;
                    /** Format: date-time */
                    lockedAt?: string;
                    status?: string;
                }[];
                total?: number;
            };
            earnings: components["schemas"]["EarningsSummary"];
            payout: components["schemas"]["PayoutState"];
            products: {
                id?: number;
                nameEn?: string;
                nameMl?: string;
                slug?: string;
            }[];
            referral: {
                code?: string;
                link?: string;
                qrUrl?: string;
                whatsappShareUrl?: string;
            };
        };
        AgentSummary: {
            /** @example CA-KKD-000123 */
            agentCode?: string;
            districtId?: number;
            districtNameEn?: string;
            districtNameMl?: string;
            id?: number;
            localBodyId?: number;
            localBodyNameEn?: string;
            localBodyNameMl?: string;
            /** Format: date-time */
            mobileVerifiedAt?: string | null;
            /** @enum {string} */
            status?: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED" | "WAITLISTED" | "WITHDRAWN";
        } | null;
        ApiKey: {
            /** Format: date-time */
            createdAt: string;
            id: number;
            /** @enum {string} */
            kind: "client" | "server";
            label: string;
            productId: number;
            /** Format: date-time */
            revokedAt: string | null;
        };
        ApiKeyMintRequest: {
            /**
             * @description `client` ships inside an app: members, claims, clicks. `server` is held by the product backend and may also record payments.
             * @enum {string}
             */
            kind: "client" | "server";
            /** @description Where this key lives, e.g. "Android 2.4" or "billing worker". */
            label: string;
        };
        AttributionClaimRequest: {
            /** @description A seller's `CA-…` code or a member's `RF-…` invite code. Case-insensitive. */
            agentCode: string;
            /** @description The customer's id in the calling app — the same value the app sends as `externalRef` to POST /members for that user. Stored namespaced as `<product slug>:<customerExternalRef>`. */
            customerExternalRef: string;
            customerName: string;
            /** @description Only for a SUPER_ADMIN caller. A service key's product is implied and this field is ignored. */
            productSlug?: string;
            /** @description Where the code came from: "referral_link", "typed", "qr", "install_referrer". */
            source?: string;
        };
        AttributionResult: {
            /** @description The code that now holds the customer. */
            agentCode?: string;
            agentStatus?: string;
            attributed: boolean;
            customerId?: number;
            /** @description True when a USER-tier member just earned a diamond for this join (free product). */
            diamondAwarded?: boolean;
            /** @description On ALREADY_ATTRIBUTED: the code that won. */
            heldBy?: string | null;
            /** Format: date-time */
            heldSince?: string | null;
            /**
             * @description Present when `attributed` is false.
             * @enum {string}
             */
            reason?: "UNKNOWN_CODE" | "AGENT_NOT_APPROVED" | "SELF_REFERRAL" | "ALREADY_ATTRIBUTED";
            /** @enum {string} */
            tier?: "USER" | "SELLER";
        };
        Availability: {
            /** @description Applications received for this local body. */
            filled: number;
            localBodyId: number;
            /** @description slotCapacity minus filled, floored at zero. Informational — it does not gate signup. */
            remaining: number;
            signupsOpen?: boolean;
            slotCapacity: number;
            /**
             * @description OPEN unless an administrator has closed the panchayat. There is no FULL state: reaching the nominal capacity no longer refuses an application, because who gets a place is selected later from everyone who applied.
             * @enum {string}
             */
            state: "OPEN" | "CLOSED";
            waitlisted?: number;
        };
        /** @description The commission terms that apply to this agent, served so no client hardcodes them. The rate is per product: a SELLER earns the product's seller rate (10% to 30%), a USER-tier member earns the product's member rate (default 1%) on paid products and diamonds on free ones. */
        CommissionTerms: {
            /** @description Net of GST and payment gateway charges. */
            basis: string;
            /** @description The highest. */
            maxRateBps?: number;
            /** @enum {string} */
            payoutFrequency: "MONTHLY";
            /** @description The lowest cash rate that applies to this agent across active products. See `rates`. */
            rateBps: number;
            /** @description One entry per active product. */
            rates: {
                isFree: boolean;
                nameEn: string;
                productId: number;
                /** @description 0 when the reward is DIAMOND. */
                rateBps: number;
                /**
                 * @description DIAMOND only for a USER-tier agent on a free product.
                 * @enum {string}
                 */
                reward: "CASH" | "DIAMOND";
                slug: string;
            }[];
            /** @description 200 = 2%. */
            tdsRateBps: number;
            /** @description 194H. */
            tdsSection: string;
            /** @enum {string} */
            tier: "USER" | "SELLER";
        };
        District: {
            /** @description District token used in agent codes, e.g. "KKD". */
            codeSlug: string;
            /** @description Stable numeric id. Always match on this, never on a name. */
            id: number;
            /** @description Official LGD code, where loaded. */
            lgdCode?: number | null;
            nameEn: string;
            nameMl: string;
            /** @enum {string} */
            wardData?: "COMPLETE" | "PARTIAL" | "PENDING";
        };
        EarningsSummary: {
            /** @enum {string} */
            currency: "INR";
            lifetimePaise: number;
            paidPaise: number;
            /** @description Accrued and approved, not yet paid. */
            pendingPaise: number;
            tdsWithheldPaise?: number;
        };
        Eligibility: {
            availability?: components["schemas"]["Availability"] | null;
            canApply: boolean;
            currentTerms?: {
                url?: string;
                version?: string;
            } | null;
            existingApplication?: {
                agentCode?: string;
                id?: number;
                status?: string;
            } | null;
            /** @description Pass back as `formToken` when submitting the signup. Signed and short-lived; it is how the timing check is measured server-side. */
            formToken?: string | null;
        };
        Error: {
            error: {
                /** @description Machine-readable error code. Branch on this, never on the message or status alone. */
                code: string;
                /** @description Shape varies by code. For VALIDATION_FAILED: { fields: [...] }. */
                details?: unknown;
                /** @description Developer-facing English text. */
                message: string;
                /** @description Quote this when reporting a problem. */
                requestId: string;
            };
        };
        EventRequest: {
            districtId?: number;
            /** @enum {string} */
            event: "page_view" | "scroll_depth" | "signup_start" | "field_focus" | "field_blur" | "field_abandon" | "google_auth_started" | "google_auth_completed" | "google_auth_failed" | "signup_submitted" | "signup_failed" | "qualifications_started" | "qualifications_submitted" | "qualifications_skipped" | "waitlist_joined";
            localBodyId?: number;
            properties?: {
                [key: string]: unknown;
            };
            /** @description Client-generated and rotating. Never joined to a user. */
            sessionId: string;
        };
        GoogleAuthRequest: {
            /** @description Google ID token, from a native client. */
            idToken: string;
        } | {
            /** @description Authorization code, from the web authorization-code flow. */
            code: string;
            /** @description PKCE verifier, if the flow used one. */
            codeVerifier?: string;
            /** Format: uri */
            redirectUri: string;
        };
        Leaderboard: {
            /** @description The product filter applied, or null for every product. */
            app: string | null;
            /** @enum {string} */
            currency: "INR";
            limit: number;
            rows: components["schemas"]["LeaderboardRow"][];
        };
        LeaderboardRow: {
            diamonds: number;
            /** @description Masked: first name and last initial, e.g. "Vivek S." */
            displayName: string;
            /** @description Net commission not cancelled or forfeited, in paise. */
            earnedNetPaise: number;
            friendsJoined: number;
            payingFriends: number;
            rank: number;
            /** @enum {string} */
            tier: "USER" | "SELLER";
        };
        LocalBody: {
            blockPanchayatId?: number | null;
            districtId: number;
            /** @description Applications received for this local body. */
            filled?: number;
            id: number;
            nameEn: string;
            nameMl: string;
            /** @description slotCapacity minus filled, floored at zero. Informational — it does not gate signup. */
            remaining?: number;
            signupsOpen?: boolean;
            /** @description Places available to agents. Programme default is 10. */
            slotCapacity?: number;
            /**
             * @description Gram panchayats sit under a block; municipalities and corporations do not. Clients need not branch on this — blockPanchayatId is simply null for urban bodies.
             * @enum {string}
             */
            type: "GRAM_PANCHAYAT" | "MUNICIPALITY" | "CORPORATION";
            waitlisted?: number;
            /** @enum {string} */
            wardData?: "COMPLETE" | "PARTIAL" | "PENDING";
        };
        Member: {
            /**
             * @description The member's invite code. Immutable.
             * @example RF-7K2M9Q
             */
            code: string;
            /**
             * @description Share this. The website resolves it to the product's web URL or Play listing with the code attached.
             * @example https://calecutech.com/r/RF-7K2M9Q?app=quizkerala
             */
            link: string;
            product: {
                /** @description True: friends who join earn the member a diamond. False: 1% of what friends pay. */
                isFree: boolean;
                name: string;
                slug: string;
                userRateBps: number;
            };
            /** @description Absolute URL of a PNG QR encoding `link`. Append `&format=svg` for SVG. */
            qrUrl: string;
            stats: components["schemas"]["MemberStats"];
            /** @description APPROVED unless an administrator suspended the member. */
            status: string;
            /** @enum {string} */
            tier: "USER";
            /** @description A wa.me link with a pre-written message, Malayalam first. */
            whatsappShareUrl: string;
        };
        MemberRequest: {
            email?: string | null;
            /** @description The app's own user id. Namespaced server-side as `<product slug>:<externalRef>`. */
            externalRef: string;
            /** @description Display name. Masked to first name and last initial on the public leaderboard. */
            name: string;
            pictureUrl?: string | null;
        };
        MemberStats: {
            /** @description Recognition for friends who joined free products. Never money. */
            diamonds: number;
            earnings: {
                /** @enum {string} */
                currency: "INR";
                lifetimePaise: number;
                paidPaise: number;
                pendingPaise: number;
            };
            /** @description Customers attributed to this code, across every product. */
            friendsJoined: number;
            /** @description Of those, how many have paid at least once. */
            payingFriends: number;
        };
        MeResponse: {
            agent: components["schemas"]["AgentSummary"];
            /** @description "ALL" for a super admin, otherwise the assigned district ids. */
            districtScope: "ALL" | number[];
            districtScopeDetail?: {
                districtId?: number;
                nameEn?: string;
                nameMl?: string;
            }[];
            /**
             * @description Where this client should navigate after sign-in. Follow it rather than deciding from the role.
             * @example /agents/dashboard
             * @example /agents/signup
             * @example /admin
             */
            landing: string;
            user: components["schemas"]["SessionUser"];
        };
        PageInfo: {
            hasNextPage: boolean;
            limit: number;
            /** @description Pass back as ?cursor= to fetch the next page. */
            nextCursor: string | null;
        };
        PaymentRequest: {
            /** @description The customer's id in the calling app, exactly as sent to /attribution/claim. */
            customerExternalRef: string;
            /** @description The payment's id in the product system. Unique. */
            externalRef: string;
            /** @default 0 */
            gatewayFeePaise: number;
            /** @description Amounts are integer paise. Never a float. */
            grossPaise: number;
            /** @default 0 */
            gstPaise: number;
            /** @description ISO 8601 timestamp. */
            paidAt: string;
            /** @description Only for a SUPER_ADMIN caller; ignored with a service key. */
            productId?: number | null;
            /** @description Only for a SUPER_ADMIN caller; ignored with a service key. */
            productSlug?: string | null;
        };
        PaymentResult: {
            agentCode?: string;
            breakdown?: {
                basePaise?: number;
                grossCommissionPaise?: number;
                netCommissionPaise?: number;
                /** @description The product's seller or member rate, whichever applied. */
                rateBps?: number;
                tdsPaise?: number;
                tdsRateBps?: number;
            };
            commissionAccrued?: boolean;
            commissionId?: number;
            externalRef?: string;
            paymentId?: number;
            /** @description Product slug. */
            product?: string | null;
            /**
             * @description Why no commission accrued, when none did.
             * @enum {string}
             */
            reason?: "PAYMENT_ALREADY_RECORDED" | "NO_ATTRIBUTION" | "AGENT_NOT_APPROVED" | "AGENT_NOT_PLACED";
            recorded: boolean;
            /** @description True when this response was replayed from the Idempotency-Key. */
            replayed: boolean;
            /** @enum {string} */
            tier?: "USER" | "SELLER";
        };
        PayoutProfile: {
            bankAccount?: string | null;
            bankHolderName?: string | null;
            bankIfsc?: string | null;
            mobileVerified?: boolean;
            pan?: string | null;
            panStatus?: string;
            /** Format: date-time */
            panVerifiedAt?: string | null;
            upiId?: string | null;
            withdrawal?: {
                blocked?: boolean;
                pendingBalancePaise?: number;
                reasons?: string[];
            };
        };
        PayoutProfileRequest: {
            bankAccountNumber?: string | null;
            bankHolderName?: string | null;
            bankIfsc?: string | null;
            /** @description Format AAAAA9999A. Encrypted at rest; never returned. */
            pan?: string | null;
            upiId?: string | null;
        };
        PayoutState: {
            bankConfigured?: boolean;
            blockedReason?: string | null;
            /** @description Masked, e.g. XXXXX1234F. Never the real value. */
            pan?: string | null;
            /** @enum {string} */
            panStatus?: "NOT_SUBMITTED" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "DUPLICATE_CANCELLED";
            withdrawalBlocked?: boolean;
        };
        ProductSettingsRequest: {
            active?: boolean;
            androidPackage?: string | null;
            /** @description The product's fee in paise. `null` makes it FREE: members then earn diamonds instead of cash. */
            feePaise?: number | null;
            playUrl?: string | null;
            /** @description What a seller earns: 1000 (10%) to 3000 (30%). */
            sellerRateBps?: number;
            /** @description What a member earns on a paid product. Default 100 (1%). */
            userRateBps?: number;
            webUrl?: string | null;
        };
        PublicProduct: {
            androidPackage?: string | null;
            /** @description Null means free. */
            feePaise?: number | null;
            id: number;
            isFree: boolean;
            nameEn: string;
            nameMl: string;
            playUrl?: string | null;
            /** @description 1000..3000. */
            sellerRateBps: number;
            slug: string;
            summaryEn?: string | null;
            userRateBps: number;
            webUrl?: string | null;
        };
        QualificationsRequest: {
            computerLiteracy?: ("YES" | "BASIC" | "NO") | null;
            education?: ("SSLC" | "PLUS_TWO" | "DEGREE" | "PG" | "DIPLOMA" | "ITI" | "OTHER") | null;
            educationOther?: string | null;
            experience?: ("INSURANCE_AGENCY" | "AKSHAYA_CSC" | "MARKETING_SALES" | "BANKING_FINANCE" | "BUSINESS_SHOP" | "NONE")[] | null;
            hasVehicle?: boolean | null;
            hoursPerDay?: ("ONE" | "TWO_TO_THREE" | "FOUR_PLUS" | "FULL_TIME") | null;
            reach?: ("BANK_EMPLOYEES" | "CONTRACTORS" | "STUDENTS" | "SHOP_OWNERS" | "GOVERNMENT_OFFICES" | "OTHERS")[] | null;
        };
        ReferralClickRequest: {
            /** @description Product slug, when the link named one. */
            app?: string;
            code: string;
            /** @description e.g. "web", "android". */
            source?: string;
        };
        ReportCatalogue: {
            data: {
                columns?: {
                    header?: string;
                    key?: string;
                }[];
                description?: string;
                filters?: string[];
                formats?: string[];
                slug?: string;
                title?: string;
            }[];
            defaultReport: string;
        };
        ReportResult: {
            columns: {
                header?: string;
                key?: string;
            }[];
            /** @description One object per row, keyed by the `key` of each entry in `columns`. Values are formatted exactly as the CSV and PDF exports render them, so a client can build a table from `columns` alone without knowing the report. Rows that describe a single entity also carry an `id` field, which is deliberately NOT in `columns` — it is there so a row can be linked back to its panchayat, agent or ward, not displayed. */
            data: {
                [key: string]: unknown;
            }[];
            filter?: Record<string, unknown>;
            report: {
                description?: string;
                slug?: string;
                title?: string;
            };
            rowCount: number;
            /** @description True when the row cap was hit. */
            truncated?: boolean;
        };
        Session: {
            /** @description Short-lived JWT. Send as `Authorization: Bearer <token>`. */
            accessToken: string;
            /** @description Access token lifetime in seconds. */
            expiresIn: number;
            /** @description Long-lived and single-use. Rotated on every refresh; presenting a rotated token revokes every session for that user. */
            refreshToken: string;
            /** @enum {string} */
            tokenType: "Bearer";
            user: components["schemas"]["SessionUser"];
        };
        SessionUser: {
            agentId?: number | null;
            /** Format: email */
            email: string;
            id: number;
            name: string;
            pictureUrl?: string | null;
            /**
             * @description Read from the user row in the database. Render from this; it grants nothing on its own, because every endpoint re-derives it from the signed token.
             * @enum {string}
             */
            role: "AGENT" | "DISTRICT_ADMIN" | "SUPER_ADMIN";
        };
        SignupRequest: {
            /** @constant */
            acceptedTerms: true;
            /** @description Hashed server-side; the raw value is never stored. */
            deviceFingerprint?: string | null;
            districtId: number;
            /** @description The signed token from GET /signup/eligibility. The server measures elapsed time from its own issue timestamp, so a submission cannot report a fake duration. Omitting it is allowed and simply provides no timing evidence. */
            formToken?: string | null;
            /** @description Hidden field. Must be empty; a value rejects the request. */
            honeypot?: string | null;
            /** @description The chosen panchayat, municipality or corporation. Give this OR pendingLocalBodyName, never both. */
            localBodyId?: number | null;
            /** @description 10-digit Indian mobile number. Not verified at this stage. */
            mobile: string;
            name: string;
            occupation: string;
            /** @description TEMPORARY. Free text, for an applicant whose municipality or corporation is not seeded yet — the urban local bodies are not loaded. Such an application is accepted but holds no slot, appears in no coverage report, and cannot be approved until an administrator assigns a real local body. */
            pendingLocalBodyName?: string | null;
            /** @constant */
            privacyConsent: true;
            /** @description Version of the terms actually shown to the applicant. */
            termsVersion: string;
            /** @description Required. The applicant's ward NUMBER within their local body, not a ward id — ward names are not loaded, so there is no list to choose from. The ward row is created on demand the first time someone in that ward applies. For an applicant using pendingLocalBodyName the number is held until an administrator places them. */
            wardNumber: number;
        };
        SignupResponse: {
            agent: {
                agentCode?: string;
                districtId?: number;
                id?: number;
                localBodyId?: number;
                status?: string;
                wardId?: number | null;
            };
            /** @description How many people have now applied in this panchayat, including this one. */
            applicationsInPanchayat?: number | null;
            nextStep?: string;
            /** @description True when applications exceed the nominal capacity. Informational: the application was still accepted. */
            overSubscribed?: boolean;
            slotCapacity?: number | null;
        };
        Ward: {
            id: number;
            nameEn?: string | null;
            nameMl?: string | null;
            number: number;
            /**
             * @description PENDING means the ward exists but no official name has been loaded.
             * @enum {string}
             */
            status: "COMPLETE" | "PARTIAL" | "PENDING";
        };
        WardList: {
            data: components["schemas"]["Ward"][];
            /** @description Present when the list is empty, explaining why. */
            note?: string | null;
            /** @enum {string} */
            wardData: "COMPLETE" | "PARTIAL" | "PENDING";
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
