import Link from 'next/link';

import ScanRegister from '@/components/ScanRegister';
import { rpc } from '@/lib/rpc';
import { SCAN_ENABLED } from '@/lib/scan';
import { requireAdmin } from '@/lib/session';
import type { SchoolStudents } from '@/lib/types';

export const metadata = { title: 'Add students from a photo' };

// Reading a full register page can take most of a minute.
export const maxDuration = 120;

export default async function ScanPage() {
  const { school } = await requireAdmin();
  const d = await rpc<SchoolStudents>('school_students', { p_school: school.school_id });

  return (
    <>
      <p className="small"><Link href="/office/students">← Students & staff</Link></p>
      <h1>Add students from a photo</h1>
      <p className="sub">Photograph an attendance register or admission book. You check every name before anything is saved.</p>
      {!SCAN_ENABLED ? (
        <div className="card"><p style={{ margin: 0 }}>Photo import is not switched on for this school yet.</p></div>
      ) : d.classes.length === 0 ? (
        <div className="card"><p style={{ margin: 0 }}>Add a class first, then come back to add its students. <Link href="/office/students">Add a class</Link></p></div>
      ) : (
        <ScanRegister school={school.school_id} classes={d.classes} />
      )}
    </>
  );
}
