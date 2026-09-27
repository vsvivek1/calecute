/**
 * Translating database constraint violations into API error codes.
 *
 * Why this is necessary rather than nice-to-have
 * ---------------------------------------------
 * A "is this mobile number already used?" check cannot work from inside a
 * request. The query runs under row-level security, and an applicant cannot see
 * another applicant's agent row — so the pre-check finds nothing, the insert
 * proceeds, and the unique index rejects it. Without this mapping the caller
 * gets a 500 for what is really a 409.
 *
 * So the database constraint is the guarantee and the pre-check is only a
 * nicer-message fast path for the cases the caller CAN see. Every write that
 * depends on a unique index is wrapped in `mapConstraintErrors`.
 */
import { ApiError, type ErrorCode } from "@/lib/errors";

/** Postgres unique-violation SQLSTATE. */
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const CHECK_VIOLATION = "23514";

interface PgErrorish {
  code?: string;
  constraint_name?: string;
  detail?: string;
}

/**
 * Constraint name -> the error a client should see.
 *
 * Keyed on the real index names from drizzle/0000_init.sql. If an index is
 * renamed, the mapping must move with it — so the names are written out here
 * rather than matched by a pattern, and a missed rename surfaces as a 500 in the
 * smoke test rather than as a silently wrong error code.
 */
const CONSTRAINT_ERRORS: Record<string, { code: ErrorCode; message: string }> = {
  agents_mobile_idx: {
    code: "MOBILE_ALREADY_USED",
    message: "An application already exists for this mobile number",
  },
  agents_user_id_unique: {
    code: "ALREADY_REGISTERED",
    message: "This account already has an application",
  },
  agents_agent_code_unique: {
    code: "INTERNAL_ERROR",
    message: "Agent code collision. Retry the request.",
  },
  payout_profiles_pan_fingerprint_idx: {
    code: "PAN_ALREADY_USED",
    message:
      "This PAN is already registered to another agent. As stated in the terms you accepted, duplicate accounts are cancelled and accrued commission is forfeited.",
  },
  attributions_customer_id_unique: {
    code: "ALREADY_ATTRIBUTED",
    message: "This customer is already attributed to an agent",
  },
  payments_external_ref_unique: {
    code: "UNPROCESSABLE",
    message: "This payment reference has already been recorded",
  },
  waitlist_user_body_idx: {
    code: "ALREADY_REGISTERED",
    message: "You are already on the waitlist for this panchayat",
  },
  users_email_idx: {
    code: "ALREADY_REGISTERED",
    message: "An account already exists for this email address",
  },
  users_google_sub_unique: {
    code: "ALREADY_REGISTERED",
    message: "An account already exists for this Google identity",
  },
  local_bodies_branch_check: {
    code: "VALIDATION_FAILED",
    message:
      "A gram panchayat must belong to a block panchayat, and an urban body must not",
  },
  commissions_amounts_check: {
    code: "UNPROCESSABLE",
    message: "Commission amounts are internally inconsistent",
  },
  payments_net_check: {
    code: "VALIDATION_FAILED",
    message: "Payment net amount does not equal gross less GST less gateway fee",
  },
};

/** Drizzle wraps driver errors, so the real one may be a cause or a chain. */
function unwrap(error: unknown, depth = 0): PgErrorish | null {
  if (depth > 5 || error === null || typeof error !== "object") return null;
  const candidate = error as PgErrorish & { cause?: unknown };
  if (typeof candidate.code === "string") return candidate;
  return unwrap(candidate.cause, depth + 1);
}

/**
 * Run a write, converting a known constraint violation into its API error.
 *
 * Anything unrecognised is rethrown untouched — a constraint nobody mapped is a
 * bug worth seeing as a 500, not something to paper over with a generic 409.
 */
export async function mapConstraintErrors<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const pg = unwrap(error);
    if (!pg?.code) throw error;

    if (
      pg.code === UNIQUE_VIOLATION ||
      pg.code === CHECK_VIOLATION ||
      pg.code === FOREIGN_KEY_VIOLATION
    ) {
      const mapped = pg.constraint_name
        ? CONSTRAINT_ERRORS[pg.constraint_name]
        : undefined;
      if (mapped) {
        throw new ApiError(mapped.code, mapped.message, {
          details: { constraint: pg.constraint_name },
        });
      }
      if (pg.code === FOREIGN_KEY_VIOLATION) {
        throw new ApiError(
          "UNKNOWN_GEOGRAPHY",
          "A referenced record does not exist",
          { details: { constraint: pg.constraint_name } },
        );
      }
    }

    throw error;
  }
}
