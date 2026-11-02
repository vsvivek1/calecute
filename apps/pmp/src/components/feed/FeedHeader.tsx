'use client';

import type { DayRec } from '@/lib/feed';

export const clock = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** Quota, time left, next sitting and exam countdown: always in view. */
export default function FeedHeader({ day, next, streak, hasExam }: { day: DayRec | null; next: Date | null; streak: number; hasExam: boolean }) {
  if (!day) return null;
  const { plan } = day;
  const left = Math.max(0, plan.quota - day.done);
  const pct = plan.quota ? Math.min(1, day.done / plan.quota) : 1;
  return (
    <div className="feed-head">
      <div className="quota-ring" style={{ ['--p' as string]: pct }} aria-label={`Today ${day.done} of ${plan.quota}`}>
        <span>{day.done}<small>/{plan.quota}</small></span>
      </div>
      <div className="feed-head-text">
        <b>
          {plan.phase === 'cram' ? 'Cram mode' : plan.phase === 'examDay' ? 'Exam day' : left ? `Today ${day.done}/${plan.quota}` : 'Quota complete'}
        </b>
        <span className="muted fine">
          {left ? `about ${Math.ceil(left * 1.2)} min left` : 'nice work'}
          {next ? ` · next ${clock(next)}` : ''}
          {hasExam && plan.phase !== 'examDay' && plan.daysLeft >= 0 ? ` · ${plan.daysLeft} days to exam` : ''}
          {streak > 1 ? ` · ${streak}-day streak` : ''}
        </span>
      </div>
    </div>
  );
}
