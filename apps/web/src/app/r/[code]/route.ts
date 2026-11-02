/**
 * /r/{code}?app={slug} — where every member's invite link lands.
 *
 * The link is the same wherever it is shared, and this handler decides where
 * it goes: the Play Store listing for an Android visitor (with the code in
 * the install referrer, so it survives the install), the product's own web
 * URL otherwise, or our page about the app when it has neither. The code
 * always travels on as `?ref=`.
 *
 * The click is counted after the response is sent, so the redirect is never
 * slowed by it and never fails because of it.
 */
import { after, NextResponse, type NextRequest } from "next/server";
import { getPublicProduct, logReferralClick, type PublicProduct } from "@/lib/api/client";
import { referralTarget } from "@/lib/referral-redirect";

const CODE = /^[A-Z0-9-]{3,40}$/;
const SLUG = /^[a-z0-9-]{1,80}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const raw = (await params).code ?? "";
  let code: string;
  try {
    code = decodeURIComponent(raw).trim().toUpperCase();
  } catch {
    code = "";
  }
  if (!CODE.test(code)) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const appParam = request.nextUrl.searchParams.get("app")?.trim().toLowerCase() ?? "";
  const app = SLUG.test(appParam) ? appParam : null;
  const isAndroid = /android/i.test(request.headers.get("user-agent") ?? "");

  after(() => {
    logReferralClick({
      code,
      ...(app ? { app } : {}),
      source: isAndroid ? "android" : "web",
    }).catch(() => {
      // A lost click is not worth a failed redirect.
    });
  });

  let product: PublicProduct | null = null;
  if (app) {
    try {
      product = await getPublicProduct(app);
    } catch {
      product = null;
    }
  }

  return NextResponse.redirect(
    referralTarget({ code, app, product, isAndroid, origin: request.url }),
    302,
  );
}
