import 'dart:math' as math;

import '../model/card.dart';
import '../model/progress.dart';
import '../model/rating.dart';
import 'scheduler_service.dart';

class TopicCount {
  const TopicCount(this.topic, this.count);
  final String topic;
  final int count;
}

/// The weekly report — learning engine §11. Every number comes from the
/// learner's own data; nothing here is written by AI.
class WeeklyReport {
  const WeeklyReport({
    required this.weekEnding,
    required this.daysStudied,
    required this.minutes,
    required this.cards,
    required this.becameEasy,
    required this.stillTough,
    required this.slipped,
    required this.readinessBand,
    required this.daysLeft,
    required this.markedSimpleMissed,
    this.teachBackTopic,
  });

  final DateTime weekEnding;
  final int daysStudied;
  final int minutes;
  final int cards;
  final List<TopicCount> becameEasy;
  final List<TopicCount> stillTough;
  final int slipped;

  /// Rounded to the nearest 10%, e.g. 60.
  final int readinessBand;
  final int daysLeft;
  final int markedSimpleMissed;
  final String? teachBackTopic;

  static WeeklyReport build({
    required DateTime now,
    required DateTime examDate,
    required List<ReviewEntry> log,
    required Map<String, CardProgress> progress,
    required Map<String, CourseCard> cards,
    required SchedulerService scheduler,
  }) {
    final since = now.subtract(const Duration(days: 7));
    final week = [for (final e in log) if (e.at.isAfter(since)) e];
    final days = {for (final e in week) _dayKey(e.at.toLocal())};
    final seconds = week.fold<int>(0, (n, e) => n + e.seconds);
    final weekCards = {for (final e in week) e.cardId};

    Map<String, int> countBy(bool Function(CardProgress) test) {
      final m = <String, int>{};
      for (final id in weekCards) {
        final p = progress[id], c = cards[id];
        if (p == null || c == null || c.kind == CardKind.summary) continue;
        if (test(p)) m[c.topic] = (m[c.topic] ?? 0) + 1;
      }
      return m;
    }

    List<TopicCount> sorted(Map<String, int> m) =>
        (m.entries.map((e) => TopicCount(e.key, e.value)).toList()
              ..sort((a, b) => b.count.compareTo(a.count)))
            .take(6)
            .toList();

    final easy = countBy((p) => p.becameEasy && p.honestyMisses == 0);
    final tough = countBy((p) => p.stillTough);
    final slipped = week
        .where((e) => e.rating == StudyRating.didntGet && (progress[e.cardId]?.lapses ?? 0) > 0)
        .map((e) => e.cardId)
        .toSet()
        .length;

    // Readiness = share of cards seen × average predicted recall on exam day.
    final all = [for (final c in cards.values) if (c.kind != CardKind.summary) c];
    final seen = [for (final c in all) if ((progress[c.id]?.reps ?? 0) > 0) progress[c.id]!];
    final examUtc = DateTime.utc(examDate.year, examDate.month, examDate.day);
    final recall = seen.isEmpty
        ? 0.0
        : seen.map((p) => scheduler.recall(p, examUtc)).reduce((a, b) => a + b) / seen.length;
    final readiness = all.isEmpty ? 0.0 : seen.length / all.length * recall;

    final easyList = sorted(easy);
    return WeeklyReport(
      weekEnding: now,
      daysStudied: days.length,
      minutes: (seconds / 60).round(),
      cards: weekCards.length,
      becameEasy: easyList,
      stillTough: sorted(tough),
      slipped: slipped,
      readinessBand: (readiness * 10).round() * 10,
      daysLeft: math.max(0, examUtc.difference(DateTime.utc(now.year, now.month, now.day)).inDays),
      markedSimpleMissed: week
          .where((e) => e.mode == ReviewMode.check && e.rating.isTough)
          .length,
      teachBackTopic: easyList.isEmpty ? null : easyList.first.topic,
    );
  }

  static String _dayKey(DateTime d) => '${d.year}-${d.month}-${d.day}';
}
