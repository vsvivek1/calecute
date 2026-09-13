"use server";

/**
 * Server actions for the signup flow.
 *
 * These run on the frontend's server and call the API over HTTP, exactly as any
 * other client would. They exist so the forms work as forms: a real POST, no
 * fetch handler, no client-side state machine. The API remains the only thing
 * that touches the database.
 */
import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api/client";
import { currentAccessToken } from "@/lib/session";

/** What a failed submission hands back to the form for re-rendering. */
export interface FormState {
  error?: string;
  code?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
}

function text(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(data: FormData, name: string): number | undefined {
  const value = text(data, name);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export async function submitSignup(
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const token = await currentAccessToken();
  if (!token) redirect("/auth/google/start?returnTo=/agents/signup");

  const values = {
    name: text(data, "name"),
    mobile: text(data, "mobile"),
    districtId: text(data, "districtId"),
    localBodyId: text(data, "localBodyId"),
    pendingLocalBodyName: text(data, "pendingLocalBodyName"),
    wardNumber: text(data, "wardNumber"),
    occupation: text(data, "occupation"),
  };

  try {
    const result = await api.post<{ agent: { agentCode: string } }>(
      "/signup",
      {
        name: values.name,
        mobile: values.mobile,
        districtId: optionalNumber(data, "districtId"),
        // Exactly one of these: a seeded local body, or the name typed by an
        // applicant whose municipality is not loaded yet.
        localBodyId: values.pendingLocalBodyName
          ? null
          : optionalNumber(data, "localBodyId"),
        pendingLocalBodyName: values.pendingLocalBodyName || null,
        // Required in both branches: an applicant in an unseeded municipality
        // still has a ward, the API just cannot resolve it to a row yet.
        wardNumber: optionalNumber(data, "wardNumber"),
        occupation: values.occupation,
        termsVersion: text(data, "termsVersion"),
        acceptedTerms: data.get("acceptedTerms") === "on",
        privacyConsent: data.get("acceptedTerms") === "on",
        // The honeypot: a field no human sees. Any value trips it.
        honeypot: text(data, "website"),
        // Signed by the API when it issued the form; it does the timing itself.
        formToken: text(data, "formToken") || null,
        deviceFingerprint: text(data, "fingerprint") || null,
      },
      { token },
    );
    redirect(`/agents/signup/qualifications?code=${result.agent.agentCode}`);
  } catch (error) {
    // redirect() throws a control-flow signal; it must not be swallowed here.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    if (error instanceof ApiError) {
      return {
        error: error.message,
        code: error.code,
        fields: error.fieldErrors(),
        values,
      };
    }
    throw error;
  }
}

export async function submitQualifications(
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const token = await currentAccessToken();
  if (!token) redirect("/auth/google/start?returnTo=/agents/dashboard");

  const list = (name: string) =>
    data.getAll(name).filter((v): v is string => typeof v === "string");

  const vehicle = text(data, "hasVehicle");

  try {
    await api.post(
      "/signup/qualifications",
      {
        education: text(data, "education") || null,
        experience: list("experience"),
        hoursPerDay: text(data, "hoursPerDay") || null,
        hasVehicle: vehicle === "" ? null : vehicle === "yes",
        computerLiteracy: text(data, "computerLiteracy") || null,
        reach: list("reach"),
      },
      { token },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    if (error instanceof ApiError) {
      return { error: error.message, code: error.code };
    }
    throw error;
  }

  redirect("/agents/signup/done");
}

export async function joinWaitlist(
  _previous: FormState,
  data: FormData,
): Promise<FormState> {
  const token = await currentAccessToken();
  if (!token) redirect("/auth/google/start?returnTo=/agents/waitlist");

  try {
    await api.post(
      "/signup/waitlist",
      {
        districtId: optionalNumber(data, "districtId"),
        localBodyId: optionalNumber(data, "localBodyId"),
        mobile: text(data, "mobile"),
      },
      { token },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    if (error instanceof ApiError) {
      return { error: error.message, code: error.code, fields: error.fieldErrors() };
    }
    throw error;
  }

  redirect("/agents/waitlist?joined=1");
}
