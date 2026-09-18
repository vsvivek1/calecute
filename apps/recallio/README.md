# Recallio web

Two hostnames, one deployment.

| Host | View |
| --- | --- |
| `user.recallio.calecutech.com` | A user's own account: free card count, subscription, pay by UPI or card |
| `superuser.recallio.calecutech.com` | Admin console: set a free card allowance per account, grant or revoke complimentary access |

Accounts are the same Supabase accounts the phone app uses, so signing in here
shows exactly what the app shows.

## The subdomain grants nothing

Anyone can type the admin address. The hostname only chooses which layout
renders; every admin power is a row-level security policy keyed on the signed-in
user's role:

- `is_admin()` gates reading other people's profiles and subscriptions.
- `is_superuser()` gates the view switcher.
- Server actions re-check the role before writing, so a refusal is a readable
  message rather than a silent failure.

A non-admin who visits the admin host is told plainly that their account has no
admin access, and is pointed at their own account page.

## What an admin can and cannot change

| | |
| --- | --- |
| Free card allowance per account | yes — blank means the product default |
| Complimentary access (all courses, no payment) | yes — granted and revocable |
| A Google Play or Razorpay subscription | **no** |

Paid subscriptions are written only by verified payment webhooks. An admin who
could edit them could forge one, so the policy allows writes where
`provider = 'admin'` and nowhere else.

Every override is written to `admin_audit` with who did it and when. "Who gave
this account free access" has an answer months later.

## Nothing is ever taken away

Lowering an allowance stops *new* cards. It never deletes progress, resets a
streak, or takes back a card already studied — the app's paywall has always
worked that way and the admin panel does not get to break it.

## Running it

```
cp apps/recallio/.env.example apps/recallio/.env.local   # fill in the keys
npm run dev:recallio                                      # localhost:3100
```

Local development renders the **user** view, because the hostname is not the
admin host. To work on the admin view locally, set
`NEXT_PUBLIC_ADMIN_HOST=localhost:3100`.

## Deploying

A separate Vercel project, root directory `apps/recallio`, so it deploys
independently of the marketing site.

```
cd apps/recallio && vercel link        # create a new project
vercel domains add user.recallio.calecutech.com
vercel domains add superuser.recallio.calecutech.com
```

Environment variables on the Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_USER_HOST=user.recallio.calecutech.com
NEXT_PUBLIC_ADMIN_HOST=superuser.recallio.calecutech.com
```

### DNS

Two records on `calecutech.com`, both pointing at Vercel:

```
user.recallio        CNAME  cname.vercel-dns.com
superuser.recallio   CNAME  cname.vercel-dns.com
```

### Supabase

Add both origins to Authentication → URL Configuration → Redirect URLs, or the
Google sign-in callback is rejected:

```
https://user.recallio.calecutech.com/auth/callback
https://superuser.recallio.calecutech.com/auth/callback
```

## Before any of this works

Apply `supabase/migrations/0007_admin.sql` from the psc-app repository. It
creates the roles, the override columns and the policies, and seeds
`vs.vivek1@gmail.com` as the first superuser — a chicken-and-egg step that can
only happen in a migration, because no admin exists to grant the first role.
