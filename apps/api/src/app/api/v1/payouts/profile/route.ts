/**
 * GET  /api/v1/payouts/profile — what we hold, masked
 * PUT  /api/v1/payouts/profile — the only place PAN and bank details are taken
 *
 * PAN is deliberately not collected at signup. Asking a stranger for a PAN
 * before they have earned anything is the single strongest scam signal on a
 * Kerala recruitment page, and the public page says explicitly that we do not
 * do it. It is collected here, once there is a balance to withdraw.
 *
 * What happens to a PAN on the way in:
 *   1. validated against the format
 *   2. fingerprinted with a keyed HMAC, to detect an existing registration
 *   3. encrypted with AES-256-GCM
 *   4. only the last four characters kept in the clear, for the mask
 * The plaintext is never logged, never returned, and never in an audit row.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseBody, panSchema, ifscSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { payoutProfiles } from "@/db/schema";
import { mapConstraintErrors } from "@/db/constraints";
import { currentAgent, earningsFor } from "@/lib/agent";
import {
  encryptPii,
  fingerprintPii,
  lastFourOfPan,
  maskAccountNumber,
  maskPan,
} from "@/lib/crypto";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "payouts.profile.read" }, async (ctx) => {
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);
    const [profile] = await ctx.tx
      .select({
        panStatus: payoutProfiles.panStatus,
        panLast4: payoutProfiles.panLast4,
        panVerifiedAt: payoutProfiles.panVerifiedAt,
        bankAccountLast4: payoutProfiles.bankAccountLast4,
        bankIfsc: payoutProfiles.bankIfsc,
        bankHolderName: payoutProfiles.bankHolderName,
        upiId: payoutProfiles.upiId,
        updatedAt: payoutProfiles.updatedAt,
      })
      .from(payoutProfiles)
      .where(eq(payoutProfiles.agentId, agent.id))
      .limit(1);

    const earnings = await earningsFor(ctx.tx, agent.id);
    const panVerified = profile?.panStatus === "VERIFIED";

    return ok(ctx, {
      pan: maskPan(profile?.panLast4 ?? null),
      panStatus: profile?.panStatus ?? "NOT_SUBMITTED",
      panVerifiedAt: profile?.panVerifiedAt ?? null,
      bankAccount: maskAccountNumber(profile?.bankAccountLast4 ?? null),
      bankIfsc: profile?.bankIfsc ?? null,
      bankHolderName: profile?.bankHolderName ?? null,
      upiId: profile?.upiId ?? null,
      mobileVerified: agent.mobileVerifiedAt !== null,
      withdrawal: {
        blocked: !panVerified || agent.mobileVerifiedAt === null,
        reasons: [
          ...(panVerified ? [] : ["PAN_NOT_VERIFIED"]),
          ...(agent.mobileVerifiedAt ? [] : ["MOBILE_NOT_VERIFIED"]),
        ],
        pendingBalancePaise: earnings.pendingPaise,
      },
      updatedAt: profile?.updatedAt ?? null,
    });
  }),
);

const putSchema = z
  .object({
    pan: panSchema.optional(),
    bankAccountNumber: z
      .string()
      .trim()
      .regex(/^\d{9,18}$/, "Enter a valid bank account number")
      .optional(),
    bankIfsc: ifscSchema.optional(),
    bankHolderName: z.string().trim().min(2).max(120).optional(),
    upiId: z
      .string()
      .trim()
      .regex(/^[\w.\-]{2,64}@[a-zA-Z]{2,32}$/, "Enter a valid UPI id")
      .optional(),
  })
  .refine(
    (v) =>
      // A bank account is only usable with its IFSC and the holder's name.
      (!v.bankAccountNumber && !v.bankIfsc) ||
      Boolean(v.bankAccountNumber && v.bankIfsc && v.bankHolderName),
    {
      message:
        "Bank account number, IFSC and account holder name must be given together",
      path: ["bankAccountNumber"],
    },
  );

export const PUT = handler(
  authedRoute({ name: "payouts.profile.write", limit: RULES.write }, async (ctx) => {
    const body = await parseBody(ctx.request, putSchema);
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);

    const values: Record<string, unknown> = { agentId: agent.id, updatedAt: new Date() };

    if (body.pan) {
      const fingerprint = fingerprintPii(body.pan);

      // One account per PAN. The check is explicit so the collision returns a
      // meaningful code; the unique index behind it is what actually guarantees
      // it under concurrency.
      const clash = await ctx.tx
        .select({ agentId: payoutProfiles.agentId })
        .from(payoutProfiles)
        .where(eq(payoutProfiles.panFingerprint, fingerprint))
        .limit(1);

      if (clash[0] && clash[0].agentId !== agent.id) {
        throw new ApiError(
          "PAN_ALREADY_USED",
          "This PAN is already registered to another agent. As stated in the terms you accepted, duplicate accounts are cancelled and accrued commission is forfeited.",
        );
      }

      values.panCiphertext = encryptPii(body.pan);
      values.panFingerprint = fingerprint;
      values.panLast4 = lastFourOfPan(body.pan);
      values.panStatus = "PENDING_VERIFICATION";
    }

    if (body.bankAccountNumber) {
      values.bankAccountCiphertext = encryptPii(body.bankAccountNumber);
      values.bankAccountLast4 = body.bankAccountNumber.slice(-4);
    }
    if (body.bankIfsc) values.bankIfsc = body.bankIfsc;
    if (body.bankHolderName) values.bankHolderName = body.bankHolderName;
    if (body.upiId) values.upiId = body.upiId;

    // Same reasoning as signup: the clash check above only sees rows this agent
    // is permitted to read, so the unique index on pan_fingerprint is the real
    // guarantee and its violation is translated to PAN_ALREADY_USED.
    await mapConstraintErrors(() =>
      ctx.tx
        .insert(payoutProfiles)
        .values(values as typeof payoutProfiles.$inferInsert)
        .onConflictDoUpdate({
          target: payoutProfiles.agentId,
          set: values as Partial<typeof payoutProfiles.$inferInsert>,
        }),
    );

    const [saved] = await ctx.tx
      .select({
        panStatus: payoutProfiles.panStatus,
        panLast4: payoutProfiles.panLast4,
        bankAccountLast4: payoutProfiles.bankAccountLast4,
        upiId: payoutProfiles.upiId,
      })
      .from(payoutProfiles)
      .where(eq(payoutProfiles.agentId, agent.id))
      .limit(1);

    return ok(ctx, {
      saved: true,
      pan: maskPan(saved?.panLast4 ?? null),
      panStatus: saved?.panStatus,
      bankAccount: maskAccountNumber(saved?.bankAccountLast4 ?? null),
      upiId: saved?.upiId ?? null,
      note: "PAN is verified by an administrator before any payout is released.",
    });
  }),
);

export const OPTIONS = preflight;
