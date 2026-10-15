import Link from 'next/link';

import { day } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { rpc } from '@/lib/rpc';
import { lang, requireChild } from '@/lib/session';
import type { QuizListItem } from '@/lib/types';

export const metadata = { title: 'Quizzes' };

export default async function Quizzes() {
  const { child } = await requireChild();
  const t = translator(await lang());
  const list = await rpc<QuizListItem[]>('child_quizzes', { p_student: child.id });
  return (
    <>
      <h1>{t('Quizzes')}</h1>
      <p className="sub">Short practice quizzes from {child.class} teachers. Marked instantly, one attempt each.</p>
      <div className="card tight">
        <ul className="list">
          {list.map((q) => (
            <li key={q.id}>
              <span className="pill blue">{q.subject}</span>
              <span className="grow">
                <span className="title">{q.title}</span>
                <br />
                <span className="small muted">{q.questions} questions{q.due_date && ` · by ${day(q.due_date)}`}</span>
              </span>
              {q.submitted_at ? (
                <Link href={`/quizzes/${q.id}`} className="pill green">{q.score} / {q.total}</Link>
              ) : (
                <Link href={`/quizzes/${q.id}`} className="btn btn-primary btn-sm">{t('Start quiz')}</Link>
              )}
            </li>
          ))}
          {list.length === 0 && <li className="empty">No quizzes yet.</li>}
        </ul>
      </div>
    </>
  );
}
