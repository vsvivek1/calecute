import 'dart:math' as math;

import 'package:fsrs/fsrs.dart' as fsrs;

import '../model/progress.dart';
import '../model/rating.dart';

/// Wraps the FSRS package so the rest of the engine never touches it.
///
/// Day-based: learning and relearning steps are switched off, because the
/// sitting builder already brings a "Didn't get it" card back the same day.
/// Every review is capped at exam day − 3, so each card is seen once more
/// before cram mode.
class SchedulerService {
  SchedulerService({
    double desiredRetention = 0.9,
    bool fuzz = true,
    this.examCapDays = 3,
    math.Random? random,
  })  : _random = random ?? math.Random(),
        _fsrs = fsrs.Scheduler(
          desiredRetention: desiredRetention,
          learningSteps: const [],
          relearningSteps: const [],
          maximumInterval: 3650,
          enableFuzzing: fuzz,
        );

  final fsrs.Scheduler _fsrs;
  final math.Random _random;
  final int examCapDays;

  /// About 1 in 5 first-time "So simple" ratings get an honesty check.
  static const honestyCheckChance = 0.2;

  /// Applies one rating and returns the card's new state.
  ///
  /// [mode] tells whether this was an honesty check, so a miss there counts
  /// against "So simple".
  CardProgress review({
    required String cardId,
    required CardProgress? current,
    required StudyRating rating,
    required DateTime now,
    DateTime? examDate,
    ReviewMode mode = ReviewMode.recall,
  }) {
    final nowUtc = now.toUtc();
    final p = current ?? CardProgress(cardId: cardId, due: nowUtc, updatedAt: nowUtc);
    final firstShowing = current == null || current.reps == 0;

    // "Push again": a card that is still tough has its next Tough treated as
    // Again for scheduling, so the gap shortens once.
    var schedulingRating = rating;
    if (rating == StudyRating.tough && p.stillTough) {
      schedulingRating = StudyRating.didntGet;
    }

    final before = fsrs.Card(
      cardId: stableId(cardId),
      state: fsrs.State.values.firstWhere((s) => s.value == p.fsrsState),
      step: p.fsrsStep,
      stability: p.stability,
      difficulty: p.difficulty,
      due: p.due.toUtc(),
      lastReview: p.lastReview?.toUtc(),
    );
    final (:card, reviewLog: _) = _fsrs.reviewCard(
      before,
      fsrs.Rating.values.firstWhere((r) => r.value == schedulingRating.value),
      reviewDateTime: nowUtc,
    );

    var due = card.due;
    if (examDate != null) due = capToExam(due, examDate, nowUtc);

    final ratings = [...p.lastRatings, rating.value];
    while (ratings.length > 3) {
      ratings.removeAt(0);
    }

    DateTime? honestyAt = p.honestyCheckAt;
    var honestyMisses = p.honestyMisses;
    if (mode == ReviewMode.check) {
      honestyAt = null;
      if (rating.isTough) honestyMisses++;
    } else if (firstShowing &&
        rating == StudyRating.simple &&
        _random.nextDouble() < honestyCheckChance) {
      // 1–3 days later, as a quick question.
      honestyAt = nowUtc.add(Duration(days: 1 + _random.nextInt(3)));
    }

    return CardProgress(
      cardId: cardId,
      fsrsState: card.state.value,
      fsrsStep: card.step,
      stability: card.stability,
      difficulty: card.difficulty,
      due: due,
      lastReview: nowUtc,
      reps: p.reps + 1,
      lapses: p.lapses + (p.reps > 0 && rating == StudyRating.didntGet ? 1 : 0),
      lastRatings: ratings,
      everTough: p.everTough || rating.isTough,
      toughStreak: rating.isTough ? p.toughStreak + 1 : 0,
      honestyMisses: honestyMisses,
      honestyCheckAt: honestyAt,
      firstSeen: p.firstSeen ?? nowUtc,
      updatedAt: nowUtc,
    );
  }

  /// Predicted chance the learner recalls the card now (0–1). New cards: 0.
  double recall(CardProgress p, DateTime now) {
    if (p.stability == null || p.lastReview == null) return 0;
    return _fsrs.getCardRetrievability(
      fsrs.Card(
        cardId: stableId(p.cardId),
        state: fsrs.State.values.firstWhere((s) => s.value == p.fsrsState),
        step: p.fsrsStep,
        stability: p.stability,
        difficulty: p.difficulty,
        due: p.due.toUtc(),
        lastReview: p.lastReview!.toUtc(),
      ),
      currentDateTime: now.toUtc(),
    );
  }

  /// Never schedule past exam day − [examCapDays]. Inside that window the
  /// card comes back tomorrow at the latest (cram mode takes over).
  DateTime capToExam(DateTime due, DateTime examDate, DateTime now) {
    final cap = DateTime.utc(examDate.year, examDate.month, examDate.day)
        .subtract(Duration(days: examCapDays));
    if (!due.isAfter(cap)) return due;
    if (cap.isAfter(now)) return cap;
    final tomorrow = now.add(const Duration(days: 1));
    return due.isBefore(tomorrow) ? due : tomorrow;
  }

  /// FSRS wants an int id; card ids are strings. FNV-1a, stable across runs.
  static int stableId(String id) {
    var h = 0x811c9dc5;
    for (final c in id.codeUnits) {
      h ^= c;
      h = (h * 0x01000193) & 0x7fffffff;
    }
    return h;
  }
}
