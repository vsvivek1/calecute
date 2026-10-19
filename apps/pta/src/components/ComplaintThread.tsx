import { complaintStatus, replyComplaint } from '@/app/actions';
import BackField from './BackField';
import { ComplaintPill } from './Pill';
import { dayTime } from '@/lib/format';
import type { Complaint } from '@/lib/types';

/**
 * One complaint and its conversation. Shared by the parent and office views;
 * which buttons appear depends on who is looking, and the database enforces
 * the same rule in pta.set_complaint_status.
 */
export default function ComplaintThread({ c }: { c: Complaint }) {
  const live = c.status !== 'closed';
  return (
    <>
      <div className="row between">
        <h1 style={{ margin: 0 }}>{c.subject}</h1>
        <ComplaintPill status={c.status} />
      </div>
      <p className="sub" style={{ marginTop: 4 }}>
        {c.category} · {c.student ?? 'General'} · raised by {c.created_by} {dayTime(c.created_at)}
        {c.assigned_to && ` · handled by ${c.assigned_to}`}
      </p>

      <div className="msg"><div className="meta">{c.created_by}</div><div style={{ whiteSpace: 'pre-wrap' }}>{c.body}</div></div>
      {c.messages.map((m) => (
        <div key={m.id} className={`msg ${m.from_school ? 'school' : ''}`}>
          <div className="meta">{m.from_school ? `School · ${m.author}` : m.author} · {dayTime(m.created_at)}</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
        </div>
      ))}

      {c.mine && c.status === 'resolved' && (
        <div className="card attn" style={{ marginTop: 14 }}>
          <h2>The school says this is resolved. Is it?</h2>
          <form action={complaintStatus} className="row">
            <BackField />
            <input type="hidden" name="id" value={c.id} />
            <button name="status" value="closed" className="btn btn-green">Yes, close it</button>
            <button name="status" value="open" className="btn btn-red">No, reopen</button>
          </form>
        </div>
      )}

      {live && (
        <form action={replyComplaint} className="card" style={{ marginTop: 14 }}>
          <BackField />
          <input type="hidden" name="id" value={c.id} />
          <div className="field">
            <label htmlFor="body">Reply</label>
            <textarea id="body" name="body" required maxLength={4000} />
          </div>
          <button className="btn btn-primary">Send</button>
        </form>
      )}

      {c.staff && live && (
        <form action={complaintStatus} className="row">
          <BackField />
          <input type="hidden" name="id" value={c.id} />
          {c.status === 'open' && <button name="status" value="in_progress" className="btn btn-ghost">Mark in progress</button>}
          {c.status !== 'resolved' && <button name="status" value="resolved" className="btn btn-green">Mark resolved</button>}
          <span className="small muted">Only the parent can close it.</span>
        </form>
      )}
      {c.mine && c.status === 'closed' && (
        <form action={complaintStatus}>
          <BackField />
          <input type="hidden" name="id" value={c.id} />
          <button name="status" value="open" className="btn btn-ghost">Reopen</button>
        </form>
      )}
    </>
  );
}
