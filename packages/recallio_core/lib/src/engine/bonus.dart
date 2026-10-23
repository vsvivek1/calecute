import '../model/learner.dart';

/// "Push more, only spaced" — learning engine §6.
class BonusRule {
  const BonusRule({this.gap = const Duration(minutes: 90), this.maxPerDay = 2});

  final Duration gap;
  final int maxPerDay;

  /// When the next bonus sitting may open, or null if none is left today.
  DateTime? opensAt({
    required DateTime now,
    required DateTime? lastSittingEnd,
    required int bonusDoneToday,
    required StudyTime quietStart,
    required StudyTime quietEnd,
  }) {
    if (bonusDoneToday >= maxPerDay) return null;
    var at = lastSittingEnd == null ? now : lastSittingEnd.add(gap);
    if (at.isBefore(now)) at = now;
    if (inQuietHours(at, quietStart, quietEnd)) return null;
    if (at.day != now.day) return null;
    return at;
  }
}

bool inQuietHours(DateTime t, StudyTime start, StudyTime end) {
  final m = t.hour * 60 + t.minute;
  return start > end ? (m >= start || m < end) : (m >= start && m < end);
}
