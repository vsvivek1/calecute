import Link from 'next/link';

import { chooseChild, setLang } from '@/app/actions';
import { translator, type Lang } from '@/lib/i18n';
import { adminSchool } from '@/lib/session';
import type { Child, Me } from '@/lib/types';
import BackField from './BackField';
import Icon from './Icon';
import { BottomNav, SideNav, type NavItem } from './Nav';

export type Mode = 'parent' | 'teach' | 'office';

export function navFor(mode: Mode, l: Lang, counts: Partial<Record<string, number>> = {}): NavItem[] {
  const t = translator(l);
  if (mode === 'teach') {
    return [
      { href: '/teach', label: 'Register', icon: 'clipboard', bottom: true },
      { href: '/teach/homework', label: 'Homework', icon: 'book', bottom: true },
      { href: '/teach/marks', label: 'Marks', icon: 'chart', bottom: true },
      { href: '/teach/quizzes', label: 'Quizzes', icon: 'bulb', bottom: true },
      { href: '/teach/tests', label: 'Sample tests', icon: 'file' },
      { href: '/teach/notices', label: 'Notices & activities', icon: 'megaphone' },
    ];
  }
  if (mode === 'office') {
    return [
      { href: '/office', label: 'Dashboard', icon: 'grid', bottom: true },
      { href: '/office/fees', label: 'Fees', icon: 'wallet', bottom: true },
      { href: '/office/complaints', label: 'Complaints', icon: 'chat', bottom: true, count: counts.complaints },
      { href: '/office/students', label: 'Students & staff', icon: 'users', bottom: true },
      { href: '/office/notices', label: 'Notices & activities', icon: 'megaphone' },
    ];
  }
  return [
    { href: '/', label: t('Today'), icon: 'sun', bottom: true },
    { href: '/homework', label: t('Homework'), icon: 'book', bottom: true },
    { href: '/attendance', label: t('Attendance'), icon: 'calendar' },
    { href: '/fees', label: t('Fees'), icon: 'wallet', bottom: true },
    { href: '/grades', label: t('Grades'), icon: 'chart', bottom: true },
    { href: '/activities', label: t('Activities'), icon: 'sparkles' },
    { href: '/quizzes', label: t('Quizzes'), icon: 'bulb', count: counts.quizzes },
    { href: '/tests', label: t('Sample tests'), icon: 'file' },
    { href: '/notices', label: t('Notices'), icon: 'megaphone', count: counts.notices },
    { href: '/complaints', label: t('Complaints'), icon: 'chat' },
  ];
}

export default function Shell({
  me, mode, lang, child, counts, children,
}: {
  me: Me; mode: Mode; lang: Lang; child?: Child | null;
  counts?: Partial<Record<string, number>>; children: React.ReactNode;
}) {
  const t = translator(lang);
  const items = navFor(mode, lang, counts);
  const admin = adminSchool(me);
  const school = child?.school ?? me.staff[0]?.school ?? 'Calecutech PTA';
  const modes: { key: Mode; href: string; label: string }[] = [];
  if (me.children.length) modes.push({ key: 'parent', href: '/', label: t('Parent') });
  if (me.classes.length) modes.push({ key: 'teach', href: '/teach', label: t('Teacher') });
  if (admin) modes.push({ key: 'office', href: '/office', label: t('Office') });

  const home = modes.find((m) => m.key === mode)?.href ?? '/';
  const langButton = (
    <form action={setLang}>
      <BackField />
      <button className="btn btn-ghost btn-sm btn-icon" name="lang" value={lang === 'ml' ? 'en' : 'ml'}
        title={lang === 'ml' ? 'Switch to English' : 'മലയാളത്തിലേക്ക് മാറുക'}>
        <Icon name="globe" size={16} />
        {lang === 'ml' ? 'English' : 'മലയാളം'}
      </button>
    </form>
  );

  return (
    <div className="app">
      <aside className="side">
        <Link href={home} className="brand">
          <Logo />
          <span className="brand-text">
            <strong>{school}</strong>
            <small>Parent–Teacher Association</small>
          </span>
        </Link>
        <SideNav items={items} />
        <div className="side-foot">
          <div className="me">
            <span className="avatar" aria-hidden>{me.email.slice(0, 1).toUpperCase()}</span>
            <span className="me-mail" title={me.email}>{me.email}</span>
          </div>
          <div className="row">
            {langButton}
            <form action="/auth/signout" method="post">
              <button className="btn btn-ghost btn-sm btn-icon" type="submit" title={t('Sign out')}>
                <Icon name="logout" size={16} />
                {t('Sign out')}
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="content">
        <header className="top">
          <Link href={home} className="brand show-sm">
            <Logo />
            <span className="brand-text"><strong>{school}</strong></span>
          </Link>

          {mode === 'parent' && me.children.length > 1 && (
            <form action={chooseChild} className="kids" aria-label="Choose child">
              <BackField />
              {me.children.map((c) => (
                <button key={c.id} name="child" value={c.id} className={c.id === child?.id ? 'on' : ''}>
                  <span className="kid-dot" aria-hidden>{c.name.slice(0, 1)}</span>
                  {c.name.split(' ')[0]}
                  <span className="kid-class">{c.class}</span>
                </button>
              ))}
            </form>
          )}

          <span className="spacer" />

          {modes.length > 1 && (
            <nav className="modes" aria-label="Switch view">
              {modes.map((m) => (
                <Link key={m.key} href={m.href} className={m.key === mode ? 'on' : ''}>{m.label}</Link>
              ))}
            </nav>
          )}

          <div className="show-sm">{langButton}</div>
        </header>

        <main>{children}</main>
      </div>
      <BottomNav items={items} more={mode === 'parent' ? '/more' : mode === 'teach' ? '/teach/more' : '/office/more'} />
    </div>
  );
}

/** The app mark: a rounded tile with an open book. */
export function Logo() {
  return (
    <span className="logo" aria-hidden>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 7v13M12 7c-1.6-1.4-4-2-7-2v12c3 0 5.4.6 7 2 1.6-1.4 4-2 7-2V5c-3 0-5.4.6-7 2Z" />
      </svg>
    </span>
  );
}
