import 'dart:math' as math;

/// Seconds before the rating buttons (or "Next step") unlock.
/// Learning engine §2: about two words a second, clamped, then slowed for
/// Malayalam and for children.
enum ScreenKind { factLearn, factRecall, step, mathStep, practice, summary }

int wordCount(String text) =>
    text.trim().isEmpty ? 0 : text.trim().split(RegExp(r'\s+')).length;

int minSeconds(
  ScreenKind kind,
  String visibleText, {
  String language = 'en',
  bool child = false,
  int? authorSeconds,
  double focusFactor = 1.0,
}) {
  if (authorSeconds != null) return authorSeconds;
  final w = wordCount(visibleText);
  final base = switch (kind) {
    ScreenKind.factLearn => _clamp(w / 2 + 2, 5, 25),
    ScreenKind.factRecall => _clamp(w / 2.5, 3, 15),
    ScreenKind.step => _clamp(w / 2 + 3, 6, 30),
    ScreenKind.mathStep => _clamp(w / 2 + 6, 8, 40),
    ScreenKind.practice => 60.0,
    ScreenKind.summary => _clamp(w / 2, 8, 30),
  };
  var s = base;
  if (language == 'ml') s *= 1.3;
  if (child) s *= 1.1;
  s *= focusFactor;
  return s.round();
}

/// Thinking time before "Show answer" on a recall view.
const recallThinkSeconds = 4;

double _clamp(double v, double lo, double hi) => math.min(hi, math.max(lo, v));
