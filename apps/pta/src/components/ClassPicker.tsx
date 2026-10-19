import Link from 'next/link';

import type { ClassRef } from '@/lib/types';

/** Tabs across the classes a teacher has. Hidden when there is only one. */
export default function ClassPicker({ classes, current, base }: { classes: ClassRef[]; current: string; base: string }) {
  if (classes.length < 2) return null;
  return (
    <nav className="tabs">
      {classes.map((c) => (
        <Link key={c.id} href={`${base}?class=${c.id}`} className={c.id === current ? 'on' : ''}>{c.name}</Link>
      ))}
    </nav>
  );
}
