import 'server-only';

import type { ClassRef, Me } from './types';

/** The class a teacher is working on: ?class= if they teach it, else their first. */
export function pickClass(me: Me, wanted?: string): ClassRef {
  return me.classes.find((c) => c.id === wanted) ?? me.classes[0];
}
