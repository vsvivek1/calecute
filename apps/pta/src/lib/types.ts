// Shapes returned by the pta.* functions. Kept by hand next to the SQL in
// supabase/migrations/0002_api.sql; the Flutter models mirror these.

export type Child = {
  id: string; name: string; roll_no: number | null;
  class_id: string | null; class: string | null;
  school_id: string; school: string;
};
export type StaffRole = { school_id: string; school: string; name: string; role: 'admin' | 'teacher' };
export type ClassRef = { id: string; name: string; school_id: string; students: number };
export type Me = { email: string; staff: StaffRole[]; children: Child[]; classes: ClassRef[] };

export type Status = 'present' | 'absent' | 'late' | 'leave';

export type Today = {
  student: { id: string; name: string; class: string | null };
  attendance_today: Status | null;
  attendance_month: { present: number; absent: number; leave: number; marked: number };
  homework_due: { id: string; subject: string; title: string; due_date: string; done: boolean }[];
  fees: { due_paise: number; overdue_paise: number; next_due_date: string | null };
  events: { id: string; title: string; starts_at: string; needs_consent: boolean; response: 'yes' | 'no' | null }[];
  notices_unread: { id: string; title: string; priority: 'normal' | 'urgent'; created_at: string }[];
  quizzes_open: number;
  latest_exam: { name: string; held_on: string; percent: number } | null;
  complaints_open: number;
};

export type AttendanceMonth = {
  month: string;
  days: { day: string; status: Status; note: string | null }[];
  year: { present: number; marked: number };
  leave_requests: { id: string; from_day: string; to_day: string; reason: string; status: string }[];
};

export type Payment = { id: string; receipt_no: string; amount_paise: number; method: string; reference: string | null; paid_at: string };
export type FeeItem = {
  id: string; title: string; amount_paise: number; due_date: string; late_fee_paise: number;
  paid_paise: number; due_paise: number; overdue: boolean; payments: Payment[];
};
export type Receipt = {
  receipt_no: string; amount_paise: number; method: string; reference: string | null; paid_at: string;
  fee: string; student: string; class: string | null; school: string; city: string | null;
};

export type Homework = {
  id: string; subject: string; title: string; details: string | null; link: string | null;
  due_date: string; created_at: string; seen: boolean; done: boolean;
};
export type EventItem = {
  id: string; title: string; details: string | null; location: string | null;
  starts_at: string; ends_at: string | null; whole_school: boolean;
  needs_consent: boolean; fee_paise: number; response: 'yes' | 'no' | null;
};
export type Exam = {
  id: string; name: string; held_on: string; percent: number; class_average: number | null;
  subjects: { subject: string; score: number; max_score: number; remark: string | null }[];
};
export type Resource = { id: string; subject: string; title: string; kind: 'sample_test' | 'model_paper' | 'notes'; url: string; created_at: string };
export type QuizListItem = {
  id: string; subject: string; title: string; due_date: string | null; questions: number;
  score: number | null; total: number | null; submitted_at: string | null;
};
export type Quiz = {
  id: string; subject: string; title: string; due_date: string | null; published: boolean;
  questions: { id: string; position: number; prompt: string; options: string[] }[];
};
export type QuizReview = { score: number; total: number; answers: number[]; correct: number[] };
export type Notice = {
  id: string; title: string; body: string; priority: 'normal' | 'urgent'; class: string | null;
  created_at: string; read: boolean; reads: number | null;
};
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ComplaintListItem = {
  id: string; subject: string; category: string; status: ComplaintStatus; student: string | null;
  class?: string | null; created_by: string; assigned_to: string | null; created_at: string;
  updated_at: string; first_reply_at: string | null; resolved_at?: string | null; messages?: number;
};
export type Complaint = ComplaintListItem & {
  body: string; mine: boolean; staff: boolean;
  messages: { id: string; author: string; body: string; created_at: string; from_school: boolean }[];
};

export type Register = {
  class: string; day: string;
  students: { id: string; name: string; roll_no: number | null; status: Status | null; note: string | null; on_leave: boolean }[];
  leave_pending: { id: string; student: string; from_day: string; to_day: string; reason: string }[];
};
export type ClassHomework = {
  id: string; subject: string; title: string; details: string | null; due_date: string; link: string | null;
  students: number; seen: number; done: number;
};
export type ClassExam = { id: string; name: string; held_on: string; published: boolean; average: number | null; entered: number };
export type ExamSheet = {
  id: string; name: string; held_on: string; published: boolean; class: string;
  students: { id: string; name: string; roll_no: number | null; marks: Record<string, { score: number; max_score: number }> }[];
};
export type ClassQuiz = {
  id: string; subject: string; title: string; due_date: string | null; published: boolean;
  questions: number; attempts: number; students: number; average: number | null;
};

export type OfficeToday = {
  school: string; students: number;
  attendance: { present: number; absent: number; leave: number; marked: number };
  classes_unmarked: string[];
  fees: { billed_paise: number; collected_paise: number; overdue_paise: number; overdue_families: number };
  complaints: { open: number; in_progress: number; unanswered_48h: number; median_first_reply_hours: number | null };
};
export type SchoolFee = {
  id: string; student_id: string; student: string; class: string | null; title: string;
  amount_paise: number; due_date: string; paid_paise: number; due_paise: number; overdue: boolean;
};
export type SchoolStudents = {
  classes: { id: string; name: string; teacher_email: string | null }[];
  students: { id: string; name: string; roll_no: number | null; class_id: string | null; class: string | null;
              guardians: { email: string; name: string | null; relation: string | null }[] }[];
};
export type ConsentList = { title: string; students: { name: string; class: string; response: 'yes' | 'no' | null }[] };
export type StaffEvent = {
  id: string; title: string; starts_at: string; class: string | null; needs_consent: boolean;
  yes: number; no: number; students: number;
};
