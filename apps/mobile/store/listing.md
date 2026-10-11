# History Clock: Google Play listing draft

Everything here describes the preview app in `apps/mobile` as it is today: one screen that opens History Clock web pages in the browser. Update it before the full app ships (map, sign-in, any SDK).

## Assets in this folder

| Play Console field | File | Size |
|---|---|---|
| App icon | `icon-512.png` | 512 × 512, 32-bit PNG |
| Feature graphic | `feature-graphic-1024x500.png` | 1024 × 500, 24-bit PNG |
| Phone screenshots | `screenshots/phone-19x9-1-top.png`, `screenshots/phone-19x9-2-bottom.png` | 1080 × 2340 |
| Phone screenshots (alternative, 16:9) | `screenshots/phone-16x9-1-top.png`, `screenshots/phone-16x9-2-bottom.png` | 1080 × 1920 |

Upload one pair of phone screenshots (Play needs at least two). The screenshots are the app's own Flutter UI rendered at phone sizes; they have no Android status bar. Retake them from a phone if you prefer device captures. `source/` holds the scripts that drew the icon, feature graphic and screenshots.

## Main store listing

**App name** (30 max): `History Clock`

**Short description** (80 max, this is 70):

> Explore world history on a map: empires, monuments, thinkers and arts.

**Full description** (4000 max):

> History Clock is a playful way into world history.
>
> Pick a corner of the world, slide back through the centuries, and see who ruled there, which empires rose and fell, and the monuments, thinkers, writers and artists of each age.
>
> This is an early preview of the app. Today it opens the History Clock map and the Kerala history quiz on the web, so you can try them from your phone:
>
> • The History Clock map: choose a region, move the year slider, and read what was happening there.
> • The Kerala history quiz: ten questions a round on Kerala's past.
>
> The full app, with the map built in, is on its way. Installing the preview means you'll get it as an update.
>
> No account, no ads, no tracking. The preview collects no personal data.
>
> History Clock is made by Calecutech in Kozhikode, Kerala. Questions or ideas: info@calecutech.com

**App category:** Education
**Tags:** history, education, maps (pick from Play's list)
**Contact email:** info@calecutech.com
**Website:** https://calecutech.com/history-clock
**Privacy policy URL:** https://calecutech.com/history-clock/privacy

## App content answers

These match the code at the time of writing: no network calls of its own, no SDKs besides Flutter and `url_launcher`, no login, no ads.

**Privacy policy:** https://calecutech.com/history-clock/privacy

**Ads:** No, the app does not contain ads.

**App access:** All functionality is available without special access (no login).

**Data safety:**

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | No |
| Is all of the user data collected by your app encrypted in transit? | Not asked when nothing is collected |
| Do you provide a way for users to request that their data be deleted? | Optional when nothing is collected. You can still give https://calecutech.com/history-clock/delete-account |

Links open in the user's own browser, outside the app, so what the website does is covered by the website's privacy policy rather than the app's Data safety form.

**Content rating (IARC questionnaire):** category "Reference, News, or Educational". Answer No to violence, sexual content, profanity, drugs, gambling, user-generated content, user interaction, sharing location and digital purchases. The expected result is the lowest rating (Everyone / PEGI 3 / IARC 3+), but the questionnaire decides.

**Target audience and content:** needs your call (see below). Suggested: 13 and over.

**News app:** No. **COVID-19 contact tracing or status:** No. **Data deletion URL (if asked):** https://calecutech.com/history-clock/delete-account. **Government app:** No. **Financial features:** None. **Health:** None.

## Needs your judgement

1. **Target age groups.** If you include under 13, the app falls under Google Play's Families policy (teacher-approved rules, stricter ad and SDK limits, and every future SDK must be Families-certified). 13 and over keeps the full app's Google sign-in plans simpler. A history quiz could appeal to children, so pick deliberately.
2. **Minimum functionality.** Google Play can reject apps that mostly open web links. The listing says plainly that this is a preview. Start with internal testing and expect review feedback on production.
3. **Developer account type.** Personal developer accounts created after November 2023 must run a closed test with at least 12 testers for 14 days before they can apply for production. Organisation accounts don't need this.
4. **Website pages.** The privacy, terms and delete-account pages still carry legal `TODO`s (`docs/HISTORY_CLOCK.md`). Finish those before a public release.
5. **Name.** "History Clock" trademark check is still open (also in `docs/HISTORY_CLOCK.md`).
