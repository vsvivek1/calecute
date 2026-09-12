/**
 * Body and query parsing. Both funnel into the same VALIDATION_FAILED envelope
 * so clients have exactly one shape to handle.
 */
import { z } from "zod";
import { ApiError } from "./errors";

function flatten(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError("MALFORMED_JSON", "Request body is not valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError("VALIDATION_FAILED", "Request body failed validation", {
      details: { fields: flatten(result.error) },
    });
  }
  return result.data;
}

export function parseQuery<T extends z.ZodType>(
  url: URL,
  schema: T,
): z.output<T> {
  const raw: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const all = url.searchParams.getAll(key);
    raw[key] = all.length > 1 ? all : all[0];
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError("VALIDATION_FAILED", "Query parameters failed validation", {
      details: { fields: flatten(result.error) },
    });
  }
  return result.data;
}

/** Indian mobile number as typed by a person: 10 digits starting 6-9. */
export const mobileSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)/, ""))
  .pipe(
    z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a 10 digit Indian mobile number"),
  );

/** PAN: five letters, four digits, one letter. Normalised to upper case. */
export const panSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN");

export const ifscSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code");

/** A geography id arriving from a client. Existence is checked separately. */
export const geoIdSchema = z.coerce.number().int().positive();
