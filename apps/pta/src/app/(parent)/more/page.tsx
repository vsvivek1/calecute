import Link from 'next/link';

import Icon from '@/components/Icon';
import { navFor } from '@/components/Shell';
import { lang } from '@/lib/session';

export const metadata = { title: 'More' };

export default async function More() {
  const items = navFor('parent', await lang());
  return (
    <>
      <h1>More</h1>
      <ul className="list card tight" style={{ marginTop: 12 }}>
        {items.map((i) => (
          <li key={i.href}>
            <span className="icon-chip"><Icon name={i.icon} /></span>
            <Link href={i.href} className="grow title">{i.label}</Link>
          </li>
        ))}
        <li>
          <form action="/auth/signout" method="post" className="grow">
            <button className="btn btn-ghost btn-sm">Sign out</button>
          </form>
        </li>
      </ul>
    </>
  );
}
