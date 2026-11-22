"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  // A task page counts as "Schedule"; "Assign" only lights up on its own page.
  const active = (href: string) =>
    path === href ||
    (href === "/office/tasks" && path.startsWith("/office/tasks/") && path !== "/office/tasks/new");
  return (
    <nav aria-label="Office" className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
      <ul className="flex gap-1 pb-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={`block whitespace-nowrap rounded-full px-3 py-1.5 ${
                active(l.href) ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
