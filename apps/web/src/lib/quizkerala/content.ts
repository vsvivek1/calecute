/**
 * Copy and disclosure data for QuizKerala, the timed online quiz app.
 *
 * QuizKerala is published by the international entity (Calecute Technologies
 * LLC, `lib/company.ts`), like the other apps in `lib/apps.ts`, so it reuses
 * that file's CONTACT and PROCESSORS rather than the Indian OPC used by the
 * agent programme and GoldLelam.
 *
 * Every policy page under /quizkerala reads from here, so the disclosures and
 * the Play Console Data safety form can be filled from one place.
 */
import { CONTACT, PROCESSORS, type Processor } from "@/lib/apps";
import { company } from "@/lib/company";

export { CONTACT, company };

export const QUIZKERALA = {
  name: "QuizKerala",
  tagline: "Timed quizzes, live leaderboards, one fair attempt.",
  androidPackage: "com.calecutech.quizkerala",
  /** Where the quiz itself is played. The Android app opens this site. */
  appUrl: "https://quiz.calecutech.com",
  /** Root of this marketing and policy site. */
  basePath: "/quizkerala",
  /** Date the disclosures on these pages last changed. */
  policyUpdated: "October 6, 2026",
  /** Minimum age to create an account. */
  minimumAge: 13,
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=com.calecutech.quizkerala",
} as const;

export const QK_PROCESSORS: Processor[] = [
  ...PROCESSORS.google,
  ...PROCESSORS.hosting,
];

/** Main menu, in display order. Used by the masthead and the mobile menu. */
export const NAV = [
  { href: "/quizkerala", label: "Home" },
  { href: "/quizkerala/how-it-works", label: "How it works" },
  { href: "/quizkerala/organisers", label: "For organisers" },
  { href: "/quizkerala/faq", label: "FAQ" },
  { href: "/quizkerala/about", label: "About" },
  { href: "/quizkerala/contact", label: "Contact" },
] as const;

/** Footer policy links, the set Play Console and Google OAuth ask for. */
export const LEGAL_LINKS = [
  { href: "/quizkerala/privacy", label: "Privacy Policy" },
  { href: "/quizkerala/terms", label: "Terms of Use" },
  { href: "/quizkerala/delete-account", label: "Delete Account" },
  { href: "/quizkerala/child-safety", label: "Child Safety" },
  { href: "/quizkerala/contact", label: "Support" },
] as const;

export const FEATURES = [
  {
    icon: "⏱",
    heading: "Fixed time, fair for all",
    body: "Every attempt gets the same time limit. The clock runs on our server, so a slow phone or a dropped connection never steals your seconds.",
  },
  {
    icon: "🎲",
    heading: "Fixed or random questions",
    body: "Organisers either set the same paper for everyone or let each player draw a fresh set from a question bank.",
  },
  {
    icon: "🏆",
    heading: "Live leaderboard",
    body: "Ranked by score, and when scores tie the faster player wins. The board turns Final the moment a round closes.",
  },
  {
    icon: "🔗",
    heading: "Join with a code",
    body: "Each quiz has a short code and link. Share it on WhatsApp, a classroom board or a poster, and players are in with one tap.",
  },
  {
    icon: "🔐",
    heading: "Sign in with Google",
    body: "No new password to remember. One Google sign-in, one attempt per quiz, so nobody plays twice.",
  },
  {
    icon: "📱",
    heading: "Made for phones",
    body: "Built for a 360px screen first. Big buttons, clear countdown, and it resumes where you left off if you reload.",
  },
] as const;

export const PLAYER_STEPS = [
  {
    heading: "Get the code",
    body: "Your organiser shares a quiz link or a six-character code, such as ABC123.",
  },
  {
    heading: "Sign in with Google",
    body: "Open the link, tap Sign in with Google, and you land on the quiz's start screen.",
  },
  {
    heading: "Start when ready",
    body: "The quiz opens at a set time. Tap Start and your countdown begins. You get one attempt.",
  },
  {
    heading: "Answer and submit",
    body: "Each answer is saved as you tap it. Submit when done, or the quiz submits itself when time runs out.",
  },
  {
    heading: "See where you stand",
    body: "Check the leaderboard. It is Provisional while the quiz is open and Final once it closes, when you can review the correct answers too.",
  },
] as const;

export const ORGANISER_STEPS = [
  {
    heading: "Build a question bank",
    body: "Add multiple-choice questions to a bank. Reuse the same bank across many quizzes.",
  },
  {
    heading: "Create a quiz",
    body: "Pick fixed mode to hand-pick questions and order, or random mode to give every player N questions drawn from the bank.",
  },
  {
    heading: "Set the window and timer",
    body: "Choose when the quiz opens and closes, and how many minutes each attempt gets.",
  },
  {
    heading: "Share the code",
    body: "Publish the quiz and share its link. Watch the leaderboard fill up, or keep it hidden until the round ends.",
  },
  {
    heading: "Close and announce",
    body: "At closing time every unfinished attempt is scored on what was saved, and the leaderboard is frozen as Final.",
  },
] as const;

export const FAQ = [
  {
    q: "Is QuizKerala free?",
    a: "Yes. Playing is free and there is no advertising in the app.",
  },
  {
    q: "Why do I need to sign in with Google?",
    a: "Sign-in makes sure each person gets exactly one attempt per quiz and that the leaderboard shows real players. We receive only your name, email address and profile picture from Google, never your password.",
  },
  {
    q: "What happens if my internet drops during a quiz?",
    a: "Your answers are saved one by one as you tap them. Reopen the quiz link and you resume the same attempt with the same questions. The timer kept running on our server while you were away, so reconnect quickly.",
  },
  {
    q: "What if I don't press Submit?",
    a: "When time runs out the quiz submits itself and scores every answer you had saved.",
  },
  {
    q: "How are ties broken?",
    a: "Higher score ranks first. If two players have the same score, the one who took less time ranks higher. If score and time are both equal, the earlier submission wins, and exact ties share a rank.",
  },
  {
    q: "Can I play a quiz twice?",
    a: "No. Each Google account gets one attempt per quiz. This keeps the leaderboard fair.",
  },
  {
    q: "Is there negative marking?",
    a: "No. A correct answer is worth one mark and a wrong or skipped answer is worth zero.",
  },
  {
    q: "When can I see the correct answers?",
    a: "After the quiz closes and the leaderboard turns Final. Showing them earlier would let answers leak to players still taking it.",
  },
  {
    q: "Who can see my name on the leaderboard?",
    a: "Other players of the same quiz and its organisers see your display name, score, time and rank. Your email address is never shown to other players.",
  },
  {
    q: "How do I delete my account?",
    a: "Use Delete account in the app's profile menu, or follow the steps on our Delete Account page. You don't need the app installed.",
  },
  {
    q: "Can my school or club run its own quiz?",
    a: "Yes. See the For organisers page and write to us to get organiser access.",
  },
] as const;

/** What the Play Data safety form and the privacy page both describe. */
export const DATA_COLLECTED = [
  {
    category: "Personal info",
    items: ["Name", "Email address", "Profile picture (from your Google account)"],
    purpose:
      "Creating your account, showing your name on leaderboards, and letting you sign back in on another device.",
  },
  {
    category: "App activity",
    items: [
      "Quizzes you join",
      "Answers you select and when you selected them",
      "Score, time taken and rank",
    ],
    purpose:
      "Running the quiz, enforcing the time limit, scoring you and building the leaderboard.",
  },
  {
    category: "App info and performance",
    items: ["IP address and browser or device type in server logs", "Error logs"],
    purpose:
      "Keeping the service secure, rate-limiting abuse and spotting cheating, and fixing faults. Logs are kept for at most 30 days.",
  },
] as const;

export const DELETES = [
  "Your account: name, email address and profile picture",
  "Your quiz attempts, answers, scores and times",
  "Your entries on every leaderboard, including Final ones",
  "Any active sign-in sessions",
];

export const RETAINS_ON_DELETE =
  "Server logs that contain your IP address age out within 30 days and are not linked back to a deleted account. If you were an organiser, the question banks and quizzes you created are transferred to Calecutech or removed, at your choice, so other players' results are not lost without warning.";
