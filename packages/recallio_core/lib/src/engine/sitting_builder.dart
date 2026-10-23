import 'dart:math' as math;

import '../model/card.dart';
import '../model/progress.dart';
import '../model/rating.dart';
import 'planner.dart';
import 'scheduler_service.dart';

class SittingItem {
  const SittingItem(this.cardId, this.mode);
  final String cardId;
  final ReviewMode mode;

  Map<String, dynamic> toJson() => {'c': cardId, 'm': mode.name};
  factory SittingItem.fromJson(Map<String, dynamic> j) =>
      SittingItem(j['c'] as String, ReviewMode.values.byName(j['m'] as String));
}

/// Builds one sitting of at most 10 slots. Learning engine §4.
class SittingBuilder {
  SittingBuilder(this.scheduler);

  final SchedulerService scheduler;
  static const maxSlots = 10;

  List<SittingItem> build({
    required DailyPlan plan,
    required Map<String, CourseCard> cards,
    required Map<String, CardProgress> progress,
    required DateTime now,
    List<String> againToday = const [],
    int focusSize = maxSlots,
    bool bonus = false,
    List<String> bonusReviews = const [],
    List<String> bonusNew = const [],
  }) {
    final slotsTotal = math.min(maxSlots, focusSize);
    final quotaLeft = bonus ? slotsTotal : math.max(plan.left, 0);
    var slots = math.min(slotsTotal, quotaLeft);
    if (slots <= 0) return const [];

    final chosen = <SittingItem>[];
    final used = <String>{};
    int cost(String id) => (cards[id]?.kind.isLong ?? false) ? 2 : 1;
    bool add(String id, ReviewMode mode) {
      if (used.contains(id) || !cards.containsKey(id)) return false;
      final c = cost(id);
      if (c > slots && chosen.isNotEmpty) return false;
      chosen.add(SittingItem(id, mode));
      used.add(id);
      slots -= c;
      return true;
    }

    final cram = plan.mode == DayMode.cram || plan.mode == DayMode.examDay;

    // 1. Cards missed earlier today — at most 2.
    for (final id in againToday.take(2)) {
      if (slots <= 0) break;
      add(id, ReviewMode.recall);
    }

    // 2. Honesty checks that are due (1 slot each, at most 1 per sitting).
    if (!cram) {
      for (final p in progress.values) {
        if (slots <= 0) break;
        if (p.honestyCheckAt != null && !p.honestyCheckAt!.isAfter(now.toUtc())) {
          if (add(p.cardId, ReviewMode.check)) break;
        }
      }
    }

    // 3. Due reviews: up to 60% of the slots (all of them when no new cards).
    final reviews = bonus ? bonusReviews : plan.reviewsToday;
    final newIds = bonus ? bonusNew : plan.newToday;
    final reviewBudget = newIds.isEmpty ? slots : (slotsTotal * 0.6).ceil();
    var reviewSlots = 0;
    for (final id in reviews) {
      if (slots <= 0 || reviewSlots >= reviewBudget) break;
      final before = slots;
      if (add(id, cram ? ReviewMode.cram : ReviewMode.recall)) {
        reviewSlots += before - slots;
      }
    }

    // 4. New cards from today's plan.
    for (final id in newIds) {
      if (slots <= 0) break;
      add(id, ReviewMode.learn);
    }

    // Reviews again if new cards ran out and there is still room.
    for (final id in reviews) {
      if (slots <= 0) break;
      add(id, cram ? ReviewMode.cram : ReviewMode.recall);
    }

    return arrange(chosen, cards, progress, now);
  }

  /// Easiest first and last; no two of the same topic or two long cards
  /// back to back where it can be avoided.
  List<SittingItem> arrange(
    List<SittingItem> items,
    Map<String, CourseCard> cards,
    Map<String, CardProgress> progress,
    DateTime now,
  ) {
    if (items.length <= 2) return items;
    double ease(SittingItem i) {
      final c = cards[i.cardId]!;
      final p = progress[i.cardId];
      var e = p == null ? 0.6 : scheduler.recall(p, now);
      if (c.kind.isLong) e -= 0.5;
      if (p?.everTough ?? false) e -= 0.2;
      return e;
    }

    final pool = [...items]..sort((a, b) => ease(b).compareTo(ease(a)));
    final first = pool.removeAt(0);
    final last = pool.removeAt(0);
    // Hardest in the middle.
    pool.sort((a, b) => ease(a).compareTo(ease(b)));

    final out = <SittingItem>[first];
    while (pool.isNotEmpty) {
      final prev = cards[out.last.cardId]!;
      var pick = pool.indexWhere((i) {
        final c = cards[i.cardId]!;
        return c.topic != prev.topic && !(c.kind.isLong && prev.kind.isLong);
      });
      if (pick < 0) pick = 0;
      out.add(pool.removeAt(pick));
    }
    out.add(last);
    return out;
  }
}
