import Link from "next/link";
import { GOLDLELAM } from "@/lib/goldlelam/content";

export function Masthead() {
  return (
    <header className="masthead">
      <Link href="/goldlelam" className="masthead-brand">
        <span className="mark" aria-hidden="true" />
        {GOLDLELAM.name}
      </Link>
      <nav aria-label="GoldLelam">
        <Link href="/goldlelam/support">Support</Link>
        <Link href="/goldlelam/privacy">Privacy</Link>
        <Link href="/goldlelam/terms">Terms</Link>
      </nav>
    </header>
  );
}
