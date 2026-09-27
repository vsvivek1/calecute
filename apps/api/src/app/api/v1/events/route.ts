/**
 * POST /api/v1/events
 *
 * Funnel instrumentation. Public, because the most important events happen
 * before anyone signs in.
 *
 * This endpoint is built to make it hard to leak personal data by accident:
 *   - the event name must be one of a fixed list
 *   - property keys must be on an allowlist
 *   - property values are truncated and must be primitives
 *   - no user id, no IP, no user agent is stored
 *   - the session id is client-generated and rotates; it is not an identifier
 *     for a person and is never joined to a user
 *
 * The result is a funnel by district rather than by individual, which is what
 * the reports actually need — "which field loses people in Malappuram" does not
 * require knowing who those people were.
 */
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { publicRoute, ok } from "@/lib/route";
import { parseBody, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { analyticsEvents } from "@/db/schema";

export const dynamic = "force-dynamic";

/** The funnel the brief asks for, plus per-field drop-off. */
const EVENTS = [
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
] as const;

/** Anything not on this list is dropped rather than stored. */
const ALLOWED_PROPERTY_KEYS = new Set([
  "field",
  "step",
  "depthPercent",
  "durationMs",
  "errorCode",
  "referrerKind",
  "localBodyType",
  "viewport",
]);

const bodySchema = z.object({
  /** Client-generated, rotating. Not linked to a user, ever. */
  sessionId: z.string().trim().min(8).max(64),
  event: z.enum(EVENTS),
  properties: z.record(z.string(), z.unknown()).optional(),
  districtId: geoIdSchema.optional(),
  localBodyId: geoIdSchema.optional(),
});

/** Strip anything not allowlisted, and anything that is not a primitive. */
function sanitise(
  properties: Record<string, unknown> | undefined,
): Record<string, string | number | boolean> | null {
  if (!properties) return null;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!ALLOWED_PROPERTY_KEYS.has(key)) continue;
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean") out[key] = value;
    else if (typeof value === "string") out[key] = value.slice(0, 64);
  }
  return Object.keys(out).length > 0 ? out : null;
}

export const POST = handler(
  publicRoute({ name: "events", limit: RULES.analytics }, async (ctx) => {
    const body = await parseBody(ctx.request, bodySchema);

    await ctx.tx.insert(analyticsEvents).values({
      sessionId: body.sessionId,
      event: body.event,
      properties: sanitise(body.properties),
      districtId: body.districtId ?? null,
      localBodyId: body.localBodyId ?? null,
    });

    // 202: the client should never wait on or retry a beacon.
    return ok(ctx, { accepted: true }, 202);
  }),
);

export const OPTIONS = preflight;
