'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { API } from './env';
import type { Question } from './types';
import sample from '@/data/sample.json';

// The licence key and the cached question bank, in localStorage on the
// learner's own device. Study progress lives in ./feed.ts. No account, no
// server-side profile.

const K = {
  license: 'pmp.license',
  email: 'pmp.email',
  bank: 'pmp.bank',
};

export const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const listeners = new Set<() => void>();
export const notify = () => listeners.forEach((l) => l());
export const subscribe = (l: () => void) => {
  listeners.add(l);
  window.addEventListener('storage', l);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', l);
  };
};

// ---- licence -------------------------------------------------------------

const licenseSnap = () => {
  try {
    return localStorage.getItem(K.license);
  } catch {
    return null;
  }
};

export function useLicense() {
  const license = useSyncExternalStore(subscribe, licenseSnap, () => null);
  return license;
}

export function saveLicense(license: string, email?: string) {
  try {
    localStorage.setItem(K.license, license);
    if (email) localStorage.setItem(K.email, email);
  } catch {}
  listeners.forEach((l) => l());
}

export function clearLicense() {
  try {
    localStorage.removeItem(K.license);
    localStorage.removeItem(K.bank);
  } catch {}
  listeners.forEach((l) => l());
}

export const savedEmail = () => {
  try {
    return localStorage.getItem(K.email);
  } catch {
    return null;
  }
};

// ---- question bank -------------------------------------------------------

export const SAMPLE = sample as Question[];

type BankState =
  | { status: 'loading'; questions: Question[]; full: false }
  | { status: 'sample'; questions: Question[]; full: false }
  | { status: 'full'; questions: Question[]; full: true }
  | { status: 'error'; questions: Question[]; full: false; error: string };

/**
 * The full bank for licence holders (fetched once, then served from cache so
 * study works offline), the free sample for everyone else.
 */
export function useBank(): BankState & { reload: () => void } {
  const license = useLicense();
  const [state, setState] = useState<BankState>({ status: 'loading', questions: [], full: false });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!license) {
      setState({ status: 'sample', questions: SAMPLE, full: false });
      return;
    }
    const cached = read<{ questions: Question[] } | null>(K.bank, null);
    if (cached?.questions?.length) setState({ status: 'full', questions: cached.questions, full: true });

    let cancelled = false;
    fetch(`${API}/api/bank`, { headers: { Authorization: `Bearer ${license}` } })
      .then(async (r) => {
        if (r.status === 401) throw new Error('This licence key is not valid.');
        if (!r.ok) throw new Error('Could not load the question bank.');
        return r.json() as Promise<{ questions: Question[]; version: number }>;
      })
      .then((data) => {
        if (cancelled) return;
        try {
          localStorage.setItem(K.bank, JSON.stringify(data));
        } catch {}
        setState({ status: 'full', questions: data.questions, full: true });
      })
      .catch((e: Error) => {
        if (cancelled || cached?.questions?.length) return; // offline: keep the cache
        setState({ status: 'error', questions: SAMPLE, full: false, error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [license, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { error?: string }).error ?? 'Something went wrong.');
  return data as T;
}
