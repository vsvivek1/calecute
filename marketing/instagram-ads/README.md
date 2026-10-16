# Instagram ads: Geological Assistant Prep

Ad creatives and copy for the Kerala PSC Geological Assistant course, plus a script that posts them to Instagram or sets them up as paid ads in Meta Ads Manager.

| File | What it is |
| --- | --- |
| `ads.json` | The four ad concepts with English and Malayalam captions, hashtags, CTA and objective |
| `render.mjs` | Renders each concept to 1080x1080 (feed) and 1080x1920 (story) PNGs, and stitches a 13.5 s 1080x1920 reel |
| `publish.mjs` | Posts to Instagram, or creates paid ads, through the Meta Graph API. Dry run unless `--live` |
| `../../.github/workflows/instagram-ads.yml` | Runs `publish.mjs` by hand from the GitHub Actions tab, with the tokens kept as repository secrets |

The rendered files live in `apps/web/public/geological-assistant/ads/`, so after a deploy they are public at `https://calecutech.com/geological-assistant/ads/<file>`. Instagram's API fetches images from a public URL, so the creatives must be deployed before `post`, `story` or `reel` will work.

## Re-render after changing copy

```sh
npm i -D playwright   # or use a global install
node marketing/instagram-ads/render.mjs        # needs ffmpeg on PATH for the reel
```

## One-time Meta setup (only the account owner can do this)

1. **Instagram professional account.** In the Instagram app: Settings, Account type and tools, switch to a Business account.
2. **Facebook Page.** Create a Page for Calecute Technologies (or use an existing one) and link the Instagram account to it in Meta Business Suite, Settings, Accounts, Instagram accounts.
3. **Business portfolio and ad account.** At business.facebook.com create the business portfolio for Calecute Technologies (OPC) Private Limited, add the Page, the Instagram account and an ad account (currency INR, time zone Asia/Kolkata), and add a payment method. Meta may ask for business verification before ads run.
4. **Meta app.** At developers.facebook.com create an app of type Business, connect it to the business portfolio, and add the products "Instagram" (Instagram API with Facebook login) and "Marketing API".
5. **System user token.** In Business settings, Users, System users: add an admin system user, assign it the Page, the Instagram account, the ad account and the app, then Generate token with these permissions: `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `pages_show_list`, `pages_read_engagement`, `business_management`, `ads_management`, `ads_read`. Choose "never expire".
6. **Find the ids.** Ad account id is in Ads Manager (digits only, without `act_`). Page id is in the Page's About section. The Instagram user id comes from Graph API Explorer: `GET /<page-id>?fields=instagram_business_account`.
7. **Store them as GitHub secrets**, never in chat or in the repo: repository Settings, Secrets and variables, Actions, add `META_ACCESS_TOKEN`, `IG_USER_ID`, `FB_PAGE_ID`, `META_AD_ACCOUNT_ID`.

## Running it

From GitHub, Actions, "Instagram ads", Run workflow:

- `post` + `quiz`: feed post of the quiz creative, then the answer as the first comment.
- `story` + `countdown`: posts the countdown story.
- `reel`: posts the reel and shares it to the feed.
- `ads` (blank ad list = all four): creates the campaigns, Kerala ad sets (ages 21 to 40, Instagram feed, stories, reels, explore) and ads, all **PAUSED**. Review them in Ads Manager and switch them on there.

Leave "live" unticked first: the run prints every request it would send, and sends nothing.

## Budget

The four creatives group into two campaigns (traffic and engagement), each with one ad set. The default `daily` of ₹400 per ad set is about ₹800 a day; from 18 Oct to 1 Dec that is about ₹35,000, the ad budget in the campaign plan. "Sales" creatives run as traffic campaigns for now, because a sales objective needs the Meta Pixel on the checkout page, which is not installed yet.

## Notes

- The Graph API version defaults to `v23.0`; set `META_GRAPH_VERSION` if Meta has retired it.
- Organic posts cannot carry a clickable link, so their captions say "link in bio". Put `calecutech.com/geological-assistant` in the Instagram bio.
- Paid ad links carry `utm_source=instagram&utm_medium=paid&utm_campaign=ga-046-2026&utm_content=<creative>`.
