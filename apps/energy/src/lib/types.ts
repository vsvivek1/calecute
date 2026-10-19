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

export type Today = {
  date: string;
  review: Card[];
  new: Card[];
  doneToday: number;
  streak: number;
  progress: { paper: number; total: number; seen: number; mastered: number }[];
};

export type Flash = { id: string; paper: number; topic: string; question: string; answer: string };

export type Me = { signedIn: false } | { signedIn: true; enrolled: number[] };

export type User = {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
};
