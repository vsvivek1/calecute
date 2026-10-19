import type { Status } from '@/lib/types';

const STATUS: Record<Status, string> = { present: 'green', absent: 'red', late: 'amber', leave: 'blue' };

export function StatusPill({ status, label }: { status: Status | null; label?: string }) {
  if (!status) return <span className="pill">{label ?? 'Not marked yet'}</span>;
  return <span className={`pill ${STATUS[status]}`}>{label ?? status}</span>;
}

const COMPLAINT: Record<string, [string, string]> = {
  open: ['amber', 'Open'],
  in_progress: ['blue', 'In progress'],
  resolved: ['green', 'Resolved: please confirm'],
  closed: ['', 'Closed'],
};

export function ComplaintPill({ status }: { status: string }) {
  const [c, l] = COMPLAINT[status] ?? ['', status];
  return <span className={`pill ${c}`}>{l}</span>;
}

export function Percent({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="pill">—</span>;
  const c = value >= 75 ? 'green' : value >= 50 ? 'amber' : 'red';
  return <span className={`pill ${c}`}>{value}%</span>;
}
