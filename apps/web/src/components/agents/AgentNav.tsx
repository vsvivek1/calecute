/**
 * Navigation for the agent area.
 *
 * Sign-out is a real form POST, not a link: it changes state, and a link would
 * let a prefetcher or an image tag sign someone out.
 */

const TABS = [
  { key: "dashboard", href: "/agents/dashboard", label: "Dashboard" },
  { key: "products", href: "/agents/dashboard/products", label: "Products" },
  { key: "customers", href: "/agents/dashboard/customers", label: "Enrolments" },
  { key: "earnings", href: "/agents/dashboard/earnings", label: "Earnings" },
  { key: "profile", href: "/agents/dashboard/profile", label: "Profile" },
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
          <strong>Calecute Technologies</strong>
          <span>{email}</span>
        </span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="button secondary">
            <span>Sign out
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
                {tab.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
