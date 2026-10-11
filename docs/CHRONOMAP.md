# Chronomap pages

Product pages and policy routes for Chronomap, the interactive historical atlas. Built in `apps/web` under the `(site)` group, so the Calecutech header and footer apply.

## Routes

| Route | File | Purpose |
|---|---|---|
| `/chronomap` | `apps/web/src/app/(site)/chronomap/page.tsx` | Product landing page |
| `/chronomap/app` | `apps/web/src/app/(site)/chronomap/app/page.tsx` | Clearly labelled preview state, `noindex`, no inputs, no storage |
| `/chronomap/privacy` | `.../chronomap/privacy/page.tsx` | Privacy policy, current practice plus planned features |
| `/chronomap/terms` | `.../chronomap/terms/page.tsx` | Terms of use |
| `/chronomap/delete-account` | `.../chronomap/delete-account/page.tsx` | Contact-based deletion process |
| `/contact` | existing page | Reused |

Shared pieces:

- `src/lib/chronomap/content.ts`: origin, last-updated date, entity name, policy nav.
- `src/components/chronomap/TimelinePreview.tsx`: static interface picture (not a map, no data).
- `src/components/chronomap/PolicyPage.tsx`: policy shell and the visible `Todo` marker.
- Header and footer link to Chronomap. Sitemap lists the four public routes. `app/not-found.tsx` gives unmatched URLs a branded 404.

## Facts and details

- Company identity comes from `src/lib/company.ts`: Calecute Technologies LLC (Wyoming), contact `info@calecutech.com`, operations office Kozhikode, Kerala. No street address, phone or registration number is published for Chronomap.
- The example journey is illustrative and labelled so. Its dates (Rajaraja I reign 985–1014 CE, Brihadisvara Temple completed c. 1010 CE) are approximate and are not generated from a dataset.
- The privacy policy states that the site has no analytics, advertising or tracking scripts and no accounts. Google sign-in (Firebase Authentication) and analytics are listed as planned, not in use. Update the policy before either ships.

## Open items (marked `TODO` on the pages)

1. Retention period for correspondence and hosting logs.
2. Timescale for completing deletion requests.
3. Age thresholds for the countries where the product will be offered.
4. Governing law and dispute resolution clause.
5. Limitation of liability clause and mandatory consumer rights.
6. Licence and source for each third-party asset (none are used yet).
7. Trademark position of the working name "Chronomap".
8. Legal review of all four policy pages. The pages say so, and the "Last updated" date is `POLICY_UPDATED` in `content.ts`.

## Assets

No external images, fonts or scripts. All artwork is CSS and the inline styles in the components. The site's existing Geist font loads through `next/font`.

## Deploy

Vercel project `calecute` (team `sparex1`) builds `apps/web` from `main`. Chronomap has no environment variables of its own. `NEXT_PUBLIC_SITE_ORIGIN` (default `https://calecutech.com`) sets canonical URLs, the sitemap and robots.txt.

The Chronomap placeholder mobile app (ZIP `prompts/`, `lib/main.dart`) links to these routes. It collects no data. It is not part of this repository.
