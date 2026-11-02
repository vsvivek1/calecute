export type Domain = 'people' | 'process' | 'business';
export type Approach = 'predictive' | 'agile' | 'hybrid';

export interface Question {
  id: string;
  domain: Domain;
  topic: string;
  approach: Approach;
  difficulty: 1 | 2 | 3;
  stem: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const DOMAINS: { id: Domain; label: string; weight: number }[] = [
  // Exam weights from the PMP Examination Content Outline in force for
  // exams from July 2026. Check against pmi.org before advertising them.
  { id: 'people', label: 'People', weight: 0.33 },
  { id: 'process', label: 'Process', weight: 0.41 },
  { id: 'business', label: 'Business Environment', weight: 0.26 },
];

export const domainLabel = (d: Domain) =>
  DOMAINS.find((x) => x.id === d)?.label ?? d;
