'use client';

import { useState, useTransition } from 'react';
import type { ManagedUser } from '@/lib/types';
import { setFreeLimit, setComplimentary } from '@/app/actions';

const DEFAULT_FREE_LIMIT = 200;

export default function UserRow({ user }: { user: ManagedUser }) {
  const [limit, setLimit] = useState<string>(
    user.free_card_limit?.toString() ?? '',
  );
  const [unlimited, setUnlimited] = useState(user.free_tier_unlimited);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function saveLimit() {
    setError(null);
    setSaved(false);
    const parsed = limit.trim() === '' ? null : Number(limit);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 0)) {
      setError('Whole numbers only');
      return;
    }
    start(async () => {
      const result = await setFreeLimit(user.user_id, parsed);
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  }

  function toggleComplimentary() {
    setError(null);
    const next = !unlimited;
    setUnlimited(next);
    start(async () => {
      const result = await setComplimentary(user.user_id, next);
      if (result?.error) {
        setError(result.error);
        setUnlimited(!next);
      }
    });
  }

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 600 }}>{user.display_name ?? '—'}</div>
        <div className="note">{user.email ?? user.user_id.slice(0, 8)}</div>
        {error && <div className="note" style={{ color: '#8c1d1d' }}>{error}</div>}
      </td>
      <td>
        {user.has_paid_subscription ? (
          <span className="pill pill-paid">Paid</span>
        ) : unlimited ? (
          <span className="pill pill-comp">Complimentary</span>
        ) : (
          <span className="pill pill-free">Free tier</span>
        )}
      </td>
      <td>
        <input
          type="number"
          min={0}
          value={limit}
          disabled={unlimited || pending}
          placeholder={`${DEFAULT_FREE_LIMIT}`}
          onChange={(e) => setLimit(e.target.value)}
          onBlur={saveLimit}
          aria-label={`Free card limit for ${user.email ?? user.user_id}`}
        />
        <div className="note">
          {unlimited ? 'not used' : saved ? 'saved' : 'blank = default'}
        </div>
      </td>
      <td>
        <button
          className={unlimited ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
          onClick={toggleComplimentary}
          disabled={pending}
        >
          {unlimited ? 'Revoke free access' : 'Grant free access'}
        </button>
      </td>
    </tr>
  );
}
