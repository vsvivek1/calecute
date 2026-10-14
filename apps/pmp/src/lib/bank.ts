import 'server-only';
import type { Question } from './types';
import people from '@/data/questions/people.json';
import process_ from '@/data/questions/process.json';
import business from '@/data/questions/business.json';

// The full bank is server-only: it is served to licence holders by
// /api/bank and never bundled into the client. The free sample lives in
// src/data/sample.json, generated from this by scripts/build-sample.mjs.
export const BANK = [...people, ...process_, ...business] as Question[];
