export type Paper = {
  id: number;
  code: string;
  name: string;
  short: string;
  facts: number;
  problems: number;
};

export type Step = { prompt: string; answer: string; explain?: string };

export type Card = {
  id: string;
  paper: number;
  topic: string;
  kind: 'fact' | 'problem';
  front: string;
  back: string;
  explain: string | null;
  steps: Step[];
  source: string | null;
  mode: 'review' | 'new';
};

/** A card as the feed shows it: learn view the first time, recall view after. */
export type FeedCard = Card & { view: 'learn' | 'recall'; flash: boolean; stillTough: boolean };

export type Mode = 'learn' | 'revision' | 'cram' | 'exam' | 'after';
export type SittingKind = 'quota' | 'bonus' | 'cram' | 'exam';

export type Exam = {
  name: string;
  date: string;
  official: string;
  status: 'official' | 'estimated';
  source: string;
  mine: boolean;
  daysLeft: number;
};

/** Everything the daily feed shows (public.em_feed). */
export type Feed = {
  date: string;
  mode: Mode;
  behind: boolean;
  quota: { total: number; done: number; complete: boolean };
  openSitting: number | null;
  next: { kind: SittingKind | null; opensAt: string | null; openNow?: boolean; number?: number };
  quietNow: boolean;
  exam: Exam;
  settings: { studyTimes: string[]; minutesPerDay: number; examDate: string | null };
  sitting: { id: number; kind: SittingKind; pos: number; cards: FeedCard[] } | null;
  streak: number;
  tough: { becameEasy: number; stillTough: number };
  progress: { paper: number; total: number; seen: number; strong: number }[];
};

export type Flash = { id: string; paper: number; topic: string; question: string; answer: string };

export type Me = { signedIn: false } | { signedIn: true; enrolled: number[] };

export type User = {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
};
