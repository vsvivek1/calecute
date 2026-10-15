'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavItem = { href: string; label: string; icon: string; count?: number; bottom?: boolean };

function active(path: string, href: string) {
  if (href === '/' || href === '/teach' || href === '/office') return path === href;
  return path === href || path.startsWith(`${href}/`);
}

export function SideNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="side">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={active(path, i.href) ? 'on' : ''}>
          <span aria-hidden>{i.icon}</span>
          {i.label}
          {!!i.count && <span className="count">{i.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** Phone tab bar: the four things a parent checks daily, and everything else. */
export function BottomNav({ items, more }: { items: NavItem[]; more: string }) {
  const path = usePathname();
  const shown = items.filter((i) => i.bottom);
  const inMore = !shown.some((i) => active(path, i.href));
  return (
    <nav className="bottom">
      {shown.map((i) => (
        <Link key={i.href} href={i.href} className={active(path, i.href) ? 'on' : ''}>
          <span className="i" aria-hidden>{i.icon}</span>
          {i.label}
        </Link>
      ))}
      <Link href={more} className={inMore ? 'on' : ''}>
        <span className="i" aria-hidden>☰</span>
        More
      </Link>
    </nav>
  );
}
