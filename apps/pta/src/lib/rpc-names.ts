/**
 * Every database function the apps may call.
 *
 * The demo database builds SQL from the function name, so the name must come
 * from this list and nowhere else. The Supabase path does not need the list
 * (PostgREST only exposes what exists), but sharing it keeps both honest.
 */
export const RPC = [
  'whoami',
  'child_today', 'child_attendance', 'child_fees', 'receipt', 'child_homework',
  'child_events', 'child_grades', 'child_resources', 'child_quizzes', 'quiz',
  'quiz_review', 'my_notices', 'my_complaints', 'complaint',
  'set_homework_done', 'mark_homework_seen', 'request_leave', 'respond_event',
  'raise_complaint', 'reply_complaint', 'read_notice', 'submit_quiz',
  'set_complaint_status',
  'class_register', 'save_register', 'decide_leave', 'post_homework',
  'class_homework', 'class_exams', 'create_exam', 'save_marks', 'exam_sheet',
  'create_quiz', 'class_quizzes', 'class_resources', 'staff_events', 'post_resource', 'post_notice', 'post_event',
  'event_responses_for',
  'office_today', 'school_complaints', 'school_fees', 'record_payment', 'bill',
  'school_students', 'add_student', 'add_guardian', 'add_class', 'add_staff',
] as const;

export type RpcName = (typeof RPC)[number];

export function isRpc(name: string): name is RpcName {
  return (RPC as readonly string[]).includes(name);
}

/** Arguments that are Postgres int[] rather than jsonb. */
export const INT_ARRAY_ARGS = new Set(['p_answers']);
