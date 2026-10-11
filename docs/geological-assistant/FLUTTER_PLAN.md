# Flutter app plan: Geological Assistant Prep

Package id: `com.calecutech.geologicalassistant`. Own design (earth/strata look from the web page).

## Approach: fork the existing Recallio app
Reuse `uss-recallio` (Flutter, Supabase, spaced repetition, billing screen). Do not rebuild.
- Keep: sign-in, card scheduler, offline sync, quiz screens, reminders.
- Change: course id `geological-assistant`, English only, adult flow (no parent consent / child profile), new theme, new strings, no Season-Pass-until-March wording.
- Add: topic quizzes by unit, mock test (100 Q, 75 min, 1/3 negative), "verify before exam" badge, priority filter, past-paper tag on cards.
- Content from Supabase (`cards`, `questions`) with local cache so it works offline.

## Payments: pick one (decision needed)
| Option | How | Pro | Con |
|---|---|---|---|
| A. **Play Billing** (recommended for Play Store) | One-time in-app product Rs 3,000; server verifies purchase token; writes a `subscriptions` row (provider `play`) | Policy-safe. Same unlock check | Google takes a fee (15%-30%). Price set in Play Console |
| B. Web-only purchase, app is a "reader" | Buy on website, app only signs in and unlocks | No Play fee | App must not link or mention the web price. Risk of rejection. Check current rules, including India programs |
| C. Razorpay in app | Checkout SDK | Lowest fee | Likely violates Play policy for digital content. Avoid for Play. Fine for sideload only |

Recommendation: A for the app, B-style web purchase stays on the website for web buyers. Both write the same `subscriptions` table, so one purchase unlocks everywhere. Anyone who buys on web and signs in to the app is unlocked with no extra step (the app does not advertise the web price).
Verify the current Google Play Payments policy before building the billing screen.

## Milestones
1. Fork, rename, theme, strip child flow. Sign-in works.
2. Load the geology course from Supabase. Cards + review scheduler.
3. Quizzes by unit and mock test.
4. Entitlement check + locked/unlocked states. Free preview decision applies here.
5. Play Billing + verification edge function (if option A).
6. Closed testing on Play (needs the Play developer account; check the 12-tester / 14-day rule for new personal accounts).
7. Store listing, data-safety form, screenshots, privacy URL `calecutech.com/geological-assistant/privacy/`, delete-account URL.
8. Release, then flip the web page's "Android app" line from "being built" to the Play link.

## Estimate
Fork + geology course: about 1 week. Quizzes + mock: about 1 week. Billing + testing + listing: about 1 to 2 weeks (Play review time not included).

## Open questions
- Free preview size?
- Malayalam explanations later? Schema already supports `statement_ml`.
- Play account owner: OPC or LLC?
