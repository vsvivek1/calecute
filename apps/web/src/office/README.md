# Office

A small staff office inside the website: staff sign in at `/login`, admins
manage people and settings, admins and managers assign tasks, and each employee
keeps their own tasks up to date with the steps they did, bottlenecks, key
contacts, files and the result.

| Role | Can |
|---|---|
| Admin | Everything: add people and create their logins, change roles, switch people off, reset passwords, company name, logo and timezone |
| Manager | Assign, edit, reassign, reopen and delete any task; see everyone's schedule |
| Employee | Only their own tasks: add steps, raise and clear bottlenecks, add contacts and files, close with a result |

The rules are enforced by the database (row-level security and triggers), not
only by the screens. The tests in `supabase/office/tests/rls.sql` show what
each role can and cannot do.

## Where it lives

Three folders, nothing else, apart from one line in `src/proxy.ts`:

```
apps/web/src/app/(office)/     routes: /login, /login/new-password, /office/...
apps/web/src/office/           logic, components, stylesheet (this folder)
apps/web/supabase/office/      SQL migration, access tests, Edge Function
```

An ESLint rule keeps the boundary: office code may not import the website's
`@/lib` or `@/components`, and the website may not import `@/office` (except
`src/proxy.ts`).

## Install it for another company

You need a Next.js 16 app with the `@/*` path alias pointing at `src/`, and a
Supabase project.

1. Copy the three folders above into the same places in the new app.
2. Install the packages: `npm install @supabase/ssr @supabase/supabase-js server-only`.
3. In the Supabase SQL editor, run `supabase/office/migrations/0001_office.sql`.
   It creates `office_*` tables in `public`, helper functions in
   `office_private`, and a private storage bucket `office-files`. No dashboard
   setting needs changing.
4. Deploy the Edge Function, with JWT verification off (it checks the caller
   itself):

   ```
   supabase functions deploy office-admin --no-verify-jwt
   ```

   It is the only code that uses the Supabase secret key, which Supabase gives
   it automatically. Never put that key in the website.
5. Set two environment variables on the website (both are public by design):

   ```
   NEXT_PUBLIC_OFFICE_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_OFFICE_SUPABASE_KEY=sb_publishable_...
   ```
6. Add the office paths to the app's `proxy.ts` (it keeps sessions fresh):

   ```ts
   import { isOfficePath, officeProxy } from "@/office/proxy";

   export async function proxy(request: NextRequest) {
     if (isOfficePath(request.nextUrl.pathname)) return officeProxy(request);
     // ...anything else the app already does
   }

   export const config = { matcher: ["/login", "/login/:path*", "/office", "/office/:path*"] };
   ```
7. Create the first admin. In Supabase, go to Authentication, Users, Add user,
   enter their email and a password, and tick "Auto confirm". Then in the SQL
   editor:

   ```sql
   select office_private.make_first_admin('owner@company.com', 'Owner Name');
   ```
8. Sign in at `/login`, open Settings, and set the company name, logo and
   timezone. Add everyone else on the People page; each gets a temporary
   password shown once, and must choose their own on first sign-in.

To check the access rules on the new project, run
`supabase/office/tests/rls.sql` in the SQL editor. It rolls itself back and
ends with `all passed`.

## Things to know

- Sign-in is email and password only. Accounts are created by an admin; there
  is no sign-up page and no email is sent, so no mail service is needed.
  Supabase's own sign-up endpoint stays open (it is project-wide), but a person
  who signs up that way has no office row and can read or write nothing.
- Switching someone off takes effect at once: the database stops returning
  their data immediately, and their login is banned so it cannot be refreshed.
  Their history stays.
- Dates ("today", "overdue") use the timezone on the Settings page.
- Steps are append-only. A bottleneck can be cleared once. A task can be
  closed only with a result and no open bottlenecks; only an admin or manager
  can reopen it.
- Files go straight from the browser to the private bucket (10 MB each) and are
  opened through short-lived signed links.
