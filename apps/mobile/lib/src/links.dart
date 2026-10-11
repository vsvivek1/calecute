/// Public web pages the preview app links to.
///
/// They live in apps/web under /history-clock. Keep these in step with
/// apps/web/src/lib/history-clock/content.ts if a route moves.
class HistoryClockLinks {
  const HistoryClockLinks._();

  static const String origin = 'https://calecutech.com';

  static final Uri home = Uri.parse('$origin/history-clock');
  static final Uri map = Uri.parse('$origin/history-clock/app');
  static final Uri quiz = Uri.parse('$origin/history-clock/quiz');
  static final Uri privacy = Uri.parse('$origin/history-clock/privacy');
  static final Uri terms = Uri.parse('$origin/history-clock/terms');
  static final Uri deleteAccount = Uri.parse(
    '$origin/history-clock/delete-account',
  );
  static final Uri contact = Uri.parse('$origin/contact');
}
