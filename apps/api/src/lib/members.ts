/**
 * USER-tier members: the find-or-create behind POST /members and the response
 * shape both member endpoints return.
 *
 * A member is a `users` row identified by `<product_slug>:<the app's uid>`
 * plus an APPROVED, USER-tier `agents` row. No application, no review, no
 * KYC: the row exists the first time the app reports the sign-in, and the
 * code is theirs from then on. Both inserts are race-safe through their unique
 * constraints; a second concurrent call for the same uid simply finds the row
 * the first one wrote.
 */
import { and, eq, sql } from "drizzle-orm";
import type { ScopedDb } from "@/db/rls";
import { agents, users } from "@/db/schema";
import type { ServiceProduct } from "./auth/service";
import { ApiError } from "./errors";
import {
  generateUserCode,
  isFreeProduct,
  userQrUrl,
  userReferralLink,
  userWhatsappShareLink,
} from "./referral";

export interface MemberRow {
  userId: number;
  agentId: number;
  agentCode: string;
  status: string;
  displayName: string | null;
}

export function memberExternalRef(product: ServiceProduct, externalRef: string): string {
  return `${product.slug}:${externalRef}`;
}

export async function findMember(
  tx: ScopedDb,
  product: ServiceProduct,
  externalRef: string,
): Promise<MemberRow | null> {
  const [row] = await tx
    .select({
      userId: users.id,
      agentId: agents.id,
      agentCode: agents.agentCode,
      status: agents.status,
      displayName: agents.displayName,
    })
    .from(users)
    .innerJoin(agents, eq(agents.userId, users.id))
    .where(
      and(
        eq(users.externalRef, memberExternalRef(product, externalRef)),
        eq(agents.tier, "USER"),
        eq(agents.sourceProductId, product.id),
      ),
    )
    .limit(1);
  return row ?? null;
}

const CODE_ATTEMPTS = 6;

export async function ensureMember(
  tx: ScopedDb,
  product: ServiceProduct,
  input: { externalRef: string; name: string; email?: string | null; pictureUrl?: string | null },
): Promise<{ member: MemberRow; created: boolean }> {
  const ref = memberExternalRef(product, input.externalRef);

  // The user row. ON CONFLICT on external_ref makes two first calls for the
  // same uid converge on one row; the update keeps the profile current.
  const [user] = await tx
    .insert(users)
    .values({
      externalRef: ref,
      googleSub: null,
      email: input.email ?? null,
      emailVerified: false,
      name: input.name,
      pictureUrl: input.pictureUrl ?? null,
      role: "AGENT",
    })
    .onConflictDoUpdate({
      target: users.externalRef,
      set: {
        name: input.name,
        pictureUrl: input.pictureUrl ?? sql`${users.pictureUrl}`,
        email: input.email ?? sql`${users.email}`,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id });

  const existing = await findMember(tx, product, input.externalRef);
  if (existing) {
    if (existing.displayName !== input.name) {
      await tx
        .update(agents)
        .set({ displayName: input.name, updatedAt: new Date() })
        .where(eq(agents.id, existing.agentId));
      existing.displayName = input.name;
    }
    return { member: existing, created: false };
  }

  // The agent row. A code collision (32^6 space) or a concurrent insert for
  // the same user both surface as a conflict; either way, try again and the
  // next loop finds whichever row won.
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const [inserted] = await tx
      .insert(agents)
      .values({
        userId: user.id,
        agentCode: generateUserCode(),
        tier: "USER",
        status: "APPROVED",
        displayName: input.name,
        sourceProductId: product.id,
      })
      .onConflictDoNothing()
      .returning({
        agentId: agents.id,
        agentCode: agents.agentCode,
        status: agents.status,
        displayName: agents.displayName,
      });

    if (inserted) {
      return { member: { userId: user.id, ...inserted }, created: true };
    }

    const found = await findMember(tx, product, input.externalRef);
    if (found) return { member: found, created: false };
  }

  throw new ApiError("INTERNAL_ERROR", "Could not issue an invite code. Retry the request.");
}

export interface MemberStats {
  friendsJoined: number;
  payingFriends: number;
  diamonds: number;
  earnings: { pendingPaise: number; paidPaise: number; lifetimePaise: number; currency: "INR" };
}

/** Aggregates across every product, through a SECURITY DEFINER function. */
export async function memberStats(tx: ScopedDb, agentId: number): Promise<MemberStats> {
  const rows = (await tx.execute(sql`
    SELECT friends_joined, paying_friends, diamonds, pending_paise, paid_paise, lifetime_paise
      FROM app.referrer_stats(${agentId})
  `)) as unknown as {
    friends_joined: number;
    paying_friends: number;
    diamonds: number;
    pending_paise: number | string;
    paid_paise: number | string;
    lifetime_paise: number | string;
  }[];
  const row = rows[0];
  return {
    friendsJoined: Number(row?.friends_joined ?? 0),
    payingFriends: Number(row?.paying_friends ?? 0),
    diamonds: Number(row?.diamonds ?? 0),
    earnings: {
      pendingPaise: Number(row?.pending_paise ?? 0),
      paidPaise: Number(row?.paid_paise ?? 0),
      lifetimePaise: Number(row?.lifetime_paise ?? 0),
      currency: "INR",
    },
  };
}

export async function memberResponse(
  tx: ScopedDb,
  requestUrl: string,
  product: ServiceProduct,
  member: MemberRow,
) {
  return {
    code: member.agentCode,
    link: userReferralLink(member.agentCode, product.slug),
    whatsappShareUrl: userWhatsappShareLink(member.agentCode, product.slug, product.nameEn),
    qrUrl: userQrUrl(requestUrl, member.agentCode, product.slug),
    tier: "USER" as const,
    status: member.status,
    stats: await memberStats(tx, member.agentId),
    product: {
      slug: product.slug,
      name: product.nameEn,
      isFree: isFreeProduct(product),
      userRateBps: product.userRateBps,
    },
  };
}
