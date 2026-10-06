/**
 * Shell for every inner QuizKerala page: masthead, a page heading band, the
 * body, and the footer. `path` marks the active menu item.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Masthead } from "./Masthead";
import { Footer } from "./Footer";

export function PageShell({
  path,
  title,
  intro,
  updated,
  children,
}: {
  path: string;
  title: string;
  intro?: ReactNode;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Masthead current={path} />
      <main id="main">
        <div className="page-head">
          <div className="wrap">
            <p className="crumbs">
              <Link href="/quizkerala">QuizKerala</Link> / {title}
            </p>
            <h1>{title}</h1>
            {intro && <p>{intro}</p>}
            {updated && <p className="legal-meta">Last updated {updated}</p>}
          </div>
        </div>
        <div className="wrap">{children}</div>
      </main>
      <Footer />
    </>
  );
}

/** A numbered section in a legal page. */
export function Clause({
  n,
  heading,
  children,
}: {
  n: number;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="clause">
      <h2>
        <span className="clause-n">{n}.</span>
        <span>{heading}</span>
      </h2>
      {children}
    </section>
  );
}
