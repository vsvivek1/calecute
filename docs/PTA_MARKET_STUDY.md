# PTA app: what the market gets wrong, and what we do instead

A short study of the parent-school apps parents already use, done before the
first line of `apps/pta`. Sources are review sites and comparison articles
(Capterra, G2, GetApp, Jotform's 2026 roundup); points marked *inferred* come
from how these products are built rather than from a cited review.

## Who we looked at

| | Strength | What parents and teachers complain about |
|---|---|---|
| **ClassDojo** | Friendly, fast class messaging | Key features behind a paywall; messages arrive late or not at all; looks juvenile for older students; slow setup when adding students; poor for files |
| **ParentSquare** | All-in-one for districts, SIS integrations | Limited customisation and functionality outside messaging |
| **Remind** | Simple one-way texts | Thin feature set; communication only |
| **Brightwheel** | Strong for preschools (billing, check-in) | Built for daycare, not exams and homework |
| **Indian school ERPs** (Entab CampusCare, Teachmint, MyClassboard, Fedena) | Fees, attendance, report cards in one place | *Inferred:* separate apps for each function, English-only labels, notices with no read receipts, complaints that go into a void, fee receipts that are paper or hard to find |

Two complaints run across all of them: **too many notifications** ("many
parents are reluctant to sign up for another app") and **no loop closure**:
the parent cannot tell whether the school read, acted on, or finished
anything.

## Fixes built into this app

| Problem | Fix | Where |
|---|---|---|
| Notification overload | One **Today** page per child: only what needs the parent first, then today's facts. Notices are `normal` (wait in the digest) or `urgent` (the only ones that interrupt). | `pta.child_today`, `(parent)/page.tsx`, `today.dart` |
| Several children, several logins | One sign-in, a child switcher at the top of every screen | `Shell.tsx`, `home.dart` |
| Complaints vanish | Complaints are **tickets** with category, owner and status. Staff can mark *resolved*; only the parent who raised it can *close* it, and can reopen. The office dashboard shows complaints unanswered for 48 hours and the median first-reply time. | `pta.set_complaint_status`, `office/page.tsx` |
| "Did the parent even see the homework?" | Opening homework records *seen*; the parent ticks *done*. The teacher sees both counts per assignment. | `pta.homework_status`, `teach/homework` |
| Paper permission slips | Activities can ask for consent; parents answer Yes/No in the app; staff see who has not answered. | `pta.event_responses`, `NoticeBoard.tsx` |
| Lost fee receipts | Every payment gets a numbered receipt at insert time, visible to the parent immediately and printable. Late fees are computed one way for every screen, and paying on time never attracts one. | `pta.fee_payments.receipt_no`, `pta.fee_balances` |
| Absence vs. leave confusion | Parents request leave in advance; approval writes *leave* (not *absent*) onto the register. | `pta.on_leave_decided` |
| Slow roll call | The register starts everyone as present; a normal day is one tap. | `teach/page.tsx`, `teach.dart` |
| Quiz answers leak | The answer key lives in a table parents cannot read; marking happens in the database. The key for a quiz is released to a family only after their child submits. | `pta.quiz_answers`, `pta.submit_quiz`, `pta.quiz_review` |
| English-only | English and Malayalam labels, one tap to switch, on web and phone | `i18n.ts`, `i18n.dart` |
| Paywalled basics | Nothing is tiered. Every feature is available to every school. | — |
| Web and app disagree | Both apps call the **same database functions**; neither holds any rule of its own. | `supabase/migrations/0002_api.sql` |

## Deliberately left for later

- **Online fee payment.** Razorpay is already used elsewhere in this repo; it
  should arrive as a verified webhook that inserts into `pta.fee_payments`, so
  no client can forge a payment. Until then the office records payments.
- **Push notifications.** Urgent notices and absence alerts are the two that
  deserve one. Needs Firebase Cloud Messaging and a Supabase trigger.
- **SMS / WhatsApp fallback** for parents without smartphones. Needs a DLT-registered sender, as `apps/api` already notes.
- **Bus tracking, timetable, library.** Common in ERPs, not asked for here.
