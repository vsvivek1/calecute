import { notFound } from 'next/navigation';

import ComplaintThread from '@/components/ComplaintThread';
import Flash from '@/components/Flash';
import { rpc } from '@/lib/rpc';
import type { Complaint } from '@/lib/types';

export const metadata = { title: 'Complaint' };

export default async function ComplaintPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const c = await rpc<Complaint | null>('complaint', { p_id: id });
  if (!c) notFound();
  return (
    <>
      <Flash searchParams={searchParams} />
      <ComplaintThread c={c} />
    </>
  );
}
