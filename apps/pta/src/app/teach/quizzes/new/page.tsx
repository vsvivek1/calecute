import { createQuiz } from '@/app/actions';
import Flash from '@/components/Flash';
import { todayIST } from '@/lib/format';
import { requireTeacher } from '@/lib/session';
import { pickClass } from '@/lib/teach';

export const metadata = { title: 'New quiz' };

export default async function NewQuiz({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireTeacher();
  const k = pickClass(me, (await searchParams).class);
  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>New quiz for {k.name}</h1>
      <p className="sub">Up to 10 questions. Fill in two to four options and pick the right one. Empty questions are skipped.</p>
      <form action={createQuiz}>
        <input type="hidden" name="class" value={k.id} />
        <div className="card fields">
          <div className="field"><label htmlFor="subject">Subject</label><input id="subject" name="subject" required /></div>
          <div className="field"><label htmlFor="title">Title</label><input id="title" name="title" required /></div>
          <div className="field"><label htmlFor="due">Due (optional)</label><input id="due" type="date" name="due" min={todayIST()} /></div>
        </div>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <details key={n} className="card" open={n <= 3}>
            <summary>Question {n}</summary>
            <div className="field"><input name={`p${n}`} placeholder="Question" required={n === 1} aria-label={`Question ${n}`} /></div>
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="row" style={{ marginBottom: 6, flexWrap: 'nowrap' }}>
                <input type="radio" name={`c${n}`} value={j} defaultChecked={j === 0} style={{ width: 'auto' }} aria-label={`Option ${j + 1} is correct`} />
                <input name={`o${n}_${j}`} placeholder={`Option ${j + 1}${j < 2 ? '' : ' (optional)'}`} required={n === 1 && j < 2} />
              </div>
            ))}
            <p className="small muted" style={{ margin: 0 }}>Select the circle next to the correct option.</p>
          </details>
        ))}
        <button className="btn btn-primary">Publish quiz</button>
      </form>
    </>
  );
}
