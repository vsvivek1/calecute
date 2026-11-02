'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { importStudents, scanRegister } from '@/app/actions';
import type { ScannedStudent } from '@/lib/scan';

type Row = ScannedStudent & { keep: boolean };

// Phone photos are 3-12 MB. Shrinking them in the browser keeps the upload
// small and fast on school wifi, and the names stay perfectly legible.
const MAX_SIDE = 2000;

async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
  return blob ? new File([blob], 'page.jpg', { type: 'image/jpeg' }) : file;
}

export default function ScanRegister({ school, classes }: { school: string; classes: { id: string; name: string }[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [error, setError] = useState('');
  const [reading, startReading] = useTransition();
  const [saving, startSaving] = useTransition();

  function read() {
    setError('');
    startReading(async () => {
      const f = new FormData();
      for (const file of files) f.append('photo', await shrink(file));
      const res = await scanRegister(f);
      if ('error' in res) setError(res.error);
      else setRows(res.rows.map((r) => ({ ...r, keep: true })));
    });
  }

  function edit(i: number, patch: Partial<Row>) {
    setRows((rs) => rs!.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function save() {
    setError('');
    const chosen = rows!.filter((r) => r.keep && r.name.trim());
    startSaving(async () => {
      const { added, failed } = await importStudents(school, classId, chosen);
      if (failed.length) {
        setError(`Added ${added}. Not added: ${failed.map((f) => `${f.name} (${f.reason})`).join(', ')}`);
        setRows((rs) => rs!.filter((r) => failed.some((f) => f.name === r.name.trim())));
        return;
      }
      router.push(`/office/students?ok=${encodeURIComponent(`${added} students added`)}`);
    });
  }

  if (!rows) {
    return (
      <div className="card">
        <div className="field">
          <label htmlFor="photo">Photo of the register page</label>
          <input id="photo" type="file" accept="image/*" capture="environment" multiple
            onChange={(e) => setFiles([...(e.target.files ?? [])].slice(0, 4))} />
        </div>
        <p className="small muted">Take the photo straight on, in good light, with the whole page in view. Up to 4 pages at a time.</p>
        {error && <p className="flash err">{error}</p>}
        <button className="btn btn-primary" disabled={!files.length || reading} onClick={read}>
          {reading ? 'Reading the names…' : 'Read students'}
        </button>
      </div>
    );
  }

  const count = rows.filter((r) => r.keep && r.name.trim()).length;
  return (
    <div className="card">
      <p className="sub" style={{ marginTop: 0 }}>
        Found {rows.length} students. Check each name against the register, fix any mistakes, and untick anyone you don’t want to add.
      </p>
      <div className="field">
        <label htmlFor="sclass">Add them to class</label>
        <select id="sclass" value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <ul className="list" style={{ margin: '12px 0' }}>
        {rows.map((r, i) => (
          <li key={i} style={{ display: 'block', opacity: r.keep ? 1 : 0.5 }}>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input type="checkbox" checked={r.keep} aria-label={`Add ${r.name}`} style={{ width: 20 }}
                onChange={(e) => edit(i, { keep: e.target.checked })} />
              <input type="number" min={1} value={r.roll_no ?? ''} placeholder="Roll" aria-label="Roll no." style={{ width: 70 }}
                onChange={(e) => edit(i, { roll_no: e.target.value ? Number(e.target.value) : null })} />
              <input value={r.name} placeholder="Student’s name" aria-label="Name" style={{ flex: 1, minWidth: 0 }}
                onChange={(e) => edit(i, { name: e.target.value })} />
            </div>
            <div className="row" style={{ flexWrap: 'nowrap', marginTop: 6, paddingLeft: 30 }}>
              <input value={r.guardian_name} placeholder="Parent’s name" aria-label="Parent’s name" style={{ flex: 1, minWidth: 0 }}
                onChange={(e) => edit(i, { guardian_name: e.target.value })} />
              <input type="email" value={r.guardian_email} placeholder="Parent’s email" aria-label="Parent’s email" style={{ flex: 1.4, minWidth: 0 }}
                onChange={(e) => edit(i, { guardian_email: e.target.value })} />
            </div>
          </li>
        ))}
      </ul>
      <p className="small muted">A parent sees their child only once their email is added. You can add emails now or later from the student list.</p>
      {error && <p className="flash err">{error}</p>}
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-primary" disabled={!count || !classId || saving} onClick={save}>
          {saving ? 'Adding…' : `Add ${count} students`}
        </button>
        <button className="btn" disabled={saving} onClick={() => { setRows(null); setFiles([]); }}>Start again</button>
      </div>
    </div>
  );
}
