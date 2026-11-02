import { postEvent, postNotice } from '@/app/actions';
import BackField from './BackField';
import { dayTime, todayIST } from '@/lib/format';
import type { Notice, StaffEvent } from '@/lib/types';

/**
 * Posting notices and activities, for a class teacher (one class) or the
 * office (any class or the whole school). Read counts and permission-slip
 * tallies sit next to each item, so nobody has to chase replies by phone.
 */
export default function NoticeBoard({
  school, classes, wholeSchool, notices, events,
}: {
  school: string; classes: { id: string; name: string }[]; wholeSchool: boolean;
  notices: Notice[]; events: StaffEvent[];
}) {
  const classSelect = (id: string) => (
    <select id={id} name="class" defaultValue={wholeSchool ? '' : classes[0]?.id}>
      {wholeSchool && <option value="">Whole school</option>}
      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        <details className="card">
          <summary>Post a notice</summary>
          <form action={postNotice}>
            <BackField />
            <input type="hidden" name="school" value={school} />
            <div className="fields">
              <div className="field"><label htmlFor="nclass">To</label>{classSelect('nclass')}</div>
              <div className="field"><label htmlFor="priority">Priority</label>
                <select id="priority" name="priority"><option value="normal">Normal: in the daily digest</option><option value="urgent">Urgent: alert parents now</option></select>
              </div>
            </div>
            <div className="field" style={{ marginTop: 12 }}><label htmlFor="ntitle">Title</label><input id="ntitle" name="title" required maxLength={120} /></div>
            <div className="field"><label htmlFor="nbody">Message</label><textarea id="nbody" name="body" required maxLength={4000} /></div>
            <button className="btn btn-primary">Post notice</button>
          </form>
        </details>
        <details className="card">
          <summary>Post an activity or event</summary>
          <form action={postEvent}>
            <BackField />
            <input type="hidden" name="school" value={school} />
            <div className="field"><label htmlFor="eclass">For</label>{classSelect('eclass')}</div>
            <div className="field"><label htmlFor="etitle">Title</label><input id="etitle" name="title" required /></div>
            <div className="fields">
              <div className="field"><label htmlFor="date">Date</label><input id="date" type="date" name="date" required min={todayIST()} /></div>
              <div className="field"><label htmlFor="time">Time</label><input id="time" type="time" name="time" defaultValue="09:00" /></div>
              <div className="field"><label htmlFor="location">Place</label><input id="location" name="location" /></div>
              <div className="field"><label htmlFor="fee">Fee ₹ (optional)</label><input id="fee" type="number" name="fee" min={0} step="1" /></div>
            </div>
            <div className="field" style={{ marginTop: 12 }}><label htmlFor="details">Details</label><textarea id="details" name="details" /></div>
            <label className="row" style={{ color: 'var(--ink)', fontWeight: 500 }}>
              <input type="checkbox" name="consent" value="1" style={{ width: 'auto' }} /> Ask parents for permission
            </label>
            <button className="btn btn-primary" style={{ marginTop: 8 }}>Post activity</button>
          </form>
        </details>
      </div>

      <h2>Upcoming activities</h2>
      <div className="card tight">
        <table>
          <thead><tr><th>Activity</th><th>When</th><th className="num">Permission</th></tr></thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>{e.title} <span className="small muted">· {e.class ?? 'Whole school'}</span></td>
                <td className="small">{dayTime(e.starts_at)}</td>
                <td className="num small">
                  {e.needs_consent
                    ? <>{e.yes} yes · {e.no} no · <strong>{e.students - e.yes - e.no} waiting</strong></>
                    : '—'}
                </td>
              </tr>
            ))}
            {events.length === 0 && <tr><td colSpan={3} className="empty">Nothing upcoming.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 20 }}>Notices</h2>
      <div className="card tight">
        <ul className="list">
          {notices.map((n) => (
            <li key={n.id}>
              <span className="grow">
                <span className="title">{n.title}</span>
                {n.priority === 'urgent' && <> <span className="pill red">Urgent</span></>}
                <br />
                <span className="small muted">{n.class ?? 'Whole school'} · {dayTime(n.created_at)}</span>
              </span>
              <span className="small muted">{n.reads ?? 0} read</span>
            </li>
          ))}
          {notices.length === 0 && <li className="empty">No notices yet.</li>}
        </ul>
      </div>
    </>
  );
}
