'use client';

import { useEffect, useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function PayButton({
  courseId,
  courseName,
  priceMinor,
  currency,
  email,
  name,
}: {
  courseId: string;
  courseName: string;
  priceMinor: number | null;
  currency: string;
  email: string;
  name: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.Razorpay) return setReady(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setReady(true);
    script.onerror = () => setMessage('Could not load the payment window.');
    document.body.appendChild(script);
  }, []);

  async function pay() {
    setBusy(true);
    setMessage(null);

    // The price is decided by the edge function from the courses table. This
    // page never sends an amount — a browser that names its own price names
    // one rupee.
    const supabase = browserClient();
    const { data, error } = await supabase.functions.invoke(
      'razorpay-create-order',
      { body: { courseId } },
    );

    if (error || !data?.orderId) {
      setMessage(
        (data as { error?: string } | null)?.error ??
          'Could not start the payment. Please try again.',
      );
      setBusy(false);
      return;
    }

    const rzp = new window.Razorpay!({
      key: data.keyId,
      order_id: data.orderId,
      amount: data.amount,
      currency: data.currency ?? currency,
      name: 'Recallio',
      description: courseName,
      prefill: { email, name },
      theme: { color: '#0163bb' },
      handler: () => {
        // Access is granted by the signed webhook, not by this callback, so
        // the honest message is that it is being confirmed.
        setMessage('Payment received — unlocking your course. Refresh in a moment.');
        setBusy(false);
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.open();
  }

  if (priceMinor == null) {
    return <p className="note">No price is set for this course yet.</p>;
  }

  const major = (priceMinor / 100).toFixed(priceMinor % 100 === 0 ? 0 : 2);
  const symbol = currency === 'INR' ? '₹' : `${currency} `;

  return (
    <>
      {message && <div className="ok">{message}</div>}
      <button className="btn btn-primary" onClick={pay} disabled={busy || !ready}>
        {busy ? 'Opening…' : `Pay by UPI or card · ${symbol}${major}`}
      </button>
      <p className="note" style={{ marginTop: 10 }}>
        Paid through Razorpay. Your UPI id and card details are entered on their
        screen and never reach us.
      </p>
    </>
  );
}
