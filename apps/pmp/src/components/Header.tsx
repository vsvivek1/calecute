'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IS_APP } from '@/lib/env';
import { useLicense } from '@/lib/store';

export default function Header() {
  const license = useLicense();
  const path = usePathname() ?? '';
  const inApp = path.startsWith('/study');
  return (
    <header className="top">
      <div className="wrap">
        <Link href={IS_APP || inApp ? '/study' : '/'} className="logo">
          <span className="logo-mark">PMP</span>
          <span>
            PMP Prep
            <small>by Calecutech</small>
          </span>
        </Link>
        <nav className="nav">
          {inApp ? (
            // In the study app the bar holds the plan and the profile.
            license && (
              <>
              <Link href="/study/plan" className="icon-btn" aria-label="Study plan" title="Study plan">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </svg>
              </Link>
              <Link href="/study/profile" className="icon-btn" aria-label="Profile" title="Profile">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </Link>
              </>
            )
          ) : (
            <>
              {!IS_APP && (
                <>
                  <Link href="/#features" className="hide-sm">How it works</Link>
                  <Link href="/#pricing" className="hide-sm">Pricing</Link>
                </>
              )}
              {license ? (
                <Link href="/study" className="btn btn-primary btn-sm">Study</Link>
              ) : (
                <>
                  <Link href="/unlock">Sign in</Link>
                  <Link href="/sample" className="btn btn-primary btn-sm">Free sitting</Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
