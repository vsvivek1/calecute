'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';
import type { Feed as FeedT, FeedCard, Flash, Paper } from '@/lib/types';
import { clearTimers, istDay, istTime, store } from '@/lib/timing';
import CardScreen from './CardScreen';
import FlashBanner from './FlashBanner';
import Alerts, { AlertsToggle, notify } from './Alerts';

const MODE_NOTE: Record<string, string> = {
  revision: 'Revision weeks: mostly revision now, plus the most-asked facts you have not seen yet.',
  cram: 'Cram mode: the last two days before the exam. Tough cards and the most-asked facts come back. Short breaks between sittings. Sleep well tonight; sleep locks in what you learnt.',
  exam: 'Exam day. Ten easy cards to warm up, then go and do well.',
  after: 'Your exam date has passed. How did it go? Set your next exam date in your profile and Recallio will plan again.',
};

/**
 * The daily feed: the only menu. A header with today's quota and the next
 * sitting, then either the current card or a calm "next sitting at…" screen.
 * The engine picks every card; the learner only rates.
 */
export default function Feed({
  initial,
  catalog,
  flash,
  invite,
  name,
}: {
  initial: FeedT;
  catalog: Paper[];
  flash: Flash[];
  invite: boolean;
  name: string | null;
}) {
  const paperName = useMemo(
    () => Object.fromEntries(catalog.map((p) => [p.id, `Paper ${p.id} · ${p.short}`])),
    [catalog],
  );
  const [feed, setFeed] = useState(initial);
  const [cards, setCards] = useState<FeedCard[]>(initial.sitting?.cards ?? []);
  const [pos, setPos] = useState(initial.sitting?.pos ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const sitting = feed.sitting;
  // Cards in the sitting as built; anything after is a "Didn't get it" repeat.
  const baseLen = feed.sitting?.cards.length ?? 0;
  const card = sitting ? cards[pos] : undefined;

  const load = useCallback((f: FeedT) => {
    setFeed(f);
    setCards(f.sitting?.cards ?? []);
    setPos(f.sitting?.pos ?? 0);
  }, []);

  const refresh = useCallback(async () => {
    const { data, error } = await browserClient().rpc('em_feed');
    if (error) setError(error.message);
    else load(data as FeedT);
  }, [load]);

  // Coming back to the tab: pick up changes made on another device.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && !sitting) refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    const t = setInterval(() => !sitting && refresh(), 5 * 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(t);
    };
  }, [sitting, refresh]);

  // Inside a sitting the back button never leaves the card.
  useEffect(() => {
    if (!sitting) return;
    history.pushState({ sitting: sitting.id }, '');
    const onPop = () => {
      history.pushState({ sitting: sitting.id }, '');
      setToast('Your sitting is saved. Come back anytime.');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [sitting]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // "Quota complete" once a day.
  useEffect(() => {
    if (feed.quota.complete && feed.quota.total > 0 && store('em-quota-done') !== istDay()) {
      store('em-quota-done', istDay());
      notify('✅ Quota complete', `Today ${feed.quota.done}/${feed.quota.total}. Well done.`, 'em-quota');
    }
  }, [feed.quota]);

  async function start() {
    setBusy(true);
    setError(null);
    const { data, error } = await browserClient().rpc('em_start_sitting');
    setBusy(false);
    if (error) {
      setError(error.message);
      refresh();
      return;
    }
    store('em-last-start', String(Date.now()));
    load(data as FeedT);
  }

  async function rate(r: number, seconds: number): Promise<boolean> {
    if (!sitting || !card) return false;
    setError(null);
    const { data, error } = await browserClient().rpc('em_rate', {
      p_sitting: sitting.id,
      p_card: card.id,
      p_rating: r,
      p_seconds: seconds,
    });
    if (error) {
      setError(error.message);
      return false;
    }
    const res = data as { pos: number; cards: string[]; finished: boolean };
    // Keep the header count live; the server total comes back after the sitting.
    if (sitting.kind !== 'bonus' && pos < baseLen) {
      setFeed((f) => ({ ...f, quota: { ...f.quota, done: Math.min(f.quota.total, f.quota.done + 1) } }));
    }
    // "Didn't get it" adds the card once more at the end, now as a recall card.
    if (res.cards.length > cards.length) {
      const extra = res.cards.slice(cards.length).map(
        (id) => ({ ...(cards.find((c) => c.id === id) as FeedCard), view: 'recall', mode: 'review' }) as FeedCard,
      );
      setCards((c) => [...c, ...extra]);
    }
    return true;
  }

  async function next() {
    if (!sitting) return;
    const n = pos + 1;
    if (n >= cards.length) {
      clearTimers(`em-t-${sitting.id}-`);
      await refresh();
    } else {
      setPos(n);
    }
  }

  const q = feed.quota;
  const exam = feed.exam;

  return (
    <>
      <Alerts
        studyTimes={feed.settings.studyTimes}
        flash={flash}
        sittingOpen={Boolean(sitting)}
        quotaLeft={q.complete ? 0 : Math.max(0, q.total - q.done)}
      />
      <header className="feedhead">
        <span className="quota" title="Today's quota">
          <Ring done={q.done} total={q.total} />
          <b>
            Today {q.done}/{q.total}
          </b>
        </span>
        {!sitting && feed.next.opensAt && (
          <span>{feed.next.kind ? (feed.next.openNow ? 'Next set ready' : `Next ${istTime(feed.next.opensAt)}`) : `Tomorrow ${istTime(feed.next.opensAt)}`}</span>
        )}
        {sitting && (
          <span>
            Card {Math.min(pos + 1, cards.length)} of {cards.length}
          </span>
        )}
        <span className="spacer" />
        {feed.streak > 0 && <span title="Days in a row">🔥 {feed.streak}</span>}
        <span title={exam.source}>
          {exam.daysLeft > 0 ? `Exam in ${exam.daysLeft} days` : exam.daysLeft === 0 ? 'Exam today' : 'Exam over'}
          {exam.status === 'estimated' && !exam.mine ? ' (est.)' : ''}
        </span>
      </header>
      {sitting && (
        <div className="sbar" aria-hidden>
          <span style={{ width: `${(100 * pos) / Math.max(1, cards.length)}%` }} />
        </div>
      )}

      {error && <div className="err">{error}</div>}
      {toast && <div className="toast">{toast}</div>}

      {sitting && card ? (
        <CardScreen
          key={`${sitting.id}-${pos}`}
          card={card}
          timerKey={`em-t-${sitting.id}-${pos}`}
          paper={paperName[card.paper]}
          onRate={rate}
          onNext={next}
        />
      ) : (
        <Between
          feed={feed}
          name={name}
          busy={busy}
          onStart={start}
          invite={invite}
          flash={flash}
          paperName={paperName}
        />
      )}
    </>
  );
}

function Between({
  feed,
  name,
  busy,
  onStart,
  invite,
  flash,
  paperName,
}: {
  feed: FeedT;
  name: string | null;
  busy: boolean;
  onStart: () => void;
  invite: boolean;
  flash: Flash[];
  paperName: Record<number, string>;
}) {
  const first = name ? name.split(' ')[0] : null;
  const n = feed.next;
  const q = feed.quota;
  const left = Math.max(0, q.total - q.done);
  const sittingCards = Math.min(10, left || 10);
  const minutes = Math.max(3, Math.round(sittingCards * 0.6));

  let title: string;
  let sub: string;
  if (n.kind === 'bonus') {
    title = 'Quota complete ✅';
    sub = n.openNow
      ? 'Want more? A bonus set is ready: revision due soon plus a few new cards.'
      : `Want more? The next set opens at ${istTime(n.opensAt)}. A gap makes the next recall stronger.`;
  } else if (n.kind) {
    title = n.number === 1 ? `Good ${greeting()}${first ? `, ${first}` : ''}` : `Sitting ${n.number}`;
    sub = n.openNow
      ? `About ${sittingCards} cards, ${minutes} minutes. ${left} left today.`
      : `Your next sitting opens at ${istTime(n.opensAt)}. ${left} cards left today.`;
  } else if (q.complete) {
    title = 'Quota complete ✅';
    sub = `That's all for today. Next sitting tomorrow at ${istTime(n.opensAt)}.`;
  } else {
    title = 'All done for now';
    sub = `Next sitting tomorrow at ${istTime(n.opensAt)}.`;
  }

  return (
    <>
      <h1>{title}</h1>
      <p className="sub">{sub}</p>
      {MODE_NOTE[feed.mode] && <p className="note card">{MODE_NOTE[feed.mode]}</p>}
      {feed.behind && (
        <p className="note card">
          Today&apos;s plan is bigger than your study time, so Recallio dropped some new cards. Add a study time or
          more minutes in your profile to stay on plan.
        </p>
      )}
      {n.kind && n.openNow && (
        <button className="btn btn-primary btn-lg" disabled={busy} onClick={onStart}>
          {busy ? 'Getting cards…' : n.kind === 'bonus' ? 'Start bonus set' : 'Start'}
        </button>
      )}

      {q.complete && invite && (
        <a className="invite-strip" href="/invite">
          🎁 Invite friends &amp; get rewards <span>Invite now →</span>
        </a>
      )}
      <AlertsToggle compact />
      <FlashBanner flash={flash} />

      <section className="progress">
        <h2>Your papers</h2>
        {(feed.tough.becameEasy > 0 || feed.tough.stillTough > 0) && (
          <p className="note">
            {feed.tough.becameEasy > 0 && <>✅ {feed.tough.becameEasy} became easy. </>}
            {feed.tough.stillTough > 0 && <>⚠️ {feed.tough.stillTough} still tough; Recallio will bring them back sooner.</>}
          </p>
        )}
        {feed.progress.map((p) => {
          const seen = p.total ? Math.round((100 * p.seen) / p.total) : 0;
          const strong = p.total ? Math.round((100 * p.strong) / p.total) : 0;
          return (
            <div className="card mini" key={p.paper}>
              <p className="pname">{paperName[p.paper]}</p>
              <div className="bar2" aria-label={`${seen}% started, ${strong}% strong`}>
                <span className="seen" style={{ width: `${seen}%` }} />
                <span className="mastered" style={{ width: `${strong}%` }} />
              </div>
              <p className="pmeta">
                {p.seen} of {p.total} started · {p.strong} strong
              </p>
            </div>
          );
        })}
      </section>
    </>
  );
}

function greeting() {
  const h = (new Date().getUTCHours() + 5.5) % 24;
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

function Ring({ done, total }: { done: number; total: number }) {
  const f = total ? Math.min(1, done / total) : 0;
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r={r} fill="none" stroke="var(--line)" strokeWidth="3" />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="var(--leaf)"
        strokeWidth="3"
        strokeDasharray={`${c * f} ${c}`}
        transform="rotate(-90 12 12)"
        strokeLinecap="round"
      />
    </svg>
  );
}
