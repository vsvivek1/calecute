import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:recallio_core/recallio_core.dart';

CourseCard fact(String id, {int section = 1, String topic = 'T', bool hy = false, int order = 0}) =>
    CourseCard(
      id: id,
      section: section,
      topic: topic,
      kind: CardKind.fact,
      prompt: 'Q $id',
      answer: 'A $id',
      highYield: hy,
      order: order,
    );

CourseCard problem(String id, {String topic = 'P', int order = 0}) => CourseCard(
      id: id,
      section: 1,
      topic: topic,
      kind: CardKind.math,
      prompt: 'Problem $id',
      answer: '42',
      steps: const [StudyStep(text: 'one'), StudyStep(text: 'two')],
      order: order,
    );

void main() {
  final now = DateTime.utc(2027, 1, 10, 6);
  final exam = DateTime(2027, 9, 24);
  SchedulerService sched() => SchedulerService(fuzz: false, random: math.Random(1));

  group('SchedulerService', () {
    test('better ratings give longer intervals on a new card', () {
      final s = sched();
      Duration gap(StudyRating r) =>
          s.review(cardId: 'c', current: null, rating: r, now: now).due.difference(now);
      expect(gap(StudyRating.simple), greaterThan(gap(StudyRating.understood)));
      expect(gap(StudyRating.understood), greaterThan(gap(StudyRating.tough)));
      expect(gap(StudyRating.tough), greaterThanOrEqualTo(gap(StudyRating.didntGet)));
    });

    test('never schedules after exam day minus three', () {
      final s = sched();
      final nearExam = DateTime(2027, 2, 1);
      final cap = DateTime.utc(2027, 1, 29);
      var p = s.review(cardId: 'c', current: null, rating: StudyRating.simple, now: now, examDate: nearExam);
      expect(p.due.isAfter(cap), isFalse);
      // Reviewing again before the cap still lands on or before it.
      p = s.review(
          cardId: 'c', current: p, rating: StudyRating.simple, now: now.add(const Duration(days: 5)), examDate: nearExam);
      expect(p.due.isAfter(cap), isFalse);
    });

    test('inside the cap window the card comes back by tomorrow', () {
      final s = sched();
      final late = DateTime.utc(2027, 9, 23, 6);
      final p = s.review(
          cardId: 'c', current: null, rating: StudyRating.simple, now: late, examDate: exam);
      expect(p.due.isAfter(late.add(const Duration(days: 1))), isFalse);
    });

    test('tracks tough history and became-easy', () {
      final s = sched();
      var p = s.review(cardId: 'c', current: null, rating: StudyRating.tough, now: now);
      p = s.review(cardId: 'c', current: p, rating: StudyRating.didntGet, now: p.due);
      expect(p.stillTough, isTrue);
      expect(p.everTough, isTrue);
      p = s.review(cardId: 'c', current: p, rating: StudyRating.understood, now: p.due);
      p = s.review(cardId: 'c', current: p, rating: StudyRating.simple, now: p.due);
      expect(p.stillTough, isFalse);
      expect(p.becameEasy, isTrue);
      expect(p.lastRatings.length, 3);
    });

    test('a still-tough card rated Tough is scheduled like Again', () {
      final s = sched();
      var p = s.review(cardId: 'c', current: null, rating: StudyRating.tough, now: now);
      p = s.review(cardId: 'c', current: p, rating: StudyRating.tough, now: p.due);
      final pushed = s.review(cardId: 'c', current: p, rating: StudyRating.tough, now: p.due);
      final again = s.review(cardId: 'c', current: p, rating: StudyRating.didntGet, now: p.due);
      expect(pushed.due, again.due);
    });

    test('honesty check: a miss counts and clears the check', () {
      final s = SchedulerService(fuzz: false, random: _AlwaysLow());
      var p = s.review(cardId: 'c', current: null, rating: StudyRating.simple, now: now);
      expect(p.honestyCheckAt, isNotNull);
      p = s.review(
          cardId: 'c', current: p, rating: StudyRating.didntGet, now: p.honestyCheckAt!, mode: ReviewMode.check);
      expect(p.honestyCheckAt, isNull);
      expect(p.honestyMisses, 1);
    });

    test('progress survives JSON', () {
      final s = sched();
      final p = s.review(cardId: 'c', current: null, rating: StudyRating.understood, now: now);
      final back = CardProgress.fromJson(p.toJson());
      expect(back.due, p.due);
      expect(back.stability, p.stability);
      expect(back.lastRatings, p.lastRatings);
    });
  });

  group('minSeconds', () {
    test('clamps short and long fact cards', () {
      expect(minSeconds(ScreenKind.factLearn, 'one two'), 5);
      expect(minSeconds(ScreenKind.factLearn, List.filled(100, 'w').join(' ')), 25);
    });
    test('slower for Malayalam and children', () {
      final text = List.filled(20, 'w').join(' ');
      final en = minSeconds(ScreenKind.factLearn, text);
      expect(minSeconds(ScreenKind.factLearn, text, language: 'ml'), greaterThan(en));
      expect(minSeconds(ScreenKind.factLearn, text, child: true), greaterThan(en));
    });
  });

  group('Planner', () {
    final cards = [for (var i = 0; i < 300; i++) fact('f$i', section: i % 2 + 1, order: i)];

    test('spreads new cards over the days left', () {
      final plan = Planner(sched()).plan(
        now: DateTime(2027, 6, 1, 7),
        examDate: exam,
        cards: cards,
        progress: const {},
        minutesPerDay: 120,
        newIntroducedToday: 0,
        doneToday: 0,
      );
      expect(plan.mode, DayMode.normal);
      expect(plan.newPerDay, greaterThan(0));
      expect(plan.newToday.length, plan.newPerDay);
      // Papers are mixed.
      expect(plan.newToday.take(2).map((id) => id).toSet().length, 2);
    });

    test('drops new cards when time is short and flags behind plan', () {
      final plan = Planner(sched()).plan(
        now: DateTime(2027, 9, 1, 7),
        examDate: exam,
        cards: cards,
        progress: const {},
        minutesPerDay: 2,
        newIntroducedToday: 0,
        doneToday: 0,
        planStart: DateTime(2027, 1, 1),
      );
      expect(plan.behindPlan, isTrue);
      expect(plan.minutesNeeded, lessThanOrEqualTo(3));
    });

    test('cram mode two days out, exam day on the day', () {
      final p = Planner(sched());
      DayMode at(DateTime d) => p
          .plan(
              now: d,
              examDate: exam,
              cards: cards,
              progress: const {},
              minutesPerDay: 30,
              newIntroducedToday: 0,
              doneToday: 0)
          .mode;
      expect(at(DateTime(2027, 9, 22, 8)), DayMode.cram);
      expect(at(DateTime(2027, 9, 24, 6)), DayMode.examDay);
      expect(at(DateTime(2027, 9, 25, 6)), DayMode.afterExam);
    });
  });

  group('SittingBuilder', () {
    final cards = {
      for (final c in [
        for (var i = 0; i < 20; i++) fact('f$i', topic: 'T${i % 3}', order: i),
        for (var i = 0; i < 4; i++) problem('m$i', order: 100 + i),
      ])
        c.id: c,
    };

    test('at most 10 slots; long cards count double', () {
      final plan = DailyPlan(
        mode: DayMode.normal,
        daysLeft: 100,
        newPerDay: 24,
        newToday: cards.keys.toList(),
        reviewsToday: const [],
        quota: 24,
        doneToday: 0,
        behindPlan: false,
        minutesNeeded: 10,
      );
      final items = SittingBuilder(sched())
          .build(plan: plan, cards: cards, progress: const {}, now: now);
      final slots = items.fold<int>(0, (n, i) => n + (cards[i.cardId]!.kind.isLong ? 2 : 1));
      expect(slots, lessThanOrEqualTo(10));
      expect(items.map((i) => i.cardId).toSet().length, items.length);
    });

    test('missed-today cards come first, then reviews and new', () {
      final plan = DailyPlan(
        mode: DayMode.normal,
        daysLeft: 100,
        newPerDay: 5,
        newToday: const ['f10', 'f11', 'f12'],
        reviewsToday: const ['f1', 'f2'],
        quota: 6,
        doneToday: 0,
        behindPlan: false,
        minutesNeeded: 5,
      );
      final items = SittingBuilder(sched()).build(
          plan: plan, cards: cards, progress: const {}, now: now, againToday: const ['f5']);
      final ids = items.map((i) => i.cardId).toSet();
      expect(ids, containsAll(['f5', 'f1', 'f2', 'f10']));
      expect(items.length, 6);
    });

    test('no sitting once the quota is done', () {
      final plan = DailyPlan(
        mode: DayMode.normal,
        daysLeft: 100,
        newPerDay: 5,
        newToday: const [],
        reviewsToday: const [],
        quota: 5,
        doneToday: 5,
        behindPlan: false,
        minutesNeeded: 0,
      );
      expect(SittingBuilder(sched()).build(plan: plan, cards: cards, progress: const {}, now: now),
          isEmpty);
    });
  });

  group('BonusRule', () {
    test('opens 90 minutes after the last sitting, at most twice', () {
      const rule = BonusRule();
      final t = DateTime(2027, 3, 1, 17);
      expect(
          rule.opensAt(
              now: t,
              lastSittingEnd: t,
              bonusDoneToday: 0,
              quietStart: 21 * 60 + 30,
              quietEnd: 6 * 60 + 30),
          DateTime(2027, 3, 1, 18, 30));
      expect(
          rule.opensAt(
              now: t, lastSittingEnd: t, bonusDoneToday: 2, quietStart: 1290, quietEnd: 390),
          isNull);
    });
    test('never in quiet hours', () {
      final t = DateTime(2027, 3, 1, 21);
      expect(
          const BonusRule().opensAt(
              now: t, lastSittingEnd: t, bonusDoneToday: 0, quietStart: 1290, quietEnd: 390),
          isNull);
    });
  });

  test('library builds topic summaries', () {
    final lib = CourseLibrary([
      fact('a', topic: 'Boilers', hy: true),
      fact('b', topic: 'Boilers'),
      fact('c', topic: 'Pumps'),
    ]);
    final sums = lib.cards.where((c) => c.kind == CardKind.summary).toList();
    expect(sums.length, 1);
    expect(sums.single.points.first, 'A a');
  });
}

class _AlwaysLow implements math.Random {
  @override
  bool nextBool() => false;
  @override
  double nextDouble() => 0.0;
  @override
  int nextInt(int max) => 0;
}
