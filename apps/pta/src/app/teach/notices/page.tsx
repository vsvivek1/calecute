import Flash from '@/components/Flash';
import NoticeBoard from '@/components/NoticeBoard';
import { rpc } from '@/lib/rpc';
import { requireTeacher } from '@/lib/session';
import type { Notice, StaffEvent } from '@/lib/types';

export const metadata = { title: 'Notices & activities' };

export default async function TeachNotices({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireTeacher();
  const school = me.classes[0].school_id;
  const names = new Set(me.classes.map((c) => c.name));
  const [notices, events] = await Promise.all([
    rpc<Notice[]>('my_notices'),
    rpc<StaffEvent[]>('staff_events', { p_school: school }),
  ]);
  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>Notices & activities</h1>
      <p className="sub">For your class. Whole-school notices come from the office.</p>
      <NoticeBoard school={school} classes={me.classes} wholeSchool={false}
        notices={notices} events={events.filter((e) => !e.class || names.has(e.class))} />
    </>
  );
}
