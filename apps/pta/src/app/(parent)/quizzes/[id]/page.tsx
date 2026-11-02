import { notFound } from 'next/navigation';

import { submitQuiz } from '@/app/actions';
import BackField from '@/components/BackField';
import Flash from '@/components/Flash';
import { translator } from '@/lib/i18n';
import { rpc } from '@/lib/rpc';
import { lang, requireChild } from '@/lib/session';
import type { Quiz, QuizReview } from '@/lib/types';

export const metadata = { title: 'Quiz' };

export default async function QuizPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { child } = await requireChild();
  const t = translator(await lang());
  const [quiz, review] = await Promise.all([
    rpc<Quiz | null>('quiz', { p_quiz: id }),
    rpc<QuizReview | null>('quiz_review', { p_quiz: id, p_student: child.id }),
  ]);
  if (!quiz) notFound();

  return (
    <>
      <Flash searchParams={searchParams} />
      <span className="pill blue">{quiz.subject}</span>
      <h1>{quiz.title}</h1>
      {review ? (
        <p className="sub">
          {child.name.split(' ')[0]} scored <strong>{review.score} of {review.total}</strong>. Correct answers are in green.
        </p>
      ) : (
        <p className="sub">{quiz.questions.length} questions. Let {child.name.split(' ')[0]} answer on their own; it is marked as soon as you submit.</p>
      )}

      <form action={submitQuiz} className="card">
        <BackField />
        <input type="hidden" name="quiz" value={quiz.id} />
        <input type="hidden" name="student" value={child.id} />
        <input type="hidden" name="count" value={quiz.questions.length} />
        {quiz.questions.map((q) => (
          <fieldset key={q.id} className="q" style={{ border: 0, padding: 0, margin: '0 0 18px' }}>
            <legend style={{ fontWeight: 650, marginBottom: 8 }}>{q.position}. {q.prompt}</legend>
            {q.options.map((o, i) => {
              const cls = review
                ? i === review.correct[q.position - 1] ? 'right' : i === review.answers[q.position - 1] ? 'wrong' : ''
                : '';
              return (
                <label key={i} className={`opt ${cls}`}>
                  <input type="radio" name={`q${q.position}`} value={i} required disabled={!!review}
                    defaultChecked={review?.answers[q.position - 1] === i} />
                  {o}
                </label>
              );
            })}
          </fieldset>
        ))}
        {!review && <button className="btn btn-primary">{t('Submit')}</button>}
      </form>
    </>
  );
}
