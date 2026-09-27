/**
 * POST /auth/signout
 *
 * Revokes the refresh token at the API and clears the cookies. POST because it
 * changes state; the sign-out control is a real form, so it works without
 * JavaScript.
 */
import { redirect } from "next/navigation";
import { api } from "@/lib/api/client";
import { clearSessionCookies, readRefreshToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const refreshToken = await readRefreshToken();
  if (refreshToken) {
    // A failure here is not worth blocking sign-out: the cookies go either way,
    // and the token expires on its own.
    await api.post("/auth/logout", { refreshToken }).catch(() => {});
  }
  await clearSessionCookies();
  redirect("/agents?signedout=1");
}
