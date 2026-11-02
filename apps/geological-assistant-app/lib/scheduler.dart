import 'models.dart';

/// How well the student recalled a card.
enum Rating { again, hard, good, easy }

/// One row of `user_card_state`: SM-2 state for a (user, card) pair.
class CardProgress {
  const CardProgress({
    required this.cardId,
    this.ease = 2.5,
    this.intervalDays = 0,
    this.reps = 0,
    this.lapses = 0,
    required this.dueAt,
    this.lastReviewedAt,
  });

  final String cardId;
  final double ease;
  final double intervalDays;
  final int reps;
  final int lapses;
  final DateTime dueAt;
  final DateTime? lastReviewedAt;

  /// Learned well enough to be spaced three weeks or more apart.
  bool get isMastered => intervalDays >= 21;

  bool isDue(DateTime now) => !dueAt.isAfter(endOfDay(now));

  Map<String, dynamic> toRow(String userId) => {
    'user_id': userId,
    'card_id': cardId,
    'ease': ease,
    'interval_days': intervalDays,
    'reps': reps,
    'lapses': lapses,
    'due_at': dueAt.toUtc().toIso8601String(),
    'last_reviewed_at': lastReviewedAt?.toUtc().toIso8601String(),
  };

  factory CardProgress.fromRow(Map<String, dynamic> j) => CardProgress(
    cardId: j['card_id'] as String,
    ease: (j['ease'] as num?)?.toDouble() ?? 2.5,
    intervalDays: (j['interval_days'] as num?)?.toDouble() ?? 0,
    reps: j['reps'] as int? ?? 0,
    lapses: j['lapses'] as int? ?? 0,
    dueAt: DateTime.parse(j['due_at'] as String).toLocal(),
    lastReviewedAt: j['last_reviewed_at'] == null
        ? null
        : DateTime.parse(j['last_reviewed_at'] as String).toLocal(),
  );
}

DateTime startOfDay(DateTime t) => DateTime(t.year, t.month, t.day);
DateTime endOfDay(DateTime t) =>
    DateTime(t.year, t.month, t.day, 23, 59, 59, 999);

/// SM-2, the same rules the Recallio apps use. Ratings map to SM-2 quality
/// 0 (again), 3 (hard), 4 (good) and 5 (easy).
CardProgress review(
  CardProgress? state,
  String cardId,
  Rating rating,
  DateTime now,
) {
  final s = state ?? CardProgress(cardId: cardId, dueAt: now);
  final quality = switch (rating) {
    Rating.again => 0,
    Rating.hard => 3,
    Rating.good => 4,
    Rating.easy => 5,
  };

  int reps;
  double interval;
  var lapses = s.lapses;
  if (quality < 3) {
    if (s.reps > 0) lapses += 1;
    reps = 0;
    interval = 1;
  } else {
    if (s.reps == 0) {
      interval = 1;
    } else if (s.reps == 1) {
      interval = 6;
    } else {
      interval = (s.intervalDays * s.ease).roundToDouble().clamp(1, 36500);
    }
    reps = s.reps + 1;
  }

  var ease = s.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  return CardProgress(
    cardId: cardId,
    ease: ease,
    intervalDays: interval,
    reps: reps,
    lapses: lapses,
    dueAt: startOfDay(now).add(Duration(days: interval.round())),
    lastReviewedAt: now,
  );
}

/// Which new cards to bring in first.
enum PriorityMode {
  /// High-priority cards first, then the rest in syllabus order.
  highFirst,

  /// Only high-priority cards.
  highOnly,

  /// Syllabus order, no priority sorting.
  syllabus,
}

/// Today's study queue: due reviews first (most overdue first), then new
/// cards up to what is left of the daily allowance.
List<FactCard> buildTodayQueue({
  required List<FactCard> cards,
  required Map<String, CardProgress> progress,
  required DateTime now,
  required int newPerDay,
  required int newAlreadyToday,
  required PriorityMode mode,
  Set<String>? unitIds,
}) {
  bool inScope(FactCard c) => unitIds == null || unitIds.contains(c.unitId);

  final due =
      cards
          .where((c) => inScope(c) && (progress[c.id]?.isDue(now) ?? false))
          .toList()
        ..sort(
          (a, b) => progress[a.id]!.dueAt.compareTo(progress[b.id]!.dueAt),
        );

  final unseen = cards
      .where((c) => inScope(c) && !progress.containsKey(c.id))
      .where((c) => mode != PriorityMode.highOnly || c.isHighPriority)
      .toList();
  unseen.sort((a, b) {
    if (mode == PriorityMode.highFirst && a.tier != b.tier) {
      return a.tier.compareTo(b.tier);
    }
    final byUnit = a.unitId.compareTo(b.unitId);
    if (byUnit != 0) return byUnit;
    return a.orderIndex.compareTo(b.orderIndex);
  });

  final allowance = (newPerDay - newAlreadyToday).clamp(0, unseen.length);
  return [...due, ...interleaveUnits(unseen.take(allowance).toList())];
}

/// Mixes new cards across units so a day isn't all one topic, keeping each
/// unit's own order.
List<FactCard> interleaveUnits(List<FactCard> cards) {
  final byUnit = <String, List<FactCard>>{};
  for (final c in cards) {
    byUnit.putIfAbsent(c.unitId, () => []).add(c);
  }
  final queues = byUnit.values.toList();
  final out = <FactCard>[];
  var i = 0;
  while (out.length < cards.length) {
    final q = queues[i % queues.length];
    if (q.isNotEmpty) out.add(q.removeAt(0));
    i++;
  }
  return out;
}
