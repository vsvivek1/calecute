import 'server-only';

import Anthropic from '@anthropic-ai/sdk';

/** One row read off a register photo, before the office checks it. */
export type ScannedStudent = {
  name: string;
  roll_no: number | null;
  guardian_name: string;
  guardian_email: string;
  relation: 'mother' | 'father' | 'guardian' | '';
};

export type ScanImage = { data: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' };

/** Photo import needs an Anthropic API key on the server; without one the page says so. */
export const SCAN_ENABLED = Boolean(process.env.ANTHROPIC_API_KEY);

export class ScanError extends Error {}

const SCHEMA = {
  type: 'object',
  properties: {
    readable: { type: 'boolean', description: 'False when the photos are not a student list or cannot be read.' },
    students: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          roll_no: { type: ['integer', 'null'] },
          guardian_name: { type: 'string' },
          guardian_email: { type: 'string' },
          relation: { type: 'string', enum: ['mother', 'father', 'guardian', ''] },
        },
        required: ['name', 'roll_no', 'guardian_name', 'guardian_email', 'relation'],
        additionalProperties: false,
      },
    },
  },
  required: ['readable', 'students'],
  additionalProperties: false,
} as const;

const PROMPT = `These are photos of a school document listing students: an attendance register, an admission register or a class list, printed or handwritten, possibly in English or Malayalam.

List every student exactly once, in the order they appear.
- name: the student's name as written. Keep Malayalam script if that is how it is written; do not translate or guess missing letters.
- roll_no: the roll or serial number for that student if the page shows one, else null.
- guardian_name, guardian_email: only if the page shows them, else "".
- relation: "father" or "mother" when the page labels the guardian that way (for example "Father's name"), "guardian" for any other label, "" when there is no guardian.

Ignore attendance marks, dates, totals and signatures. If the same student appears on two photos, list them once. If the photos are not a list of students or are too blurred to read, set readable to false and return no students.`;

/** Reads the students off one or more photos of a register page. */
export async function readRegister(images: ScanImage[]): Promise<ScannedStudent[]> {
  if (!SCAN_ENABLED) throw new ScanError('Photo import is not switched on for this school yet.');
  const client = new Anthropic();

  let response;
  try {
    response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{
        role: 'user',
        content: [
          ...images.map((i) => ({ type: 'image' as const, source: { type: 'base64' as const, media_type: i.mediaType, data: i.data } })),
          { type: 'text' as const, text: PROMPT },
        ],
      }],
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) throw new ScanError('Too many photos at once. Please wait a minute and try again.');
    if (e instanceof Anthropic.BadRequestError) throw new ScanError('That photo could not be read. Try a smaller or clearer photo.');
    if (e instanceof Anthropic.APIError) throw new ScanError('Photo reading is unavailable right now. Please try again shortly.');
    throw e;
  }

  if (response.stop_reason === 'refusal') throw new ScanError('That photo could not be read. Please try another photo.');
  if (response.stop_reason === 'max_tokens') throw new ScanError('That page has too many names to read at once. Try one page per photo.');
  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new ScanError('No students were found in that photo.');

  const out = JSON.parse(text.text) as { readable: boolean; students: ScannedStudent[] };
  if (!out.readable || out.students.length === 0) {
    throw new ScanError('No students could be read from that photo. Try a clearer photo, taken straight on, in good light.');
  }
  return out.students
    .map((s) => ({ ...s, name: s.name.trim(), guardian_name: s.guardian_name.trim(), guardian_email: s.guardian_email.trim().toLowerCase() }))
    .filter((s) => s.name);
}
