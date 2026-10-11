/**
 * Hand-drawn caricature doodles for History Clock. They are decorative, so
 * each one is hidden from screen readers; the text beside them carries the
 * meaning.
 */
const INK = "#1f2433";
const PAPER = "#fffaf0";

const stroke = {
  stroke: INK,
  strokeWidth: 4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** The History Clock mascot: a crowned clock with a magnificent moustache. */
export function ClockMascot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 260" className={className} aria-hidden="true" focusable="false">
      {/* shadow */}
      <ellipse cx="120" cy="246" rx="70" ry="9" fill={INK} opacity="0.15" />
      {/* feet */}
      <path d="M92 222 q-6 18 -24 18 h30 z" fill={INK} />
      <path d="M148 222 q6 18 24 18 h-30 z" fill={INK} />
      {/* left arm holding a scroll */}
      <path d="M44 150 q-24 10 -26 34" fill="none" {...stroke} />
      <rect x="2" y="182" width="36" height="46" rx="6" fill="#f3e6c8" {...stroke} strokeWidth={3.5} />
      <path d="M9 196 h22 M9 206 h18 M9 216 h20" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      {/* right arm waving */}
      <path d="M196 140 q26 -10 30 -40" fill="none" {...stroke} />
      <circle cx="227" cy="94" r="8" fill={PAPER} {...stroke} strokeWidth={3.5} />
      {/* clock body */}
      <circle cx="120" cy="140" r="84" fill={PAPER} {...stroke} strokeWidth={5} />
      <circle cx="120" cy="140" r="72" fill="none" stroke={INK} strokeWidth={2} strokeDasharray="3 9" />
      {/* hour ticks */}
      <path d="M120 62 v12 M120 206 v12 M42 140 h12 M186 140 h12" {...stroke} />
      {/* crown */}
      <path
        d="M70 66 L62 22 L90 44 L120 12 L150 44 L178 22 L170 66 Z"
        fill="#e8b64c"
        {...stroke}
      />
      <circle cx="120" cy="40" r="6" fill="#d9653b" stroke={INK} strokeWidth={3} />
      <circle cx="88" cy="56" r="4" fill="#2f7f7a" />
      <circle cx="152" cy="56" r="4" fill="#2f7f7a" />
      {/* eyebrows, raised */}
      <path d="M78 98 q14 -12 28 -2" fill="none" {...stroke} />
      <path d="M134 96 q14 -10 28 2" fill="none" {...stroke} />
      {/* eyes */}
      <ellipse cx="94" cy="118" rx="14" ry="17" fill="#fff" {...stroke} strokeWidth={3.5} />
      <ellipse cx="146" cy="118" rx="14" ry="17" fill="#fff" {...stroke} strokeWidth={3.5} />
      <circle cx="98" cy="122" r="6" fill={INK} />
      <circle cx="150" cy="122" r="6" fill={INK} />
      <circle cx="100" cy="119" r="2" fill="#fff" />
      <circle cx="152" cy="119" r="2" fill="#fff" />
      {/* big nose */}
      <ellipse cx="120" cy="146" rx="13" ry="11" fill="#d9653b" {...stroke} strokeWidth={3.5} />
      {/* moustache */}
      <path
        d="M120 160 c-10 -6 -26 -8 -40 2 c-8 6 -18 4 -20 -6 c-2 12 8 22 22 20 c14 -2 26 -8 38 -10 c12 2 24 8 38 10 c14 2 24 -8 22 -20 c-2 10 -12 12 -20 6 c-14 -10 -30 -8 -40 -2 z"
        fill={INK}
      />
      {/* grin */}
      <path d="M100 186 q20 14 40 0" fill="none" {...stroke} strokeWidth={3.5} />
      {/* cheeks */}
      <circle cx="72" cy="152" r="8" fill="#d9653b" opacity="0.35" />
      <circle cx="168" cy="152" r="8" fill="#d9653b" opacity="0.35" />
    </svg>
  );
}

type FigureProps = { className?: string };

/** Emperors and dynasties: an enormous crown on a very small king. */
export function Emperor({ className = "" }: FigureProps) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true" focusable="false">
      <path d="M38 132 q22 -40 44 0 z" fill="#8a4f7d" {...stroke} strokeWidth={3} />
      <circle cx="60" cy="66" r="30" fill="#f2c9a0" {...stroke} strokeWidth={3} />
      <path d="M26 46 L22 8 L42 26 L60 2 L78 26 L98 8 L94 46 Z" fill="#e8b64c" {...stroke} strokeWidth={3} />
      <circle cx="60" cy="22" r="4" fill="#d9653b" />
      <circle cx="50" cy="62" r="3.5" fill={INK} />
      <circle cx="72" cy="62" r="3.5" fill={INK} />
      <path d="M44 54 l10 3 M78 54 l-10 3" {...stroke} strokeWidth={3} />
      <path d="M61 64 q12 10 0 14" fill="#e9a77e" {...stroke} strokeWidth={3} />
      <path d="M40 80 q20 26 40 0 q-4 18 -20 22 q-16 -4 -20 -22 z" fill="#6b4a2f" {...stroke} strokeWidth={3} />
    </svg>
  );
}

/** Thinkers: a bald philosopher with a beard longer than his arguments. */
export function Thinker({ className = "" }: FigureProps) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true" focusable="false">
      <path d="M30 136 q30 -50 60 0 z" fill="#fffaf0" {...stroke} strokeWidth={3} />
      <circle cx="60" cy="50" r="32" fill="#f2c9a0" {...stroke} strokeWidth={3} />
      <path d="M30 42 q-6 -6 -2 -14 M90 42 q6 -6 2 -14" fill="none" {...stroke} strokeWidth={3} />
      <path d="M40 40 q8 -6 16 0 M66 40 q8 -6 16 0" fill="none" {...stroke} strokeWidth={3} />
      <circle cx="48" cy="48" r="3" fill={INK} />
      <circle cx="74" cy="48" r="3" fill={INK} />
      <path d="M38 62 q22 6 44 0 q2 40 -22 62 q-24 -22 -22 -62 z" fill="#d8d4cc" {...stroke} strokeWidth={3} />
      <path d="M50 70 q10 6 20 0" fill="none" {...stroke} strokeWidth={3} />
      <path d="M96 96 v-34" {...stroke} strokeWidth={3} />
      <circle cx="96" cy="58" r="5" fill="#f2c9a0" {...stroke} strokeWidth={3} />
      <path d="M100 22 q8 -8 14 0 q-2 8 -10 8" fill="none" stroke="#d9653b" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/** Monuments: a builder carrying a whole temple, slightly too proudly. */
export function Builder({ className = "" }: FigureProps) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true" focusable="false">
      <path d="M10 40 L60 8 L110 40 Z" fill="#d9653b" {...stroke} strokeWidth={3} />
      <rect x="16" y="40" width="88" height="10" fill="#fffaf0" {...stroke} strokeWidth={3} />
      <path d="M28 50 v24 M48 50 v24 M72 50 v24 M92 50 v24" {...stroke} strokeWidth={3} />
      <circle cx="60" cy="96" r="20" fill="#c98f62" {...stroke} strokeWidth={3} />
      <path d="M40 84 q20 -14 40 0" fill="#2f7f7a" {...stroke} strokeWidth={3} />
      <circle cx="52" cy="96" r="3" fill={INK} />
      <circle cx="68" cy="96" r="3" fill={INK} />
      <path d="M50 106 q10 8 20 0" fill="none" {...stroke} strokeWidth={3} />
      <path d="M34 74 l6 12 M86 74 l-6 12" {...stroke} strokeWidth={3} />
      <path d="M40 136 q20 -26 40 0 z" fill="#e8b64c" {...stroke} strokeWidth={3} />
    </svg>
  );
}

/** Arts and literature: a poet with a quill and a dramatic sigh. */
export function Poet({ className = "" }: FigureProps) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true" focusable="false">
      <path d="M32 136 q28 -48 56 0 z" fill="#2f7f7a" {...stroke} strokeWidth={3} />
      <path d="M26 58 q-4 -40 34 -42 q38 2 34 42 q-6 30 -8 44 h-52 q-2 -14 -8 -44 z" fill="#3b2f2a" {...stroke} strokeWidth={3} />
      <ellipse cx="60" cy="62" rx="24" ry="28" fill="#f2c9a0" {...stroke} strokeWidth={3} />
      <path d="M46 58 q5 4 10 0 M64 58 q5 4 10 0" fill="none" {...stroke} strokeWidth={3} />
      <path d="M52 78 q8 -4 16 0" fill="none" {...stroke} strokeWidth={3} />
      <path d="M96 118 L104 70 q14 10 4 34 q-4 8 -12 14 z" fill="#fffaf0" {...stroke} strokeWidth={3} />
      <path d="M22 26 q-8 -4 -6 -12 M14 34 q-8 -2 -8 -8" fill="none" stroke="#8a4f7d" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/** A small hand-drawn globe with a pin. */
export function Globe({ className = "" }: FigureProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <circle cx="60" cy="62" r="46" fill="#bfe0dc" {...stroke} strokeWidth={3.5} />
      <path d="M30 40 q14 -8 24 4 q4 14 -10 18 q-10 6 -6 18 q-14 -6 -14 -22 q0 -10 6 -18 z" fill="#8fbf6a" {...stroke} strokeWidth={3} />
      <path d="M70 30 q18 2 24 18 q-10 4 -14 14 q-8 -2 -8 -12 q-8 -6 -2 -20 z" fill="#8fbf6a" {...stroke} strokeWidth={3} />
      <path d="M66 82 q12 -6 20 4 q-4 12 -18 12 z" fill="#8fbf6a" {...stroke} strokeWidth={3} />
      <path d="M84 6 q14 0 14 14 q0 10 -14 24 q-14 -14 -14 -24 q0 -14 14 -14 z" fill="#d9653b" {...stroke} strokeWidth={3} />
      <circle cx="84" cy="20" r="4" fill="#fffaf0" />
    </svg>
  );
}

/** A slider being dragged by a tiny hand. */
export function SliderDoodle({ className = "" }: FigureProps) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true" focusable="false">
      <rect x="10" y="54" width="140" height="14" rx="7" fill="#e8b64c" {...stroke} strokeWidth={3.5} />
      <circle cx="96" cy="61" r="16" fill="#fffaf0" {...stroke} strokeWidth={3.5} />
      <path d="M96 78 v18 q0 10 10 10 h8 q8 0 8 -10 v-12" fill="#f2c9a0" {...stroke} strokeWidth={3} />
      <path d="M24 30 l-10 -10 M40 26 v-14 M136 30 l10 -10 M120 26 v-14" {...stroke} strokeWidth={3} />
      <text x="14" y="98" fontSize="14" fontWeight="700" fill={INK}>BCE</text>
      <text x="120" y="44" fontSize="14" fontWeight="700" fill={INK}>CE</text>
    </svg>
  );
}
