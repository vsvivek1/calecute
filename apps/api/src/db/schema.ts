/**
 * Single source of truth for the agent-programme database.
 *
 * Conventions used throughout:
 *  - Every table gets a surrogate `bigserial` id. These are OUR stable numeric
 *    ids and are what every API payload and every client refers to. External
 *    identifiers (LGD codes) are stored alongside as nullable columns so that
 *    official data can be reconciled later without renumbering anything.
 *  - Names are never keys. Geography rows carry both `nameEn` and `nameMl`;
 *    lookups always happen on id.
 *  - Money is stored in paise as `bigint` to keep arithmetic exact. Never float.
 *  - Row-level security policies are defined in `drizzle/` alongside the
 *    generated DDL; see `0001_rls.sql`. Drizzle does not model policies, so
 *    they are hand-written SQL that ships in the same migration chain.
 */
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ------------------------------------------------------------------ enums */

export const userRole = pgEnum("user_role", [
  "AGENT",
  "DISTRICT_ADMIN",
  "SUPER_ADMIN",
]);

export const userStatus = pgEnum("user_status", [
  "ACTIVE",
  "SUSPENDED",
  "DELETED",
]);

/** Gram panchayats hang off a block; municipalities and corporations do not. */
export const localBodyType = pgEnum("local_body_type", [
  "GRAM_PANCHAYAT",
  "MUNICIPALITY",
  "CORPORATION",
]);

/**
 * Wards are seeded from official delimitation data. Where that data is not
 * available for a local body we record the fact rather than inventing rows.
 */
export const dataCompleteness = pgEnum("data_completeness", [
  "COMPLETE",
  "PARTIAL",
  "PENDING",
]);

export const agentStatus = pgEnum("agent_status", [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
  "WAITLISTED",
  "WITHDRAWN",
]);

export const panStatus = pgEnum("pan_status", [
  "NOT_SUBMITTED",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "DUPLICATE_CANCELLED",
]);

export const commissionStatus = pgEnum("commission_status", [
  "ACCRUED",
  "APPROVED",
  "PAID",
  "CANCELLED",
  "FORFEITED",
]);

export const payoutBatchStatus = pgEnum("payout_batch_status", [
  "DRAFT",
  "PROCESSING",
  "PAID",
  "CANCELLED",
]);

export const customerStatus = pgEnum("customer_status", [
  "LEAD",
  "TRIAL",
  "ACTIVE",
  "LAPSED",
  "CANCELLED",
]);

export const educationLevel = pgEnum("education_level", [
  "SSLC",
  "PLUS_TWO",
  "DEGREE",
  "PG",
  "DIPLOMA",
  "ITI",
  "OTHER",
]);

export const hoursAvailable = pgEnum("hours_available", [
  "ONE",
  "TWO_TO_THREE",
  "FOUR_PLUS",
  "FULL_TIME",
]);

export const computerLiteracy = pgEnum("computer_literacy", [
  "YES",
  "BASIC",
  "NO",
]);

export const reviewFlagKind = pgEnum("review_flag_kind", [
  "MULTIPLE_SIGNUPS_ONE_DEVICE",
  "PANCHAYAT_SIGNUP_SPIKE",
  "DUPLICATE_PAN",
  "HONEYPOT_TRIPPED",
  "SUBMITTED_TOO_FAST",
  "LOCAL_BODY_NOT_SEEDED",
]);

export const reviewFlagStatus = pgEnum("review_flag_status", [
  "OPEN",
  "DISMISSED",
  "ACTIONED",
]);

/* -------------------------------------------------------------- geography */

export const states = pgTable("states", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  nameEn: text("name_en").notNull(),
  nameMl: text("name_ml").notNull(),
  lgdCode: integer("lgd_code").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const districts = pgTable(
  "districts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    stateId: bigint("state_id", { mode: "number" })
      .notNull()
      .references(() => states.id),
    nameEn: text("name_en").notNull(),
    nameMl: text("name_ml").notNull(),
    /** Short uppercase token used to build agent codes, e.g. "KKD". */
    codeSlug: text("code_slug").notNull(),
    lgdCode: integer("lgd_code").unique(),
    wardData: dataCompleteness("ward_data").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("districts_state_name_en_idx").on(t.stateId, t.nameEn),
    uniqueIndex("districts_code_slug_idx").on(t.codeSlug),
  ],
);

export const blockPanchayats = pgTable(
  "block_panchayats",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    districtId: bigint("district_id", { mode: "number" })
      .notNull()
      .references(() => districts.id),
    nameEn: text("name_en").notNull(),
    nameMl: text("name_ml").notNull(),
    lgdCode: integer("lgd_code").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("block_panchayats_district_idx").on(t.districtId)],
);

/**
 * The single table the UI talks to for "panchayat / municipality".
 *
 * Both branches of the hierarchy land here: a gram panchayat carries a
 * `blockPanchayatId`, an urban body leaves it null. Clients filter by
 * `districtId` and never need to know which branch a row came from.
 */
export const localBodies = pgTable(
  "local_bodies",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    districtId: bigint("district_id", { mode: "number" })
      .notNull()
      .references(() => districts.id),
    blockPanchayatId: bigint("block_panchayat_id", {
      mode: "number",
    }).references(() => blockPanchayats.id),
    type: localBodyType("type").notNull(),
    nameEn: text("name_en").notNull(),
    nameMl: text("name_ml").notNull(),
    lgdCode: integer("lgd_code").unique(),
    /** How many agents this body may hold. Programme default is 10. */
    slotCapacity: integer("slot_capacity").notNull().default(10),
    signupsOpen: boolean("signups_open").notNull().default(true),
    wardData: dataCompleteness("ward_data").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("local_bodies_district_idx").on(t.districtId),
    index("local_bodies_block_idx").on(t.blockPanchayatId),
    // Search matches either script; see 0001_rls.sql for the trigram indexes.
    index("local_bodies_name_en_idx").on(t.nameEn),
    // A gram panchayat must sit under a block; an urban body must not.
    index("local_bodies_type_idx").on(t.type),
  ],
);

export const wards = pgTable(
  "wards",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    localBodyId: bigint("local_body_id", { mode: "number" })
      .notNull()
      .references(() => localBodies.id),
    /** Official ward number within the local body. */
    number: smallint("number").notNull(),
    nameEn: text("name_en"),
    nameMl: text("name_ml"),
    lgdCode: integer("lgd_code").unique(),
    /**
     * PENDING means "this ward exists per the official count but we have not
     * loaded its name yet". Never populated with a guessed name.
     */
    status: dataCompleteness("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("wards_body_number_idx").on(t.localBodyId, t.number),
    index("wards_body_idx").on(t.localBodyId),
  ],
);

/* ------------------------------------------------------------------ users */

export const users = pgTable(
  "users",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    /** Google's stable subject claim. The real identity key. */
    googleSub: text("google_sub").notNull().unique(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    name: text("name").notNull(),
    pictureUrl: text("picture_url"),
    role: userRole("role").notNull().default("AGENT"),
    status: userStatus("status").notNull().default("ACTIVE"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(sql`lower(${t.email})`)],
);

/** Which districts a DISTRICT_ADMIN may see. SUPER_ADMIN needs no rows here. */
export const adminDistricts = pgTable(
  "admin_districts",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    districtId: bigint("district_id", { mode: "number" })
      .notNull()
      .references(() => districts.id),
    assignedBy: bigint("assigned_by", { mode: "number" }).references(
      () => users.id,
    ),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.districtId] })],
);

/**
 * Refresh tokens are stored hashed so they can be revoked and rotated.
 * Access tokens stay stateless — nothing here is consulted to authorise a
 * request, only to mint a new access token.
 */
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    /** Rotation chain: the token this one replaced. */
    replacedBy: bigint("replaced_by", { mode: "number" }),
    clientKind: text("client_kind").notNull().default("unknown"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("refresh_tokens_user_idx").on(t.userId)],
);

/* ----------------------------------------------------------------- agents */

export const termsVersions = pgTable("terms_versions", {
  version: text("version").primaryKey(),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
  url: text("url").notNull(),
  /** Immutable copy of the text the agent actually agreed to. */
  bodyMl: text("body_ml"),
  bodyEn: text("body_en"),
});

export const agents = pgTable(
  "agents",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    /** CA-<district codeSlug>-<zero padded sequence>. Immutable once issued. */
    agentCode: text("agent_code").notNull().unique(),
    districtId: bigint("district_id", { mode: "number" })
      .notNull()
      .references(() => districts.id),
    /**
     * Null while an applicant's local body is not yet seeded — see
     * drizzle/0006_pending_local_body.sql. Such an agent holds no slot and
     * appears in no coverage report until an admin places them.
     */
    localBodyId: bigint("local_body_id", { mode: "number" }).references(
      () => localBodies.id,
    ),
    /** What the applicant typed, when their town is not in the picker yet. */
    pendingLocalBodyName: text("pending_local_body_name"),
    /**
     * Required for a placed agent. The row is created on demand from the ward
     * number the applicant gives — see app.ward_for() in
     * drizzle/0007_required_ward.sql.
     */
    wardId: bigint("ward_id", { mode: "number" }).references(() => wards.id),
    /** The ward number typed by an applicant whose town is not seeded yet. */
    pendingWardNumber: smallint("pending_ward_number"),
    /** Not verified at signup by design; verified later at payout setup. */
    mobile: text("mobile").notNull(),
    mobileVerifiedAt: timestamp("mobile_verified_at", { withTimezone: true }),
    occupation: text("occupation").notNull(),
    status: agentStatus("status").notNull().default("PENDING_REVIEW"),
    reviewedBy: bigint("reviewed_by", { mode: "number" }).references(
      () => users.id,
    ),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    termsVersion: text("terms_version")
      .notNull()
      .references(() => termsVersions.version),
    termsAcceptedAt: timestamp("terms_accepted_at", {
      withTimezone: true,
    }).notNull(),
    privacyConsentAt: timestamp("privacy_consent_at", {
      withTimezone: true,
    }).notNull(),
    firstSaleAt: timestamp("first_sale_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One account per mobile number, enforced even though it is unverified.
    uniqueIndex("agents_mobile_idx").on(t.mobile),
    index("agents_district_idx").on(t.districtId),
    index("agents_local_body_idx").on(t.localBodyId),
    index("agents_ward_idx").on(t.wardId),
    index("agents_status_idx").on(t.status),
    index("agents_created_at_idx").on(t.createdAt),
  ],
);

/** Optional step 3 of signup. Absent row simply means "skipped". */
export const agentQualifications = pgTable("agent_qualifications", {
  agentId: bigint("agent_id", { mode: "number" })
    .primaryKey()
    .references(() => agents.id, { onDelete: "cascade" }),
  education: educationLevel("education"),
  educationOther: text("education_other"),
  /** Multi-select, stored as a text array of stable tokens. */
  experience: text("experience").array(),
  hoursPerDay: hoursAvailable("hours_per_day"),
  hasVehicle: boolean("has_vehicle"),
  computerLiteracy: computerLiteracy("computer_literacy"),
  reach: text("reach").array(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Per-district counter backing the agent code sequence. */
export const agentCodeSequences = pgTable("agent_code_sequences", {
  districtId: bigint("district_id", { mode: "number" })
    .primaryKey()
    .references(() => districts.id),
  nextSeq: integer("next_seq").notNull().default(1),
});

export const waitlistEntries = pgTable(
  "waitlist_entries",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    localBodyId: bigint("local_body_id", { mode: "number" })
      .notNull()
      .references(() => localBodies.id),
    districtId: bigint("district_id", { mode: "number" })
      .notNull()
      .references(() => districts.id),
    mobile: text("mobile").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    clearedAt: timestamp("cleared_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("waitlist_user_body_idx").on(t.userId, t.localBodyId),
    index("waitlist_body_idx").on(t.localBodyId),
  ],
);

/* ---------------------------------------------------------------- payouts */

export const payoutProfiles = pgTable(
  "payout_profiles",
  {
    agentId: bigint("agent_id", { mode: "number" })
      .primaryKey()
      .references(() => agents.id, { onDelete: "cascade" }),
    /** AES-256-GCM ciphertext. Never returned by any endpoint. */
    panCiphertext: text("pan_ciphertext"),
    /** Deterministic HMAC used only to detect duplicates without decrypting. */
    panFingerprint: text("pan_fingerprint"),
    /** Last four characters, for the XXXXX1234F display mask. */
    panLast4: text("pan_last4"),
    panStatus: panStatus("pan_status").notNull().default("NOT_SUBMITTED"),
    panVerifiedAt: timestamp("pan_verified_at", { withTimezone: true }),
    panVerifiedBy: bigint("pan_verified_by", { mode: "number" }).references(
      () => users.id,
    ),
    bankAccountCiphertext: text("bank_account_ciphertext"),
    bankAccountLast4: text("bank_account_last4"),
    bankIfsc: text("bank_ifsc"),
    bankHolderName: text("bank_holder_name"),
    upiId: text("upi_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One agent per PAN. Collisions are resolved by cancelling duplicates.
    uniqueIndex("payout_profiles_pan_fingerprint_idx").on(t.panFingerprint),
  ],
);

/* --------------------------------------------------------------- products */

export const products = pgTable("products", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameMl: text("name_ml").notNull(),
  summaryEn: text("summary_en"),
  summaryMl: text("summary_ml"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const productAssets = pgTable(
  "product_assets",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    productId: bigint("product_id", { mode: "number" })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    /** brochure | poster | video | price_list */
    kind: text("kind").notNull(),
    url: text("url").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("product_assets_product_idx").on(t.productId)],
);

export const agentProducts = pgTable(
  "agent_products",
  {
    agentId: bigint("agent_id", { mode: "number" })
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    productId: bigint("product_id", { mode: "number" })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    assignedBy: bigint("assigned_by", { mode: "number" }).references(
      () => users.id,
    ),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.agentId, t.productId] })],
);

/* ----------------------------------------------- customers & attribution */

export const customers = pgTable(
  "customers",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    /** Identifier from the product system that owns the billing relationship. */
    externalRef: text("external_ref").notNull().unique(),
    displayName: text("display_name").notNull(),
    districtId: bigint("district_id", { mode: "number" }).references(
      () => districts.id,
    ),
    localBodyId: bigint("local_body_id", { mode: "number" }).references(
      () => localBodies.id,
    ),
    status: customerStatus("status").notNull().default("LEAD"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("customers_district_idx").on(t.districtId)],
);

/**
 * First code wins. One row per customer, ever. The unique constraint on
 * `customerId` is the enforcement — there is no update path in the API.
 */
export const attributions = pgTable(
  "attributions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    customerId: bigint("customer_id", { mode: "number" })
      .notNull()
      .unique()
      .references(() => customers.id),
    agentId: bigint("agent_id", { mode: "number" })
      .notNull()
      .references(() => agents.id),
    /** Denormalised on purpose: the code as presented, frozen at lock time. */
    agentCode: text("agent_code").notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("attributions_agent_idx").on(t.agentId)],
);

/** Every attempt, accepted or not, so disputes are settled from data. */
export const attributionAttempts = pgTable(
  "attribution_attempts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    customerExternalRef: text("customer_external_ref").notNull(),
    customerId: bigint("customer_id", { mode: "number" }).references(
      () => customers.id,
    ),
    agentCode: text("agent_code").notNull(),
    agentId: bigint("agent_id", { mode: "number" }).references(() => agents.id),
    accepted: boolean("accepted").notNull(),
    /** ACCEPTED | ALREADY_ATTRIBUTED | UNKNOWN_CODE | AGENT_NOT_APPROVED */
    reason: text("reason").notNull(),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("attribution_attempts_ref_idx").on(t.customerExternalRef),
    index("attribution_attempts_agent_idx").on(t.agentId),
  ],
);

/* ------------------------------------------------ payments & commissions */

export const payments = pgTable(
  "payments",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    externalRef: text("external_ref").notNull().unique(),
    customerId: bigint("customer_id", { mode: "number" })
      .notNull()
      .references(() => customers.id),
    productId: bigint("product_id", { mode: "number" }).references(
      () => products.id,
    ),
    /** All amounts in paise. */
    grossPaise: bigint("gross_paise", { mode: "number" }).notNull(),
    gstPaise: bigint("gst_paise", { mode: "number" }).notNull().default(0),
    gatewayFeePaise: bigint("gateway_fee_paise", { mode: "number" })
      .notNull()
      .default(0),
    /** gross - gst - gatewayFee. The base the 10% is calculated on. */
    netPaise: bigint("net_paise", { mode: "number" }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("payments_customer_idx").on(t.customerId),
    index("payments_paid_at_idx").on(t.paidAt),
  ],
);

export const payoutBatches = pgTable("payout_batches", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  /** Calendar month the batch settles, e.g. "2026-09". */
  period: text("period").notNull().unique(),
  status: payoutBatchStatus("status").notNull().default("DRAFT"),
  markedPaidBy: bigint("marked_paid_by", { mode: "number" }).references(
    () => users.id,
  ),
  markedPaidAt: timestamp("marked_paid_at", { withTimezone: true }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const commissions = pgTable(
  "commissions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    paymentId: bigint("payment_id", { mode: "number" })
      .notNull()
      .references(() => payments.id),
    agentId: bigint("agent_id", { mode: "number" })
      .notNull()
      .references(() => agents.id),
    /** Copied from the agent at accrual so reports stay stable. */
    districtId: bigint("district_id", { mode: "number" })
      .notNull()
      .references(() => districts.id),
    localBodyId: bigint("local_body_id", { mode: "number" })
      .notNull()
      .references(() => localBodies.id),
    /** Base = payment.netPaise. Rate in basis points (1000 = 10%). */
    basePaise: bigint("base_paise", { mode: "number" }).notNull(),
    rateBps: integer("rate_bps").notNull().default(1000),
    grossCommissionPaise: bigint("gross_commission_paise", {
      mode: "number",
    }).notNull(),
    /** Section 194H, 2% by default. */
    tdsRateBps: integer("tds_rate_bps").notNull().default(200),
    tdsPaise: bigint("tds_paise", { mode: "number" }).notNull(),
    netCommissionPaise: bigint("net_commission_paise", {
      mode: "number",
    }).notNull(),
    status: commissionStatus("status").notNull().default("ACCRUED"),
    /** Indian financial year label, e.g. "2026-27". */
    financialYear: text("financial_year").notNull(),
    payoutBatchId: bigint("payout_batch_id", { mode: "number" }).references(
      () => payoutBatches.id,
    ),
    accruedAt: timestamp("accrued_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [
    unique("commissions_payment_agent_key").on(t.paymentId, t.agentId),
    index("commissions_agent_idx").on(t.agentId),
    index("commissions_district_idx").on(t.districtId),
    index("commissions_status_idx").on(t.status),
    index("commissions_fy_idx").on(t.financialYear),
  ],
);

/* ------------------------------------------------------- ops & anti-abuse */

/**
 * Append only. No UPDATE or DELETE policy exists for any role, and a trigger
 * rejects both regardless of privilege. See 0001_rls.sql.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorUserId: bigint("actor_user_id", { mode: "number" }).references(
      () => users.id,
    ),
    actorRole: userRole("actor_role"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    /** Truncated to /24 or /48 before storage; see lib/net.ts. */
    ipPrefix: text("ip_prefix"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_log_actor_idx").on(t.actorUserId),
    index("audit_log_entity_idx").on(t.entityType, t.entityId),
    index("audit_log_created_idx").on(t.createdAt),
  ],
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    bucketKey: text("bucket_key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    hits: integer("hits").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.bucketKey, t.windowStart] })],
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    key: text("key").notNull(),
    userId: bigint("user_id", { mode: "number" }).references(() => users.id),
    endpoint: text("endpoint").notNull(),
    requestHash: text("request_hash").notNull(),
    responseStatus: integer("response_status"),
    responseBody: jsonb("response_body"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.key, t.endpoint] })],
);

/** Signals that feed the admin review queue. Fingerprints are hashed. */
export const signupSignals = pgTable(
  "signup_signals",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    agentId: bigint("agent_id", { mode: "number" }).references(() => agents.id, {
      onDelete: "cascade",
    }),
    deviceHash: text("device_hash"),
    ipPrefix: text("ip_prefix"),
    /** Milliseconds between form render and submit. */
    fillMs: integer("fill_ms"),
    honeypotTripped: boolean("honeypot_tripped").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("signup_signals_device_idx").on(t.deviceHash),
    index("signup_signals_agent_idx").on(t.agentId),
  ],
);

export const reviewFlags = pgTable(
  "review_flags",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    kind: reviewFlagKind("kind").notNull(),
    agentId: bigint("agent_id", { mode: "number" }).references(() => agents.id, {
      onDelete: "cascade",
    }),
    localBodyId: bigint("local_body_id", { mode: "number" }).references(
      () => localBodies.id,
    ),
    districtId: bigint("district_id", { mode: "number" }).references(
      () => districts.id,
    ),
    detail: jsonb("detail"),
    status: reviewFlagStatus("status").notNull().default("OPEN"),
    resolvedBy: bigint("resolved_by", { mode: "number" }).references(
      () => users.id,
    ),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("review_flags_status_idx").on(t.status),
    index("review_flags_district_idx").on(t.districtId),
  ],
);

/**
 * Funnel instrumentation. Deliberately carries no PII and no user id — only a
 * rotating client-generated session id, the event name, and geography chosen
 * so far. See docs/DATA_PROTECTION.md.
 */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sessionId: text("session_id").notNull(),
    event: text("event").notNull(),
    /** Free-form, validated against an allowlist of non-PII keys. */
    properties: jsonb("properties"),
    districtId: bigint("district_id", { mode: "number" }).references(
      () => districts.id,
    ),
    localBodyId: bigint("local_body_id", { mode: "number" }).references(
      () => localBodies.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("analytics_events_event_idx").on(t.event),
    index("analytics_events_created_idx").on(t.createdAt),
    index("analytics_events_session_idx").on(t.sessionId),
  ],
);

/** Outbound messages to agents, filtered by geography or status. */
export const agentMessages = pgTable(
  "agent_messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    senderUserId: bigint("sender_user_id", { mode: "number" })
      .notNull()
      .references(() => users.id),
    subject: text("subject").notNull(),
    bodyMl: text("body_ml"),
    bodyEn: text("body_en"),
    /** The filter that selected recipients, kept for the audit trail. */
    audienceFilter: jsonb("audience_filter"),
    recipientCount: integer("recipient_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("agent_messages_created_idx").on(t.createdAt)],
);

export const agentMessageRecipients = pgTable(
  "agent_message_recipients",
  {
    messageId: bigint("message_id", { mode: "number" })
      .notNull()
      .references(() => agentMessages.id, { onDelete: "cascade" }),
    agentId: bigint("agent_id", { mode: "number" })
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.agentId] })],
);
