/**
 * Admin shell: identity, sign-out, and the report tabs.
 *
 * The tab list comes from the API's report catalogue rather than a hardcoded
 * array, so adding a report server-side makes it appear here with no frontend
 * change. That is the same contract discipline as the rest of the app — the
 * frontend renders what the API describes.
 */
import { En, Ml } from "./Bilingual";

export interface ReportTab {
  slug: string;
  title: string;
}

export function AdminNav({
  email,
  role,
  scope,
  tabs,
  current,
}: {
  email: string;
  role: string;
  scope: string;
  tabs: ReportTab[];
  current?: string;
}) {
  return (
    <>
      <header className="bar">
        <span className="who">
          <strong lang="en">Calecute · Admin</strong>
          <span lang="en">
            {email} · {role} · {scope}
          </span>
        </span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="button secondary">
            <span>
              <Ml>സൈൻ ഔട്ട്</Ml>
              <En>Sign out</En>
            </span>
          </button>
        </form>
      </header>

      <nav className="admin-wrap" style={{ paddingBottom: 0 }} aria-label="Reports">
        <ul className="report-nav">
          {tabs.map((tab) => (
            <li key={tab.slug}>
              <a
                href={`/admin/reports/${tab.slug}`}
                aria-current={tab.slug === current ? "page" : undefined}
              >
                {tab.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
