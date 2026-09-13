"use server";

import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api/client";
import { currentAccessToken } from "@/lib/session";
import type { FormState } from "@/app/(agents)/agents/signup/actions";

function text(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isRedirect(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT"),
  );
}

/**
 * Submit PAN and bank or UPI details.
 *
 * The PAN passes through this server on its way to the API and is not logged,
 * not stored here, and not echoed back into the form on error — a re-rendered
 * value would put it in the HTML of every subsequent response.
 */
export async function savePayoutProfile(
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const token = await currentAccessToken();
  if (!token) redirect("/auth/google/start?returnTo=/agents/dashboard/payouts");

  const body: Record<string, string> = {};
  const pan = text(data, "pan");
  const account = text(data, "bankAccountNumber");
  const ifsc = text(data, "bankIfsc");
  const holder = text(data, "bankHolderName");
  const upi = text(data, "upiId");

  if (pan) body.pan = pan;
  if (account) body.bankAccountNumber = account;
  if (ifsc) body.bankIfsc = ifsc;
  if (holder) body.bankHolderName = holder;
  if (upi) body.upiId = upi;

  if (Object.keys(body).length === 0) {
    return { error: "Nothing to save.", code: "VALIDATION_FAILED" };
  }

  try {
    await api.put("/payouts/profile", body, { token });
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof ApiError) {
      // Deliberately no `values`: the PAN must not come back in the HTML.
      return { error: error.message, code: error.code, fields: error.fieldErrors() };
    }
    throw error;
  }

  redirect("/agents/dashboard/payouts?saved=1");
}

/**
 * Send the verification code to the number recorded at signup.
 *
 * Takes the action-state signature even though it uses neither argument, so the
 * form can surface a delivery failure — no SMS provider is configured yet, and
 * that must show as an error rather than as a silent no-op.
 */
export async function startMobileVerification(): Promise<FormState>;
export async function startMobileVerification(
  previous: FormState,
  data: FormData,
): Promise<FormState>;
export async function startMobileVerification(
  ..._args: unknown[]
): Promise<FormState> {
  const token = await currentAccessToken();
  if (!token) redirect("/auth/google/start?returnTo=/agents/dashboard/payouts");

  try {
    await api.post("/payouts/mobile/start", {}, { token });
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof ApiError) return { error: error.message, code: error.code };
    throw error;
  }
  redirect("/agents/dashboard/payouts?sent=1");
}

export async function verifyMobile(
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const token = await currentAccessToken();
  if (!token) redirect("/auth/google/start?returnTo=/agents/dashboard/payouts");

  try {
    await api.post("/payouts/mobile/verify", { code: text(data, "code") }, { token });
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof ApiError) return { error: error.message, code: error.code };
    throw error;
  }
  redirect("/agents/dashboard/payouts?verified=1");
}
