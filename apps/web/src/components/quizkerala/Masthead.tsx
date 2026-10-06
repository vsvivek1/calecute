import Link from "next/link";
import { NAV, QUIZKERALA } from "@/lib/quizkerala/content";

/**
 * Sticky header with the site menu. Desktop shows the links inline; below
 * 60rem they fold into a <details> menu so it works without JavaScript.
 * `current` marks the active page for screen readers and styling.
 */
export function Masthead({ current }: { current?: string }) {
  const link = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      aria-current={current === href ? "page" : undefined}
    >
      {label}
    </Link>
  );

  return (
    <header className="masthead">
      <div className="wrap">
        <Link href="/quizkerala" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/quizkerala/logo.svg" alt="" width={36} height={36} />
          <span>
            Quiz<span className="accent">Kerala</span>
          </span>
        </Link>

        <nav className="nav-desktop" aria-label="QuizKerala">
          {NAV.map((n) => link(n.href, n.label))}
          <a className="btn btn-primary" href={QUIZKERALA.appUrl}>
            Play now
          </a>
        </nav>

        <details className="nav-mobile">
          <summary aria-label="Open menu">☰</summary>
          <nav className="menu" aria-label="QuizKerala">
            {NAV.map((n) => link(n.href, n.label))}
            <a className="btn btn-primary" href={QUIZKERALA.appUrl}>
              Play now
            </a>
          </nav>
        </details>
      </div>
    </header>
  );
}
