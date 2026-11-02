'use client';

import QuestionCard from '../QuestionCard';
import RatingBar from './RatingBar';
import SpeakButton from './SpeakButton';
import type { CardUi } from '@/lib/feed';
import { RATINGS, type Rating } from '@/lib/engine/scheduler';
import type { Why } from '@/lib/engine/sitting';
import { rateSeconds, readSeconds } from '@/lib/engine/timing';
import { useForegroundTimer } from '@/lib/platform/timer';
import type { Question } from '@/lib/types';

const WHY: Record<Why, string> = {
  new: 'New',
  review: 'Review',
  again: 'Once more',
  honesty: 'Quick check',
  cram: 'Cram',
  win: 'Warm-up',
  bonus: 'Bonus',
};

/**
 * One question card. Read → pick → Check (unlocks after the reading time)
 * → explanation → rate (unlocks after the explanation time). Rating is the
 * only way forward.
 */
export default function StudyCard({
  q,
  ui,
  why,
  slow = 1,
  onPatch,
  onRate,
}: {
  q: Question;
  ui: CardUi;
  why: Why;
  slow?: number;
  onPatch: (p: Partial<CardUi>) => void;
  onRate: (r: Rating, correct: boolean, instant: boolean) => void;
}) {
  const readNeed = readSeconds(q, slow) * 1000;
  const rateNeed = rateSeconds(q, slow) * 1000;
  const readMs = useForegroundTimer(ui.readMs, !ui.revealed, (ms) => onPatch({ readMs: ms }));
  const rateMs = useForegroundTimer(ui.rateMs, ui.revealed, (ms) => onPatch({ rateMs: ms }));
  const correct = ui.chosen === q.answer;
  const readP = Math.min(1, readMs / readNeed);
  const rateP = Math.min(1, rateMs / rateNeed);

  const spoken = ui.revealed
    ? q.explanation
    : `${q.stem} ${ui.order.map((o, k) => `Option ${'ABCD'[k]}. ${q.options[o]}`).join('. ')}`;

  return (
    <div className="study-card">
      <div className="spread" style={{ marginBottom: 6 }}>
        <span className={`pill ${why === 'honesty' ? 'warn' : why === 'new' ? '' : 'good'}`}>{WHY[why]}</span>
        <SpeakButton text={spoken} />
      </div>
      <QuestionCard
        q={q}
        order={ui.order}
        chosen={ui.chosen}
        onChoose={ui.revealed ? undefined : (c) => onPatch({ chosen: c })}
        reveal={ui.revealed}
      />
      <div className="study-actions">
        {!ui.revealed ? (
          <button
            className="btn btn-primary btn-block ring"
            style={{ ['--p' as string]: readP }}
            disabled={ui.chosen === null || readP < 1}
            onClick={() => onPatch({ revealed: true, readMs })}
          >
            {ui.chosen === null ? 'Pick the best answer' : readP < 1 ? 'Take a moment…' : 'Check answer'}
          </button>
        ) : (
          <>
            <p className="muted fine" style={{ margin: '0 0 8px' }}>
              {correct ? 'How well did you know this?' : 'You picked a different answer. How tough was it?'}
            </p>
            <RatingBar
              progress={rateP}
              allowed={correct ? RATINGS.map((r) => r.id) : ['again', 'hard']}
              onRate={(r) => onRate(r, correct, rateMs - rateNeed < 1000)}
            />
          </>
        )}
      </div>
    </div>
  );
}
