import { bill, recordPayment } from '@/app/actions';
import BackField from '@/components/BackField';
import Flash from '@/components/Flash';
import { day, rupees, todayIST } from '@/lib/format';
import { rpc } from '@/lib/rpc';
import { requireAdmin } from '@/lib/session';
import type { SchoolFee, SchoolStudents } from '@/lib/types';

export const metadata = { title: 'Fees' };

export default async function OfficeFees({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { school } = await requireAdmin();
  const sp = await searchParams;
  const [fees, roster] = await Promise.all([
    rpc<SchoolFee[]>('school_fees', { p_school: school.school_id }),
    rpc<SchoolStudents>('school_students', { p_school: school.school_id }),
  ]);
  const q = (sp.q ?? '').toLowerCase();
  const shown = fees.filter((f) =>
    (sp.overdue !== '1' || f.overdue) &&
    (sp.unpaid !== '1' || Number(f.due_paise) > 0) &&
    (!q || f.student.toLowerCase().includes(q) || (f.class ?? '').toLowerCase().includes(q)));

  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>Fees</h1>
      <p className="sub">Record a payment and the parent sees the receipt at once. Online payments (Razorpay) will land here the same way.</p>

      <details className="card">
        <summary>Add a fee</summary>
        <form action={bill}>
          <BackField />
          <input type="hidden" name="school" value={school.school_id} />
          <div className="fields">
            <div className="field"><label htmlFor="class">Bill</label>
              <select id="class" name="class"><option value="">Every student</option>{roster.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div className="field"><label htmlFor="title">For</label><input id="title" name="title" required placeholder="Term 3 tuition" /></div>
            <div className="field"><label htmlFor="amount">Amount ₹</label><input id="amount" type="number" name="amount" min={1} step="0.01" required /></div>
            <div className="field"><label htmlFor="due">Due</label><input id="due" type="date" name="due" required defaultValue={todayIST()} /></div>
            <div className="field"><label htmlFor="late">Late fee ₹</label><input id="late" type="number" name="late" min={0} step="0.01" defaultValue={0} /></div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 12 }}>Add</button>
        </form>
      </details>

      <form className="card row">
        <input name="q" placeholder="Search student or class" defaultValue={sp.q} style={{ flex: 1, minWidth: 180 }} />
        <label className="row" style={{ margin: 0, color: 'var(--ink)' }}><input type="checkbox" name="unpaid" value="1" defaultChecked={sp.unpaid === '1'} style={{ width: 'auto' }} /> Unpaid</label>
        <label className="row" style={{ margin: 0, color: 'var(--ink)' }}><input type="checkbox" name="overdue" value="1" defaultChecked={sp.overdue === '1'} style={{ width: 'auto' }} /> Overdue</label>
        <button className="btn btn-ghost btn-sm">Filter</button>
      </form>

      <div className="card tight scroll">
        <table>
          <thead><tr><th>Student</th><th>Fee</th><th>Due</th><th className="num">Balance</th><th>Record payment</th></tr></thead>
          <tbody>
            {shown.map((f) => (
              <tr key={f.id}>
                <td>{f.student}<br /><span className="small muted">{f.class}</span></td>
                <td>{f.title}<br /><span className="small muted">{rupees(f.amount_paise)}</span></td>
                <td className="small">{day(f.due_date)}{f.overdue && <><br /><span className="pill red">Overdue</span></>}</td>
                <td className="num"><strong>{Number(f.due_paise) > 0 ? rupees(f.due_paise) : <span className="pill green">Paid</span>}</strong></td>
                <td>
                  {Number(f.due_paise) > 0 && (
                    <form action={recordPayment} className="row" style={{ flexWrap: 'nowrap' }}>
                      <BackField />
                      <input type="hidden" name="fee" value={f.id} />
                      <input type="number" name="amount" step="0.01" min={0.01} defaultValue={Number(f.due_paise) / 100} style={{ width: 100 }} aria-label="Amount" />
                      <select name="method" style={{ width: 90 }} aria-label="Method"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank</option></select>
                      <input name="reference" placeholder="Ref" style={{ width: 90 }} aria-label="Reference" />
                      <button className="btn btn-green btn-sm">Save</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={5} className="empty">No fees match.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
