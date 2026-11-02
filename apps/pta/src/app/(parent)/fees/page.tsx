import Link from 'next/link';

import Flash from '@/components/Flash';
import { day, relative, rupees } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { rpc } from '@/lib/rpc';
import { lang, requireChild } from '@/lib/session';
import type { FeeItem } from '@/lib/types';

export const metadata = { title: 'Fees' };

export default async function Fees({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { child } = await requireChild();
  const t = translator(await lang());
  const items = await rpc<FeeItem[]>('child_fees', { p_student: child.id });
  const due = items.reduce((s, f) => s + Math.max(0, Number(f.due_paise)), 0);
  const overdue = items.filter((f) => f.overdue).reduce((s, f) => s + Number(f.due_paise), 0);
  const payments = items.flatMap((f) => f.payments.map((p) => ({ ...p, fee: f.title })))
    .sort((a, b) => b.paid_at.localeCompare(a.paid_at));

  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>{t('Fees')}</h1>
      <p className="sub">{child.name}</p>

      <div className="grid">
        <div className="card stat"><div className="label">{t('Due')}</div><div className="value">{rupees(due)}</div></div>
        <div className="card stat">
          <div className="label">{t('Overdue')}</div>
          <div className="value" style={{ color: overdue ? 'var(--red)' : undefined }}>{rupees(overdue)}</div>
          <div className="hint">{overdue ? 'Late fee already included' : 'Nothing overdue'}</div>
        </div>
      </div>

      <div className="card tight">
        <ul className="list">
          {items.map((f) => (
            <li key={f.id} className={f.overdue ? 'urgent' : ''}>
              <span className="grow">
                <span className="title">{f.title}</span>
                <br />
                <span className="small muted">
                  {rupees(f.amount_paise)} · due {day(f.due_date)}
                  {Number(f.late_fee_paise) > 0 && ` · late fee ${rupees(f.late_fee_paise)}`}
                </span>
              </span>
              {Number(f.due_paise) <= 0 ? (
                <span className="pill green">{t('Paid')}</span>
              ) : (
                <span style={{ textAlign: 'right' }}>
                  <strong>{rupees(f.due_paise)}</strong>
                  <br />
                  <span className={`pill ${f.overdue ? 'red' : 'amber'}`}>{f.overdue ? `${t('Overdue')} ${relative(f.due_date)}` : `due ${relative(f.due_date)}`}</span>
                </span>
              )}
            </li>
          ))}
          {items.length === 0 && <li className="empty">No fees billed.</li>}
        </ul>
      </div>

      <div className="card">
        <h2>How to pay</h2>
        <p className="small muted" style={{ margin: 0 }}>
          Pay at the school office by cash, UPI or card. Every payment gets a numbered receipt that
          appears below straight away, so there is never a paper slip to lose.
        </p>
      </div>

      <h2 style={{ marginTop: 22 }}>Receipts</h2>
      <div className="card tight">
        <ul className="list">
          {payments.map((p) => (
            <li key={p.id}>
              <span className="grow">
                <span className="title">{p.fee}</span>
                <br />
                <span className="small muted">{day(p.paid_at, { day: 'numeric', month: 'short', year: 'numeric' })} · {p.method.toUpperCase()} · {p.receipt_no}</span>
              </span>
              <strong>{rupees(p.amount_paise)}</strong>
              <Link href={`/fees/receipt/${p.id}`} className="btn btn-ghost btn-sm">{t('Receipt')}</Link>
            </li>
          ))}
          {payments.length === 0 && <li className="empty">No payments yet.</li>}
        </ul>
      </div>
    </>
  );
}
