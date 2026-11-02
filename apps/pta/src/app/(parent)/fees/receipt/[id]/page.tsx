import { notFound } from 'next/navigation';

import PrintButton from '@/components/PrintButton';
import { dayTime, rupees } from '@/lib/format';
import { rpc } from '@/lib/rpc';
import type { Receipt } from '@/lib/types';

export const metadata = { title: 'Receipt' };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const r = await rpc<Receipt | null>('receipt', { p_payment: id });
  if (!r) notFound();
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div className="row between">
        <div>
          <h2 style={{ margin: 0 }}>{r.school}</h2>
          <span className="small muted">{r.city}</span>
        </div>
        <span className="pill green">PAID</span>
      </div>
      <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '14px 0' }} />
      <table>
        <tbody>
          <tr><th>Receipt no.</th><td>{r.receipt_no}</td></tr>
          <tr><th>Student</th><td>{r.student}{r.class && `, ${r.class}`}</td></tr>
          <tr><th>For</th><td>{r.fee}</td></tr>
          <tr><th>Amount</th><td><strong>{rupees(r.amount_paise)}</strong></td></tr>
          <tr><th>Paid by</th><td>{r.method.toUpperCase()}{r.reference && ` · ${r.reference}`}</td></tr>
          <tr><th>Date</th><td>{dayTime(r.paid_at)}</td></tr>
        </tbody>
      </table>
      <p className="small muted" style={{ marginTop: 14 }}>Computer-generated receipt. No signature required.</p>
      <PrintButton />
    </div>
  );
}
