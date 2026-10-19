'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Icon, { type IconName } from './Icon';

export type NavItem = { href: string; label: string; icon: IconName; count?: number; bottom?: boolean };

function active(path: string, href: string) {
  if (href === '/' || href === '/teach' || href === '/office') return path === href;
  return path === href || path.startsWith(`${href}/`);
}

export function SideNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="side-nav">
      {items.map((i) => {
        const on = active(path, i.href);
        return (
          <Link key={i.href} href={i.href} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>
            <Icon name={i.icon} />
            <span>{i.label}</span>
            {!!i.count && <span className="count">{i.count}</span>}
          </Link>
        );
      })}
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
      {shown.map((i) => {
        const on = active(path, i.href);
        return (
          <Link key={i.href} href={i.href} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>
            <span className="i"><Icon name={i.icon} size={22} />{!!i.count && <span className="dot-count" />}</span>
            <span className="lbl">{i.label}</span>
          </Link>
        );
      })}
      <Link href={more} className={inMore ? 'on' : ''}>
        <span className="i"><Icon name="menu" size={22} /></span>
        <span className="lbl">More</span>
      </Link>
    </nav>
  );
}
