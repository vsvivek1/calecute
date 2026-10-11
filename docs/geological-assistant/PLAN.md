# Geological Assistant Prep: plan and architecture

Package: Kerala PSC Geological Assistant (Ground Water Dept, Cat. 46/2011). Rs 3,000 one-time, lifetime access, web + app, quizzes.

## What was built
| Piece | Where | State |
|---|---|---|
| Home + policy pages | `apps/web/public/geological-assistant/` | Done. Buy button inert (`config.js` `salesOpen:false`) |
| Products page entry | `apps/web/src/lib/static-apps.ts` | Done |
| Console deep link `?course=` | `apps/recallio/src/...` | Done, typechecked |
| Course migration + seed | `docs/geological-assistant/db/` | Written, **not applied** |
| Flutter app | see `FLUTTER_PLAN.md` | Planned |

## Architecture (same engine as the quiz apps)
```
calecutech.com/geological-assistant  --Buy-->  user.recallio.calecutech.com/?course=geological-assistant
   (static page)                                 (Next.js console, Google sign-in)
                                                   |  PayButton -> edge fn razorpay-create-order(courseId)
                                                   v
                                    Razorpay Checkout (UPI / card / netbanking)
                                                   |  payment.captured webhook
                                                   v
                         edge fn razorpay-webhook (HMAC verified) -> subscriptions row
                                                   |  current_period_end = null  => lifetime
                                                   v
                       has_active_subscription('geological-assistant') = true  -> app + web unlock
```
- Price lives in `courses.price_minor` (300000 paise). The client names only a course id; the server reads the price. A tampered client cannot pay less.
- The browser success callback grants nothing. Only the signed webhook does.
- Content tables: 1 course, 5 modules, 1,854 cards, 1,212 questions, `question_cards` links (up to 3 cards per question, same topic).
- `cards.statement_ml` is relaxed to nullable (English-only course). Other courses are unaffected.

## Content notes
- Priority: card `frequency` 3/2/1 and `tier` 1/2/3 from h/m/l.
- 48 cards carry `verified=false` ("verify before exam"). 712 cards have past-paper source tags in `source_ref`.
- Verification was by independent passes of the same model family. It shows consistency, not proof. Keep the report-a-mistake loop open.

## Owner steps to go live (in order)
1. Resume Supabase project **Psc Prep** (`rhfxoxsntsscbfjsyjsd`). It is paused now. I did not resume it.
2. Confirm the engine is on it (migrations 0001-0007, functions deployed). I could not inspect it while paused.
3. Send Razorpay **Key ID + Key Secret** (Test keys first), and set a webhook secret.
4. Set function secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` on the recallio Vercel project.
5. Deploy `razorpay-create-order` and `razorpay-webhook` (`--no-verify-jwt` on the webhook). Webhook URL: `https://<ref>.supabase.co/functions/v1/razorpay-webhook`, event `payment.captured`.
6. Apply `0008_geological_assistant_course.sql`, then `0008_geological_assistant_seed.sql` (psql or SQL editor; seed is 2.8 MB).
7. In Supabase Auth, allow redirect `https://user.recallio.calecutech.com/auth/callback**` (the deep link adds `?course=`).
8. Test-mode purchase end to end. Check the subscription row has `current_period_end` null.
9. Switch to Live keys. Set `salesOpen:true` in `config.js`. Redeploy.

## Decisions to confirm
- **Seller entity**: pages name Calecute Technologies (OPC) Private Limited (Recallio precedent, the OPC's Razorpay account). Earlier notes mention the LLC as store publisher. Confirm.
- **Refund terms** in `refunds/` are my draft: 7 days and under 100 cards studied. Edit freely.
- **Content gating**: today only the app enforces paywall. Strong protection needs an RLS policy on `cards`/`questions` keyed to `has_active_subscription`. That would change live apps, so it is not applied. Recommended before launch of paid sales.
- **Free preview**: the course is paid-only in this plan. Option: first 30 cards free (as USS). A free taste usually lifts conversion.
- **GST / invoicing**: Rs 3,000 digital service. Check GST registration and Razorpay invoice settings with your accountant.
- Legal pages are drafts. Have them reviewed.

## Risks
- Google Play: digital goods inside an Android app normally must use Play Billing, and the app must not steer users to outside checkout. See `FLUTTER_PLAN.md`. Verify the current policy before release.
- "Lifetime" is defined as product lifetime with 90 days' notice in the refund page. Keep that wording.
