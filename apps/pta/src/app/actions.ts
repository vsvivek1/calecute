'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { DEMO, DEMO_COOKIE, DEMO_PEOPLE } from '@/lib/mode';
import { rpc, RpcError } from '@/lib/rpc';
import { readRegister, ScanError, type ScanImage, type ScannedStudent } from '@/lib/scan';
import { CHILD_COOKIE, LANG_COOKIE, requireAdmin } from '@/lib/session';
import type { RpcName } from '@/lib/rpc-names';

// Every action below is a thin call into one pta.* function. The function runs
// as the signed-in user under row-level security, so an action needs no role
// check of its own: posting to it directly gets the same refusal the database
// would give anyone.

const YEAR = 60 * 60 * 24 * 365;

function s(f: FormData, k: string) {
  const v = f.get(k);
  return typeof v === 'string' ? v.trim() : '';
}

function back(f: FormData, fallback = '/') {
  const v = s(f, 'back');
  // Same-site paths only: "//host" and "/\host" are both read as another site.
  return /^\/(?![/\\])/.test(v) ? v : fallback;
}

/** Runs one call, then returns to the page with a message either way. */
async function call(f: FormData, fn: RpcName, args: Record<string, unknown>, ok: string) {
  const to = back(f);
  const sep = to.includes('?') ? '&' : '?';
  try {
    await rpc(fn, args);
  } catch (e) {
    const msg = e instanceof RpcError ? e.message : 'Something went wrong. Please try again.';
    redirect(`${to}${sep}error=${encodeURIComponent(msg)}`);
  }
  revalidatePath('/', 'layout');
  redirect(`${to}${sep}ok=${encodeURIComponent(ok)}`);
}

// --- session and preferences ----------------------------------------------

export async function demoSignIn(f: FormData) {
  if (!DEMO) return;
  const email = s(f, 'email');
  if (!DEMO_PEOPLE.some((p) => p.email === email)) return;
  const jar = await cookies();
  jar.set(DEMO_COOKIE, email, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: YEAR });
  jar.delete(CHILD_COOKIE);
  redirect(email === 'office@example.com' ? '/office' : email.startsWith('anitha') ? '/teach' : '/');
}

export async function chooseChild(f: FormData) {
  (await cookies()).set(CHILD_COOKIE, s(f, 'child'), { sameSite: 'lax', path: '/', maxAge: YEAR });
  redirect(back(f));
}

export async function setLang(f: FormData) {
  (await cookies()).set(LANG_COOKIE, s(f, 'lang') === 'ml' ? 'ml' : 'en', { sameSite: 'lax', path: '/', maxAge: YEAR });
  redirect(back(f));
}

// --- parent ---------------------------------------------------------------

export async function homeworkDone(f: FormData) {
  const done = s(f, 'done') === '1';
  await call(f, 'set_homework_done', { p_homework: s(f, 'homework'), p_student: s(f, 'student'), p_done: done },
    done ? 'Marked done' : 'Marked not done');
}

export async function requestLeave(f: FormData) {
  await call(f, 'request_leave', {
    p_student: s(f, 'student'), p_from: s(f, 'from'), p_to: s(f, 'to') || s(f, 'from'), p_reason: s(f, 'reason'),
  }, 'Leave request sent to the class teacher');
}

export async function respondEvent(f: FormData) {
  await call(f, 'respond_event', { p_event: s(f, 'event'), p_student: s(f, 'student'), p_response: s(f, 'response') },
    'Response saved');
}

export async function raiseComplaint(f: FormData) {
  let id: string | null = null;
  try {
    id = await rpc<string>('raise_complaint', {
      p_student: s(f, 'student'), p_category: s(f, 'category'), p_subject: s(f, 'subject'), p_body: s(f, 'body'),
    });
  } catch (e) {
    redirect(`/complaints/new?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath('/', 'layout');
  redirect(`/complaints/${id}?ok=${encodeURIComponent('Complaint registered. The school has been told.')}`);
}

export async function replyComplaint(f: FormData) {
  await call(f, 'reply_complaint', { p_id: s(f, 'id'), p_body: s(f, 'body') }, 'Reply sent');
}

export async function complaintStatus(f: FormData) {
  const st = s(f, 'status');
  const label: Record<string, string> = {
    open: 'Reopened', in_progress: 'Marked in progress', resolved: 'Marked resolved', closed: 'Closed. Thank you.',
  };
  await call(f, 'set_complaint_status', { p_id: s(f, 'id'), p_status: st }, label[st] ?? 'Updated');
}

export async function readNotice(f: FormData) {
  await call(f, 'read_notice', { p_notice: s(f, 'notice') }, 'Marked read');
}

export async function submitQuiz(f: FormData) {
  const n = Number(s(f, 'count'));
  const answers = Array.from({ length: n }, (_, i) => Number(f.get(`q${i + 1}`) ?? -1));
  const to = back(f);
  if (answers.some((a) => a < 0)) {
    redirect(`${to}?error=${encodeURIComponent('Please answer every question before submitting.')}`);
  }
  await call(f, 'submit_quiz', { p_quiz: s(f, 'quiz'), p_student: s(f, 'student'), p_answers: answers }, 'Submitted');
}

// --- teacher --------------------------------------------------------------

export async function saveRegister(f: FormData) {
  const ids = f.getAll('student').map(String);
  const entries = ids.map((id) => ({
    student_id: id, status: s(f, `status_${id}`) || 'present', note: s(f, `note_${id}`),
  }));
  const absent = entries.filter((e) => e.status === 'absent').length;
  await call(f, 'save_register', { p_class: s(f, 'class'), p_day: s(f, 'day'), p_entries: entries },
    `Register saved: ${entries.length - absent} present, ${absent} absent`);
}

export async function decideLeave(f: FormData) {
  const yes = s(f, 'approve') === '1';
  await call(f, 'decide_leave', { p_id: s(f, 'id'), p_approve: yes }, yes ? 'Leave approved' : 'Leave declined');
}

export async function postHomework(f: FormData) {
  await call(f, 'post_homework', {
    p_class: s(f, 'class'), p_subject: s(f, 'subject'), p_title: s(f, 'title'),
    p_details: s(f, 'details'), p_due: s(f, 'due'), p_link: s(f, 'link'),
  }, 'Homework posted. Parents will see it in today’s list.');
}

export async function createExam(f: FormData) {
  let id: string | null = null;
  try {
    id = await rpc<string>('create_exam', { p_class: s(f, 'class'), p_name: s(f, 'name'), p_held_on: s(f, 'held_on') });
  } catch (e) {
    redirect(`/teach/marks?error=${encodeURIComponent((e as Error).message)}`);
  }
  redirect(`/teach/marks/${id}`);
}

export async function saveMarks(f: FormData) {
  const subjects = s(f, 'subjects').split(',').map((x) => x.trim()).filter(Boolean);
  const max = Number(s(f, 'max')) || 100;
  const marks = f.getAll('student').map(String).flatMap((id) =>
    subjects.map((sub) => ({ student_id: id, subject: sub, score: s(f, `m_${id}_${sub}`), max_score: max })));
  const publish = s(f, 'publish') === '1';
  await call(f, 'save_marks', { p_exam: s(f, 'exam'), p_marks: marks, p_publish: publish },
    publish ? 'Marks saved and published to parents' : 'Marks saved. Not visible to parents until published.');
}

export async function createQuiz(f: FormData) {
  const questions = [];
  for (let i = 1; i <= 10; i++) {
    const prompt = s(f, `p${i}`);
    if (!prompt) continue;
    const options = [0, 1, 2, 3].map((j) => s(f, `o${i}_${j}`)).filter(Boolean);
    questions.push({ prompt, options, correct: Number(s(f, `c${i}`) || 0) });
  }
  const to = '/teach/quizzes';
  try {
    await rpc('create_quiz', {
      p_class: s(f, 'class'), p_subject: s(f, 'subject'), p_title: s(f, 'title'),
      p_due: s(f, 'due') || null, p_questions: questions, p_publish: true,
    });
  } catch (e) {
    redirect(`/teach/quizzes/new?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath('/', 'layout');
  redirect(`${to}?ok=${encodeURIComponent('Quiz published')}`);
}

export async function postResource(f: FormData) {
  await call(f, 'post_resource', {
    p_class: s(f, 'class'), p_subject: s(f, 'subject'), p_title: s(f, 'title'), p_kind: s(f, 'kind'), p_url: s(f, 'url'),
  }, 'Shared with the class');
}

export async function postNotice(f: FormData) {
  await call(f, 'post_notice', {
    p_school: s(f, 'school'), p_class: s(f, 'class') || null, p_title: s(f, 'title'),
    p_body: s(f, 'body'), p_priority: s(f, 'priority') === 'urgent' ? 'urgent' : 'normal',
  }, 'Notice posted');
}

export async function postEvent(f: FormData) {
  const date = s(f, 'date');
  const time = s(f, 'time') || '09:00';
  await call(f, 'post_event', {
    p_school: s(f, 'school'), p_class: s(f, 'class') || null, p_title: s(f, 'title'), p_details: s(f, 'details'),
    p_location: s(f, 'location'), p_starts: `${date}T${time}:00+05:30`, p_needs_consent: s(f, 'consent') === '1',
    p_fee_paise: Math.round(Number(s(f, 'fee') || 0) * 100),
  }, 'Activity posted');
}

// --- office ---------------------------------------------------------------

export async function recordPayment(f: FormData) {
  await call(f, 'record_payment', {
    p_fee: s(f, 'fee'), p_amount_paise: Math.round(Number(s(f, 'amount')) * 100),
    p_method: s(f, 'method'), p_reference: s(f, 'reference'),
  }, 'Payment recorded. The receipt is in the parent’s app.');
}

export async function bill(f: FormData) {
  await call(f, 'bill', {
    p_school: s(f, 'school'), p_class: s(f, 'class') || null, p_student: null, p_title: s(f, 'title'),
    p_amount_paise: Math.round(Number(s(f, 'amount')) * 100), p_due: s(f, 'due'),
    p_late_fee_paise: Math.round(Number(s(f, 'late') || 0) * 100),
  }, 'Fee added');
}

export async function addStudent(f: FormData) {
  await call(f, 'add_student', {
    p_school: s(f, 'school'), p_class: s(f, 'class') || null, p_name: s(f, 'name'),
    p_roll: s(f, 'roll') ? Number(s(f, 'roll')) : null, p_guardian_email: s(f, 'email'),
    p_guardian_name: s(f, 'guardian'), p_relation: s(f, 'relation'),
  }, 'Student added. The parent can sign in with that email now.');
}

const SCAN_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const SCAN_MAX_PHOTOS = 4;
const SCAN_MAX_BYTES = 3_000_000;

/**
 * Reads the students off photos of a register. Nothing is saved: the office
 * checks the list on screen and then calls importStudents. Unlike the other
 * actions this one checks the role itself, because the photo is read before
 * any database call could refuse it.
 */
export async function scanRegister(f: FormData): Promise<{ rows: ScannedStudent[] } | { error: string }> {
  await requireAdmin();
  const files = f.getAll('photo').filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length === 0) return { error: 'Take or choose a photo first.' };
  if (files.length > SCAN_MAX_PHOTOS) return { error: `Up to ${SCAN_MAX_PHOTOS} photos at a time, please.` };
  const images: ScanImage[] = [];
  for (const file of files) {
    const type = SCAN_TYPES.find((t) => t === file.type);
    if (!type) return { error: 'Please use a JPEG or PNG photo.' };
    if (file.size > SCAN_MAX_BYTES) return { error: 'That photo is too large. Please try again.' };
    images.push({ mediaType: type, data: Buffer.from(await file.arrayBuffer()).toString('base64') });
  }
  try {
    return { rows: await readRegister(images) };
  } catch (e) {
    if (e instanceof ScanError) return { error: e.message };
    console.error('scanRegister', e);
    return { error: 'Something went wrong reading the photo. Please try again.' };
  }
}

/** Adds the students the office confirmed after a scan, one add_student call each. */
export async function importStudents(school: string, classId: string, rows: ScannedStudent[]) {
  const failed: { name: string; reason: string }[] = [];
  let added = 0;
  for (const r of rows) {
    const name = r.name.trim();
    if (!name) continue;
    try {
      await rpc('add_student', {
        p_school: school, p_class: classId || null, p_name: name,
        p_roll: Number.isInteger(r.roll_no) ? r.roll_no : null, p_guardian_email: r.guardian_email.trim(),
        p_guardian_name: r.guardian_name.trim(), p_relation: r.relation || (r.guardian_email ? 'guardian' : ''),
      });
      added++;
    } catch (e) {
      failed.push({ name, reason: e instanceof RpcError ? e.message : 'Something went wrong' });
    }
  }
  revalidatePath('/', 'layout');
  return { added, failed };
}

export async function addGuardian(f: FormData) {
  await call(f, 'add_guardian', {
    p_student: s(f, 'student'), p_email: s(f, 'email'), p_name: s(f, 'name'), p_relation: s(f, 'relation'),
  }, 'Guardian added');
}

export async function addClass(f: FormData) {
  await call(f, 'add_class', { p_school: s(f, 'school'), p_name: s(f, 'name'), p_teacher_email: s(f, 'teacher') },
    'Class added');
}

export async function addStaff(f: FormData) {
  await call(f, 'add_staff', {
    p_school: s(f, 'school'), p_email: s(f, 'email'), p_name: s(f, 'name'), p_role: s(f, 'role'),
  }, 'Staff member added');
}

/** Called once when a parent opens the homework page, so the teacher knows it was seen. */
export async function markHomeworkSeen(student: string) {
  try {
    await rpc('mark_homework_seen', { p_student: student });
  } catch {
    /* best effort: a missed read receipt is not worth an error on screen */
  }
}
