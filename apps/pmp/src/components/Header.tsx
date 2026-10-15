'use client';

import Link from 'next/link';
import { IS_APP } from '@/lib/env';
import { useLicense } from '@/lib/store';

export default function Header() {
  const license = useLicense();
  return (
    <header className="top">
      <div className="wrap">
        <Link href={IS_APP ? '/study' : '/'} className="logo">
          <span className="logo-mark">PMP</span>
          <span>
            PMP Prep
            <small>by Calecutech</small>
          </span>
        </Link>
        <nav className="nav">
          {!IS_APP && (
            <>
              <Link href="/#features" className="hide-sm">Features</Link>
              <Link href="/#pricing" className="hide-sm">Pricing</Link>
            </>
          )}
          {license ? (
            <Link href="/study" className="btn btn-primary btn-sm">Study</Link>
          ) : (
            <>
              <Link href="/unlock">Sign in</Link>
              <Link href="/sample" className="btn btn-primary btn-sm">Free test</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
