import 'server-only';

import { cache } from 'react';

import { rpc } from './rpc';
import type { OfficeToday, Today } from './types';

// Calls that both a layout and its page make, deduplicated per request.
export const childToday = cache((id: string) => rpc<Today | null>('child_today', { p_student: id }));
export const officeToday = cache((school: string) => rpc<OfficeToday | null>('office_today', { p_school: school }));
