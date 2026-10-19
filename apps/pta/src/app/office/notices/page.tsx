import Flash from '@/components/Flash';
import NoticeBoard from '@/components/NoticeBoard';
import { rpc } from '@/lib/rpc';
import { requireAdmin } from '@/lib/session';
import type { Notice, SchoolStudents, StaffEvent } from '@/lib/types';

export const metadata = { title: 'Notices & activities' };

export default async function OfficeNotices({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { school } = await requireAdmin();
  const [notices, events, roster] = await Promise.all([
    rpc<Notice[]>('my_notices'),
    rpc<StaffEvent[]>('staff_events', { p_school: school.school_id }),
    rpc<SchoolStudents>('school_students', { p_school: school.school_id }),
  ]);
  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>Notices & activities</h1>
      <p className="sub">Mark a notice urgent only when parents must see it today; everything else goes in their daily digest.</p>
      <NoticeBoard school={school.school_id} classes={roster.classes} wholeSchool notices={notices} events={events} />
    </>
  );
}
