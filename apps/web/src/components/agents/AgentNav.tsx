/**
 * Navigation for the agent area.
 *
 * Sign-out is a real form POST, not a link: it changes state, and a link would
 * let a prefetcher or an image tag sign someone out.
 */
import { En, Ml } from "./Bilingual";

const TABS = [
  { key: "dashboard", href: "/agents/dashboard", ml: "ഡാഷ്ബോർഡ്", en: "Dashboard" },
  { key: "customers", href: "/agents/dashboard/customers", ml: "ഉപഭോക്താക്കൾ", en: "Customers" },
  { key: "payouts", href: "/agents/dashboard/payouts", ml: "പണം", en: "Payouts" },
] as const;

export function AgentNav({
  email,
  current,
}: {
  email: string;
  current: string;
}) {
  return (
    <>
      <header className="bar">
        <span className="who">
          <strong lang="en">Calecute Technologies</strong>
          <span lang="en">{email}</span>
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
      <nav className="wrap" style={{ paddingTop: "1.25rem", paddingBottom: 0 }}>
        <ul className="report-nav">
          {TABS.map((tab) => (
            <li key={tab.key}>
              <a
                href={tab.href}
                aria-current={tab.key === current ? "page" : undefined}
              >
                {tab.ml} · {tab.en}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
