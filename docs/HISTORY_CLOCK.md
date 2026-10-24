# History Clock pages

History Clock (renamed from Chronomap in October 2026; `/chronomap/*` redirects permanently to `/history-clock/*`) is the interactive world-history map. Built in `apps/web` under the `(site)` group, so the Calecutech header and footer apply. `history-clock/layout.tsx` gives every History Clock page the paper background and the hand-lettered Patrick Hand face (self-hosted by `next/font`).

## Routes

| Route | File | Purpose |
|---|---|---|
| `/history-clock` | `apps/web/src/app/(site)/history-clock/page.tsx` | Home page, caricature style |
| `/history-clock/app` | `.../history-clock/app/page.tsx` | "Try it" map: pick a region, slide the year, see rulers, rises and falls, monuments, thinkers, arts |
| `/history-clock/quiz` | `.../history-clock/quiz/page.tsx` | "Try now" Kerala history quiz, ten questions per round from a pool of twenty |
| `/history-clock/privacy` | `.../history-clock/privacy/page.tsx` | Privacy policy, current practice plus planned features |
| `/history-clock/terms` | `.../history-clock/terms/page.tsx` | Terms of use |
| `/history-clock/delete-account` | `.../history-clock/delete-account/page.tsx` | Contact-based deletion process |
| `/contact` | existing page | Reused |

Shared pieces:

- `src/lib/history-clock/content.ts`: origin, paths, last-updated date, entity name, policy nav.
- `src/lib/history-clock/regions.ts`: the hand-written entries for twelve regions (Kerala is a pin; the others are groups of countries by ISO numeric code). Add regions and entries here.
- `src/lib/history-clock/world.ts`: projects Natural Earth 1:110m outlines (`world-atlas`, public domain) to SVG paths on the server with `d3-geo`.
- `src/lib/history-clock/kerala-quiz.ts`: quiz questions; the first option is the answer.
- `src/components/history-clock/`: `HistoryMap` and `KeralaQuiz` (client), `Doodles` (caricature SVGs), `sketch.module.css` (ink, wobble corners, hard shadows), `PolicyPage`.
- Header, footer, sitemap and the Calecutech home page link to History Clock.

## Facts and details

- Company identity comes from `src/lib/company.ts`: Calecute Technologies LLC (Wyoming), contact `info@calecutech.com`, operations office Kozhikode, Kerala. No street address, phone or registration number is published for History Clock.
- Map and quiz entries are written by hand from standard reference dates. "c." marks approximate dates; notes flag disputed ones. Map borders are modern, for orientation only.
- The privacy policy states that the site has no analytics, advertising or tracking scripts and no accounts. Google sign-in (Firebase Authentication) and analytics are listed as planned, not in use. Update the policy before either ships.

## Open items (marked `TODO` on the pages)

1. Retention period for correspondence and hosting logs.
2. Timescale for completing deletion requests.
3. Age thresholds for the countries where the product will be offered.
4. Governing law and dispute resolution clause.
5. Limitation of liability clause and mandatory consumer rights.
6. Licence and source for each third-party asset (none are used yet).
7. Trademark position of the working name "History Clock".
8. Legal review of all four policy pages. The pages say so, and the "Last updated" date is `POLICY_UPDATED` in `content.ts`.

## Assets

No external images or scripts. Artwork is inline SVG and CSS. Fonts (Geist, Patrick Hand) are self-hosted through `next/font`. Map outlines come from the `world-atlas` package at build time.

## Deploy

Vercel project `calecute` (team `sparex1`) builds `apps/web` from `main`. History Clock has no environment variables of its own. `NEXT_PUBLIC_SITE_ORIGIN` (default `https://calecutech.com`) sets canonical URLs, the sitemap and robots.txt.

The History Clock preview mobile app lives in its own repository, [vsvivek1/historyclock-app](https://github.com/vsvivek1/historyclock-app) (Flutter, package ID `com.calecutech.historyclock`). It links to these routes and collects no data, so keep the routes stable.
