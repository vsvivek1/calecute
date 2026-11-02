# Instagram posts: Geological Assistant Prep

Ad creatives and copy for the Kerala PSC Geological Assistant course, plus a script that posts them to Instagram as free posts, stories and reels. Nothing here runs paid ads or spends money.

| File | What it is |
| --- | --- |
| `ads.json` | The three concepts with English captions, hashtags and the posting schedule |
| `render.mjs` | Renders each concept to 1080x1080 (feed) and 1080x1920 (story) PNGs, and stitches a 13.5 s 1080x1920 reel |
| `publish.mjs` | Posts to Instagram through the Graph API. Dry run unless `--live` |
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
3. **Business portfolio.** At business.facebook.com create the business portfolio for Calecute Technologies (OPC) Private Limited and add the Page and the Instagram account. No ad account or payment method is needed.
4. **Meta app.** At developers.facebook.com create an app of type Business, connect it to the business portfolio, and add the product "Instagram" (Instagram API with Facebook login).
5. **System user token.** In Business settings, Users, System users: add an admin system user, assign it the Page, the Instagram account and the app, then Generate token with these permissions: `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `pages_show_list`, `pages_read_engagement`, `business_management`. Choose "never expire".
6. **Find the Instagram user id.** Page id is in the Page's About section; the Instagram user id comes from Graph API Explorer: `GET /<page-id>?fields=instagram_business_account`.
7. **Store them as GitHub secrets**, never in chat or in the repo: repository Settings, Secrets and variables, Actions, add `META_ACCESS_TOKEN` and `IG_USER_ID`.

## Running it

From GitHub, Actions, "Instagram posts", Run workflow:

- `check`: read-only test that the secrets work. Prints the account name; never posts.
- `post` + `quiz`: feed post of the quiz creative, then the answer as the first comment.
- `story` + `countdown`: posts the countdown story.
- `reel`: posts the quiz reel and shares it to the feed. With `ad` set to `countdown` or `plan`, posts that concept's 8 s reel.
- `auto` + `am` or `pm`: the next item in the schedule.

The workflow also runs on its own twice a day (08:00 IST story, 19:00 IST reel or feed post at the evening peak) and posts live. Feed slots are mostly reels, because Instagram shows reels to non-followers far more than photos. The order is the `schedule` block in `ads.json`; to pause it, disable the workflow in the Actions tab.

Leave "live" unticked first: the run prints every request it would send, and sends nothing.

## Notes

- The Graph API version defaults to `v23.0`; set `META_GRAPH_VERSION` if Meta has retired it.
- Organic posts cannot carry a clickable link, so their captions say "link in bio". Put `https://calecutech.com/geological-assistant/study?course=geological-assistant&utm_source=instagram` in the Instagram bio: it opens sign-in and then the ₹3,000 checkout.
