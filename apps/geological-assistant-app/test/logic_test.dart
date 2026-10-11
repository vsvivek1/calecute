import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:geological_assistant/models.dart';
import 'package:geological_assistant/quiz.dart';
import 'package:geological_assistant/scheduler.dart';

FactCard card(String id, String unit, {int tier = 2, int order = 0}) =>
    FactCard(
      id: id,
      unitId: unit,
      subtopic: '',
      statement: 'Fact $id',
      reasoning: null,
      sourceRef: null,
      verified: true,
      tier: tier,
      orderIndex: order,
    );

Question question(String id, int answer) => Question(
  id: id,
  paperCode: null,
  stem: 'Q $id',
  options: const ['a', 'b', 'c', 'd'],
  answer: answer,
);

CourseContent content({int perUnit = 30}) {
  final units = [
    for (var u = 1; u <= 5; u++)
      Unit(id: 'm$u', number: u, name: 'Unit $u', marks: 20),
  ];
  final cards = [for (var u = 1; u <= 5; u++) card('c$u', 'm$u')];
  final questions = <Question>[];
  final links = <(String, String)>[];
  for (var u = 1; u <= 5; u++) {
    for (var i = 0; i < perUnit; i++) {
      questions.add(question('q$u-$i', i % 4));
      links.add(('q$u-$i', 'c$u'));
    }
  }
  return CourseContent(
    units: units,
    cards: cards,
    questions: questions,
    links: links,
  );
}

void main() {
  final now = DateTime(2026, 10, 11, 9);

  group('SM-2', () {
    test('new card: good gives 1 day, then 6, then interval x ease', () {
      var s = review(null, 'c', Rating.good, now);
      expect(s.intervalDays, 1);
      expect(s.reps, 1);
      expect(s.dueAt, DateTime(2026, 10, 12));
      s = review(s, 'c', Rating.good, now);
      expect(s.intervalDays, 6);
      s = review(s, 'c', Rating.good, now);
      expect(s.intervalDays, 15); // 6 days x ease 2.5
      expect(s.reps, 3);
    });

    test('again resets reps and counts a lapse only after learning', () {
      final first = review(null, 'c', Rating.again, now);
      expect(first.lapses, 0);
      expect(first.reps, 0);
      final learned = review(
        review(null, 'c', Rating.good, now),
        'c',
        Rating.good,
        now,
      );
      final lapsed = review(learned, 'c', Rating.again, now);
      expect(lapsed.lapses, 1);
      expect(lapsed.reps, 0);
      expect(lapsed.intervalDays, 1);
      expect(lapsed.ease, greaterThanOrEqualTo(1.3));
    });

    test('ease never drops below 1.3', () {
      CardProgress? s;
      for (var i = 0; i < 20; i++) {
        s = review(s, 'c', Rating.again, now);
      }
      expect(s!.ease, 1.3);
    });

    test('row round trip', () {
      final s = review(null, 'c', Rating.easy, now);
      final back = CardProgress.fromRow(s.toRow('u'));
      expect(back.cardId, 'c');
      expect(back.intervalDays, s.intervalDays);
      expect(back.dueAt, s.dueAt);
    });
  });

  group('today queue', () {
    final cards = [
      card('a', 'm1', tier: 2, order: 0),
      card('b', 'm1', tier: 1, order: 1),
      card('c', 'm2', tier: 1, order: 0),
      card('d', 'm2', tier: 3, order: 1),
    ];

    test('due reviews come first, then new cards up to the allowance', () {
      final progress = {
        'd': CardProgress(cardId: 'd', dueAt: DateTime(2026, 10, 10), reps: 1),
      };
      final q = buildTodayQueue(
        cards: cards,
        progress: progress,
        now: now,
        newPerDay: 2,
        newAlreadyToday: 0,
        mode: PriorityMode.highFirst,
      );
      expect(q.first.id, 'd');
      expect(q.skip(1).map((c) => c.id).toSet(), {'b', 'c'});
    });

    test('high-only skips lower tiers; allowance already used gives none', () {
      final q = buildTodayQueue(
        cards: cards,
        progress: const {},
        now: now,
        newPerDay: 10,
        newAlreadyToday: 0,
        mode: PriorityMode.highOnly,
      );
      expect(q.map((c) => c.id).toSet(), {'b', 'c'});
      final none = buildTodayQueue(
        cards: cards,
        progress: const {},
        now: now,
        newPerDay: 3,
        newAlreadyToday: 3,
        mode: PriorityMode.syllabus,
      );
      expect(none, isEmpty);
    });

    test('cards not yet due stay out', () {
      final q = buildTodayQueue(
        cards: cards,
        progress: {
          'a': CardProgress(cardId: 'a', dueAt: DateTime(2026, 10, 20)),
        },
        now: now,
        newPerDay: 0,
        newAlreadyToday: 0,
        mode: PriorityMode.syllabus,
      );
      expect(q, isEmpty);
    });
  });

  group('quizzes', () {
    test('negative marking: 1 per right, minus a third per wrong', () {
      final qs = [question('1', 0), question('2', 1), question('3', 2)];
      final s = scoreQuiz(qs, {'1': 0, '2': 0, '3': null}, 1 / 3);
      expect(s.correct, 1);
      expect(s.wrong, 1);
      expect(s.unattempted, 1);
      expect(s.score, closeTo(2 / 3, 1e-9));
      expect(formatScore(s.score), '0.67');
      expect(formatScore(3), '3');
    });

    test('mock takes 20 from each unit and has no repeats', () {
      final c = content();
      final mock = buildMock(c, 100, Random(1));
      expect(mock.length, 100);
      expect(mock.map((q) => q.id).toSet().length, 100);
      for (var u = 1; u <= 5; u++) {
        expect(mock.where((q) => q.id.startsWith('q$u-')).length, 20);
      }
    });

    test('mock tops up from other units when one is short', () {
      final c = content(perUnit: 30);
      final short = CourseContent(
        units: c.units,
        cards: c.cards,
        questions: c.questions
            .where((q) => !q.id.startsWith('q1-') || q.id.endsWith('-0'))
            .toList(),
        links: c.links
            .where((l) => !l.$1.startsWith('q1-') || l.$1.endsWith('-0'))
            .toList(),
      );
      final mock = buildMock(short, 100, Random(2));
      expect(mock.length, 100);
      expect(mock.map((q) => q.id).toSet().length, 100);
    });

    test('unit quiz only uses that unit', () {
      final quiz = buildUnitQuiz(content(), 'm3', 20, Random(3));
      expect(quiz.length, 20);
      expect(quiz.every((q) => q.id.startsWith('q3-')), isTrue);
    });

    test('a question belongs to the unit most of its cards are in', () {
      final c = CourseContent(
        units: const [
          Unit(id: 'm1', number: 1, name: '', marks: 20),
          Unit(id: 'm2', number: 2, name: '', marks: 20),
        ],
        cards: [card('x', 'm1'), card('y', 'm2'), card('z', 'm2')],
        questions: [question('q', 0)],
        links: const [('q', 'x'), ('q', 'y'), ('q', 'z')],
      );
      expect(c.questionsByUnit['m2']!.single.id, 'q');
      expect(c.questionsByUnit['m1'], isNull);
    });

    test('reads attempts saved by the app and by the website', () {
      Map<String, dynamic> row(Object answers) => {
        'kind': 'unit',
        'module_id': null,
        'total': 2,
        'correct': 1,
        'wrong': 1,
        'score': 1,
        'answers': answers,
        'started_at': '2026-10-11T10:00:00Z',
      };
      final app = QuizAttempt.fromRow(
        row([
          {'q': 'q1', 'a': 'b'},
          {'q': 'q2', 'a': null},
        ]),
      );
      expect(app.answers, {'q1': 1, 'q2': null});
      final web = QuizAttempt.fromRow(row({'q1': 'c', 'q2': 'A'}));
      expect(web.answers, {'q1': 2, 'q2': 0});
    });

    test('verified answer wins over the official one', () {
      final q = Question.fromJson({
        'id': 'q',
        'paper_code': null,
        'stem': 's',
        'option_a': 'a',
        'option_b': 'b',
        'option_c': 'c',
        'option_d': 'd',
        'official_answer': 'a',
        'verified_answer': 'c',
      });
      expect(q.answer, 2);
    });
  });
}
