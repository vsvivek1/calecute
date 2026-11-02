'use client';

import { usePathname } from 'next/navigation';

/** Tells an action which page to return to. */
export default function BackField() {
  return <input type="hidden" name="back" value={usePathname()} />;
}
