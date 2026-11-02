'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { IS_APP } from '@/lib/env';
import { getLoop } from '@/lib/feed';

/**
 * Android only: the back button never leaves a card. Inside a sitting it
 * does nothing; on the feed it sends the app to the background; elsewhere it
 * goes back a page.
 */
export default function AppShell() {
  const path = usePathname() ?? '';
  const router = useRouter();
  const where = useRef(path);
  where.current = path;

  useEffect(() => {
    if (!IS_APP) return;
    let remove: (() => void) | undefined;
    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', () => {
        const p = where.current.replace(/\/$/, '');
        if (p === '/study' || p === '') {
          if (!getLoop().sitting) App.minimizeApp();
          return;
        }
        if (p === '/sample') return; // the free sitting can't be skipped either
        router.back();
      }).then((h) => (remove = () => h.remove()));
    });
    return () => remove?.();
  }, [router]);

  return null;
}
