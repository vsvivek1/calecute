import 'dart:math' as math;

import '../model/card.dart';
import '../model/progress.dart';
import 'scheduler_service.dart';

enum DayMode {
  /// Normal days: new cards plus reviews.
  normal,

  /// About the last two weeks: reviews, only high-yield new cards.
  revision,

  /// The last two days before the exam.
  cram,

  /// The exam is today: confidence cards and the checklist.
  examDay,

  /// The exam is over: light maintenance.
  afterExam,
}

/// What today looks like. Learning engine §3 and §10.
class DailyPlan {
  const DailyPlan({
    required this.mode,
    required this.daysLeft,
    required this.newPerDay,
    required this.newToday,
    required this.reviewsToday,
    required this.quota,
    required this.doneToday,
    required this.behindPlan,
    required this.minutesNeeded,
  });

  final DayMode mode;
  final int daysLeft;
  final int newPerDay;

  /// New cards still to introduce today, in order.
  final List<String> newToday;

  /// Reviews due today, most-forgotten first (tough history first on ties).
  final List<String> reviewsToday;

  /// Total for today, counting what is already done.
  final int quota;
  final int doneToday;

  /// Today's plan needs more time than the learner gave; the report suggests
  /// another study time.
  final bool behindPlan;
  final int minutesNeeded;

  int get left => math.max(0, quota - doneToday);
  bool get complete => doneToday >= quota;
  int get sittingsLeft => (left / 10).ceil();
}

class Planner {
  Planner(this.scheduler);

  final SchedulerService scheduler;

  /// Seconds a card is expected to take. Used only for the time budget.
  static int estimateSeconds(CourseCard c, {required bool isNew}) => switch (c.kind) {
        CardKind.math || CardKind.steps => isNew ? 150 : 70,
        CardKind.summary => 30,
        CardKind.fact => isNew ? 25 : 15,
      };

  DailyPlan plan({
    required DateTime now,
    required DateTime examDate,
    required List<CourseCard> cards,
    required Map<String, CardProgress> progress,
    required int minutesPerDay,
    required int newIntroducedToday,
    required int doneToday,
    DateTime? planStart,
  }) {
    final today = DateTime(now.year, now.month, now.day);
    final exam = DateTime(examDate.year, examDate.month, examDate.day);
    final daysLeft = exam.difference(today).inDays;
    // The revision window is fixed from the day the plan started, so it does
    // not shrink as the exam gets closer.
    final start = planStart == null
        ? today
        : DateTime(planStart.year, planStart.month, planStart.day);
    final totalDays = math.max(daysLeft, exam.difference(start).inDays);
    final revisionWindow = math.min(14, (totalDays * 0.15).round());

    final mode = daysLeft < 0
        ? DayMode.afterExam
        : daysLeft == 0
            ? DayMode.examDay
            : daysLeft <= 2
                ? DayMode.cram
                : daysLeft <= revisionWindow + 2
                    ? DayMode.revision
                    : DayMode.normal;

    final byId = {for (final c in cards) c.id: c};
    final endOfDay = today.add(const Duration(days: 1));

    // Reviews due by the end of today, most-forgotten first.
    final due = <CardProgress>[
      for (final p in progress.values)
        if (byId.containsKey(p.cardId) && p.reps > 0 && p.due.isBefore(endOfDay)) p,
    ];
    due.sort((a, b) {
      final ra = scheduler.recall(a, now), rb = scheduler.recall(b, now);
      if (ra != rb) return ra.compareTo(rb);
      if (a.everTough != b.everTough) return a.everTough ? -1 : 1;
      return a.due.compareTo(b.due);
    });

    // New cards: syllabus order, papers interleaved so a day mixes subjects.
    final unseen = <int, List<CourseCard>>{};
    for (final c in cards) {
      if (c.kind == CardKind.summary) continue;
      if (progress[c.id]?.reps case final r? when r > 0) continue;
      unseen.putIfAbsent(c.section, () => []).add(c);
    }
    for (final l in unseen.values) {
      l.sort((a, b) => a.order.compareTo(b.order));
    }
    final newLeft = unseen.values.fold<int>(0, (n, l) => n + l.length);

    final learnDays = math.max(1, daysLeft - revisionWindow - 2);
    int newPerDay = switch (mode) {
      DayMode.normal => (newLeft + newIntroducedToday) == 0
          ? 0
          : ((newLeft + newIntroducedToday) / learnDays).ceil(),
      DayMode.revision => 5,
      _ => 0,
    };
    // A soft ceiling so a late start does not bury the learner.
    newPerDay = math.min(newPerDay, 60);

    final wanted = math.max(0, newPerDay - newIntroducedToday);
    final ordered = _interleave(unseen, highYieldOnly: mode == DayMode.revision);
    final newToday = ordered.take(wanted).toList();

    final reviewCap = 2 * math.max<int>(newPerDay, 10) + 20;
    final reviews = switch (mode) {
      DayMode.cram => _cramList(cards, progress),
      DayMode.examDay => _confidenceList(progress, byId, now),
      _ => due.take(reviewCap).map((p) => p.cardId).toList(),
    };

    // Time budget: drop low-yield new cards from the end first.
    var seconds = 0;
    for (final id in reviews) {
      seconds += estimateSeconds(byId[id]!, isNew: false);
    }
    for (final c in newToday) {
      seconds += estimateSeconds(c, isNew: true);
    }
    var behind = false;
    // Cram days get at least an hour; the learner studies in short sittings
    // with breaks.
    final budget = (mode == DayMode.cram ? math.max(minutesPerDay, 60) : minutesPerDay) * 60;
    if (mode == DayMode.cram) {
      while (seconds > budget && reviews.length > 10) {
        seconds -= estimateSeconds(byId[reviews.removeLast()]!, isNew: false);
      }
    }
    while (seconds > budget && newToday.isNotEmpty) {
      behind = true;
      final dropAt = newToday.lastIndexWhere((c) => !c.highYield);
      final dropped = newToday.removeAt(dropAt >= 0 ? dropAt : newToday.length - 1);
      seconds -= estimateSeconds(dropped, isNew: true);
    }

    final quota = doneToday + reviews.length + newToday.length;
    return DailyPlan(
      mode: mode,
      daysLeft: daysLeft,
      newPerDay: newPerDay,
      newToday: [for (final c in newToday) c.id],
      reviewsToday: reviews,
      quota: math.max(quota, doneToday),
      doneToday: doneToday,
      behindPlan: behind || seconds > budget,
      minutesNeeded: (seconds / 60).ceil(),
    );
  }

  /// Cram mode: every still-tough card, one summary per topic, then the
  /// high-yield facts already seen.
  List<String> _cramList(List<CourseCard> cards, Map<String, CardProgress> progress) {
    final tough = [
      for (final c in cards)
        if (progress[c.id]?.stillTough ?? false) c.id,
    ];
    final summaries = [
      for (final c in cards)
        if (c.kind == CardKind.summary) c.id,
    ];
    final highYield = [
      for (final c in cards)
        if (c.highYield && c.kind == CardKind.fact && (progress[c.id]?.reps ?? 0) > 0) c.id,
    ];
    final seen = <String>{};
    return [
      for (final id in [...tough, ...summaries, ...highYield])
        if (seen.add(id)) id,
    ];
  }

  /// Exam morning: the ten cards the learner knows best.
  List<String> _confidenceList(
      Map<String, CardProgress> progress, Map<String, CourseCard> byId, DateTime now) {
    final known = [
      for (final p in progress.values)
        if (p.reps > 0 && byId[p.cardId]?.kind == CardKind.fact) p,
    ]..sort((a, b) => scheduler.recall(b, now).compareTo(scheduler.recall(a, now)));
    return known.take(10).map((p) => p.cardId).toList();
  }

  static List<CourseCard> _interleave(Map<int, List<CourseCard>> bySection,
      {required bool highYieldOnly}) {
    final queues = [
      for (final k in (bySection.keys.toList()..sort()))
        [
          for (final c in bySection[k]!)
            if (!highYieldOnly || c.highYield) c,
        ],
    ];
    final out = <CourseCard>[];
    var i = 0;
    while (queues.any((q) => q.isNotEmpty)) {
      final q = queues[i % queues.length];
      if (q.isNotEmpty) out.add(q.removeAt(0));
      i++;
    }
    return out;
  }
}
