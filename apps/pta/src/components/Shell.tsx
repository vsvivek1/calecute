import Link from 'next/link';

import { chooseChild, setLang } from '@/app/actions';
import { translator, type Lang } from '@/lib/i18n';
import { adminSchool } from '@/lib/session';
import type { Child, Me } from '@/lib/types';
import BackField from './BackField';
import { BottomNav, SideNav, type NavItem } from './Nav';

export type Mode = 'parent' | 'teach' | 'office';

export function navFor(mode: Mode, l: Lang, counts: Partial<Record<string, number>> = {}): NavItem[] {
  const t = translator(l);
  if (mode === 'teach') {
    return [
      { href: '/teach', label: 'Register', icon: '✓', bottom: true },
      { href: '/teach/homework', label: 'Homework', icon: '✎', bottom: true },
      { href: '/teach/marks', label: 'Marks', icon: '▦', bottom: true },
      { href: '/teach/quizzes', label: 'Quizzes', icon: '?', bottom: true },
      { href: '/teach/tests', label: 'Sample tests', icon: '▤' },
      { href: '/teach/notices', label: 'Notices & activities', icon: '✉' },
    ];
  }
  if (mode === 'office') {
    return [
      { href: '/office', label: 'Dashboard', icon: '◎', bottom: true },
      { href: '/office/fees', label: 'Fees', icon: '₹', bottom: true },
      { href: '/office/complaints', label: 'Complaints', icon: '!', bottom: true, count: counts.complaints },
      { href: '/office/students', label: 'Students & staff', icon: '☺', bottom: true },
      { href: '/office/notices', label: 'Notices & activities', icon: '✉' },
    ];
  }
  return [
    { href: '/', label: t('Today'), icon: '☀', bottom: true },
    { href: '/homework', label: t('Homework'), icon: '✎', bottom: true },
    { href: '/attendance', label: t('Attendance'), icon: '✓' },
    { href: '/fees', label: t('Fees'), icon: '₹', bottom: true },
    { href: '/grades', label: t('Grades'), icon: '▦', bottom: true },
    { href: '/activities', label: t('Activities'), icon: '★' },
    { href: '/quizzes', label: t('Quizzes'), icon: '?', count: counts.quizzes },
    { href: '/tests', label: t('Sample tests'), icon: '▤' },
    { href: '/notices', label: t('Notices'), icon: '✉', count: counts.notices },
    { href: '/complaints', label: t('Complaints'), icon: '!' },
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

  return (
    <>
      <header className="top">
        <Link href={modes.find((m) => m.key === mode)?.href ?? '/'} className="brand">
          <span className="dot">P</span>
          <span>
            {school}
            <small className="hide-sm"> · PTA</small>
          </span>
        </Link>

        {mode === 'parent' && me.children.length > 1 && (
          <form action={chooseChild} className="kids">
            <BackField />
            {me.children.map((c) => (
              <button key={c.id} name="child" value={c.id} className={c.id === child?.id ? 'on' : ''}>
                {c.name.split(' ')[0]}
                <span className="hide-sm"> · {c.class}</span>
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

        <form action={setLang}>
          <BackField />
          <button className="btn btn-ghost btn-sm" name="lang" value={lang === 'ml' ? 'en' : 'ml'}
            title={lang === 'ml' ? 'Switch to English' : 'മലയാളത്തിലേക്ക് മാറുക'}>
            {lang === 'ml' ? 'English' : 'മലയാളം'}
          </button>
        </form>
        <form action="/auth/signout" method="post" className="hide-sm">
          <button className="btn btn-ghost btn-sm" type="submit">{t('Sign out')}</button>
        </form>
      </header>

      <div className="layout">
        <SideNav items={items} />
        <main>{children}</main>
      </div>
      <BottomNav items={items} more={mode === 'parent' ? '/more' : mode === 'teach' ? '/teach/more' : '/office/more'} />
    </>
  );
}
