/// Plain data types that mirror the `geological_assistant` schema in Supabase.
library;

const courseId = 'geological-assistant';

class Account {
  const Account({required this.id, required this.email, required this.name});

  final String id;
  final String email;
  final String name;
}

class Course {
  const Course({
    required this.id,
    required this.name,
    required this.code,
    required this.department,
    required this.mockQuestionCount,
    required this.mockDurationMinutes,
    required this.negativeMarkFraction,
    required this.defaultPlanDays,
  });

  final String id;
  final String name;
  final String code;
  final String department;
  final int mockQuestionCount;
  final int mockDurationMinutes;
  final double negativeMarkFraction;
  final int defaultPlanDays;

  /// Used when the course row can't be read (offline before the first load).
  static const fallback = Course(
    id: courseId,
    name: 'Geological Assistant',
    code: '46/2011',
    department: 'Ground Water Department, Kerala',
    mockQuestionCount: 100,
    mockDurationMinutes: 75,
    negativeMarkFraction: 1 / 3,
    defaultPlanDays: 60,
  );

  factory Course.fromJson(Map<String, dynamic> j) => Course(
    id: j['id'] as String,
    name: j['name'] as String,
    code: j['code'] as String? ?? '',
    department: j['department'] as String? ?? '',
    mockQuestionCount: j['mock_question_count'] as int? ?? 100,
    mockDurationMinutes: j['mock_duration_minutes'] as int? ?? 75,
    negativeMarkFraction:
        (j['negative_mark_fraction'] as num?)?.toDouble() ?? 1 / 3,
    defaultPlanDays: j['default_plan_days'] as int? ?? 60,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'code': code,
    'department': department,
    'mock_question_count': mockQuestionCount,
    'mock_duration_minutes': mockDurationMinutes,
    'negative_mark_fraction': negativeMarkFraction,
    'default_plan_days': defaultPlanDays,
  };
}

class Unit {
  const Unit({
    required this.id,
    required this.number,
    required this.name,
    required this.marks,
  });

  final String id;
  final int number;
  final String name;
  final int marks;

  factory Unit.fromJson(Map<String, dynamic> j) => Unit(
    id: j['id'] as String,
    number: j['module_no'] as int,
    name: j['name'] as String,
    marks: j['marks'] as int? ?? 20,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'module_no': number,
    'name': name,
    'marks': marks,
  };
}

class FactCard {
  const FactCard({
    required this.id,
    required this.unitId,
    required this.subtopic,
    required this.statement,
    required this.reasoning,
    required this.sourceRef,
    required this.verified,
    required this.tier,
    required this.orderIndex,
  });

  final String id;
  final String unitId;
  final String subtopic;
  final String statement;
  final String? reasoning;

  /// The past paper this fact was taken from, when there is one.
  final String? sourceRef;

  /// False for the cards flagged "verify before exam".
  final bool verified;

  /// 1 = high priority (asked often), 2 = medium, 3 = low.
  final int tier;
  final int orderIndex;

  bool get isPastPaper => sourceRef != null && sourceRef!.isNotEmpty;
  bool get isHighPriority => tier == 1;

  factory FactCard.fromJson(Map<String, dynamic> j) => FactCard(
    id: j['id'] as String,
    unitId: j['module_id'] as String,
    subtopic: j['subtopic'] as String? ?? '',
    statement: j['statement'] as String,
    reasoning: j['reasoning'] as String?,
    sourceRef: j['source_ref'] as String?,
    verified: j['verified'] as bool? ?? true,
    tier: j['tier'] as int? ?? 2,
    orderIndex: j['order_index'] as int? ?? 0,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'module_id': unitId,
    'subtopic': subtopic,
    'statement': statement,
    'reasoning': reasoning,
    'source_ref': sourceRef,
    'verified': verified,
    'tier': tier,
    'order_index': orderIndex,
  };
}

class Question {
  const Question({
    required this.id,
    required this.paperCode,
    required this.stem,
    required this.options,
    required this.answer,
  });

  final String id;
  final String? paperCode;
  final String stem;

  /// Options in a, b, c, d order.
  final List<String> options;

  /// Index into [options] of the correct answer (verified answer when set).
  final int answer;

  static const letters = ['a', 'b', 'c', 'd'];

  factory Question.fromJson(Map<String, dynamic> j) {
    final key =
        (j['verified_answer'] as String?) ?? j['official_answer'] as String;
    return Question(
      id: j['id'] as String,
      paperCode: j['paper_code'] as String?,
      stem: j['stem'] as String,
      options: [
        j['option_a'] as String,
        j['option_b'] as String,
        j['option_c'] as String,
        j['option_d'] as String,
      ],
      answer: letters.indexOf(key.trim().toLowerCase()),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'paper_code': paperCode,
    'stem': stem,
    'option_a': options[0],
    'option_b': options[1],
    'option_c': options[2],
    'option_d': options[3],
    'official_answer': letters[answer],
    'verified_answer': letters[answer],
  };
}

/// Everything a paying user can study, plus the links between questions and
/// the fact cards that explain them.
class CourseContent {
  CourseContent({
    required this.units,
    required this.cards,
    required this.questions,
    required this.links,
  }) {
    for (final c in cards) {
      cardById[c.id] = c;
    }
    for (final l in links) {
      cardsByQuestion.putIfAbsent(l.$1, () => []).add(l.$2);
      questionsByCard.putIfAbsent(l.$2, () => []).add(l.$1);
    }
    for (final q in questions) {
      questionById[q.id] = q;
      final unit = _majorityUnit(q.id);
      if (unit != null) questionsByUnit.putIfAbsent(unit, () => []).add(q);
    }
  }

  final List<Unit> units;
  final List<FactCard> cards;
  final List<Question> questions;

  /// (question id, card id) pairs from `question_cards`.
  final List<(String, String)> links;

  final Map<String, FactCard> cardById = {};
  final Map<String, Question> questionById = {};
  final Map<String, List<String>> cardsByQuestion = {};
  final Map<String, List<String>> questionsByCard = {};
  final Map<String, List<Question>> questionsByUnit = {};

  /// A question belongs to the unit most of its linked cards are in.
  String? _majorityUnit(String questionId) {
    final counts = <String, int>{};
    for (final cardId in cardsByQuestion[questionId] ?? const <String>[]) {
      final card = cardById[cardId];
      if (card == null) continue;
      counts[card.unitId] = (counts[card.unitId] ?? 0) + 1;
    }
    if (counts.isEmpty) return null;
    final sorted = counts.entries.toList()
      ..sort((a, b) {
        final byCount = b.value.compareTo(a.value);
        return byCount != 0 ? byCount : a.key.compareTo(b.key);
      });
    return sorted.first.key;
  }

  Unit? unitById(String id) {
    for (final u in units) {
      if (u.id == id) return u;
    }
    return null;
  }

  List<FactCard> explanationsFor(String questionId) => [
    for (final id in cardsByQuestion[questionId] ?? const <String>[])
      if (cardById[id] != null) cardById[id]!,
  ];

  factory CourseContent.fromJson(Map<String, dynamic> j) => CourseContent(
    units: [
      for (final u in j['units'] as List)
        Unit.fromJson(u as Map<String, dynamic>),
    ]..sort((a, b) => a.number.compareTo(b.number)),
    cards: [
      for (final c in j['cards'] as List)
        FactCard.fromJson(c as Map<String, dynamic>),
    ],
    questions: [
      for (final q in j['questions'] as List)
        Question.fromJson(q as Map<String, dynamic>),
    ],
    links: [
      for (final l in j['question_cards'] as List)
        (
          (l as Map<String, dynamic>)['question_id'] as String,
          l['card_id'] as String,
        ),
    ],
  );

  Map<String, dynamic> toJson() => {
    'units': [for (final u in units) u.toJson()],
    'cards': [for (final c in cards) c.toJson()],
    'questions': [for (final q in questions) q.toJson()],
    'question_cards': [
      for (final l in links) {'question_id': l.$1, 'card_id': l.$2},
    ],
  };
}

/// One saved unit quiz or mock test (`quiz_attempts`).
class QuizAttempt {
  const QuizAttempt({
    required this.kind,
    required this.unitId,
    required this.total,
    required this.correct,
    required this.wrong,
    required this.score,
    required this.answers,
    required this.startedAt,
    required this.finishedAt,
  });

  /// 'unit' or 'mock'.
  final String kind;
  final String? unitId;
  final int total;
  final int correct;
  final int wrong;
  final double score;

  /// Question id to chosen option index (null when skipped).
  final Map<String, int?> answers;
  final DateTime startedAt;
  final DateTime finishedAt;

  int get unattempted => total - correct - wrong;

  Map<String, dynamic> toRow(String userId) => {
    'user_id': userId,
    'course_id': courseId,
    'kind': kind,
    'module_id': unitId,
    'total': total,
    'correct': correct,
    'wrong': wrong,
    'score': double.parse(score.toStringAsFixed(2)),
    'answers': [
      for (final e in answers.entries)
        {'q': e.key, 'a': e.value == null ? null : Question.letters[e.value!]},
    ],
    'started_at': startedAt.toUtc().toIso8601String(),
    'finished_at': finishedAt.toUtc().toIso8601String(),
  };

  /// The app saves `[{q, a}]`; the website saves `{question_id: 'a'}`.
  static Map<String, int?> _parseAnswers(Object? raw) {
    int? letter(Object? a) =>
        a is String ? Question.letters.indexOf(a.trim().toLowerCase()) : null;
    if (raw is List) {
      return {
        for (final a in raw.whereType<Map<String, dynamic>>())
          if (a['q'] is String) a['q'] as String: letter(a['a']),
      };
    }
    if (raw is Map<String, dynamic>) {
      return {for (final e in raw.entries) e.key: letter(e.value)};
    }
    return {};
  }

  factory QuizAttempt.fromRow(Map<String, dynamic> j) => QuizAttempt(
    kind: j['kind'] as String,
    unitId: j['module_id'] as String?,
    total: j['total'] as int,
    correct: j['correct'] as int,
    wrong: j['wrong'] as int,
    score: (j['score'] as num).toDouble(),
    answers: _parseAnswers(j['answers']),
    startedAt: DateTime.parse(j['started_at'] as String).toLocal(),
    finishedAt: DateTime.parse((j['finished_at'] ?? j['started_at']) as String)
        .toLocal(),
  );
}
