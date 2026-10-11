import 'dart:math';

import 'models.dart';

/// Picks [count] random questions from one unit.
List<Question> buildUnitQuiz(
  CourseContent content,
  String unitId,
  int count,
  Random rng,
) {
  final pool = [...?content.questionsByUnit[unitId]]..shuffle(rng);
  return pool.take(count).toList();
}

/// A mock paper: questions split across units by their marks (20 each for
/// this exam), topped up from any unit if one runs short, then shuffled.
List<Question> buildMock(CourseContent content, int count, Random rng) {
  final totalMarks = content.units.fold<int>(0, (s, u) => s + u.marks);
  final picked = <Question>[];
  final leftovers = <Question>[];
  var allotted = 0;
  for (var i = 0; i < content.units.length; i++) {
    final unit = content.units[i];
    final share = i == content.units.length - 1
        ? count - allotted
        : (count * unit.marks / (totalMarks == 0 ? 1 : totalMarks)).round();
    allotted += share;
    final pool = [...?content.questionsByUnit[unit.id]]..shuffle(rng);
    picked.addAll(pool.take(share));
    leftovers.addAll(pool.skip(share));
  }
  if (picked.length < count) {
    leftovers.shuffle(rng);
    picked.addAll(leftovers.take(count - picked.length));
  }
  return picked..shuffle(rng);
}

class QuizScore {
  const QuizScore({
    required this.total,
    required this.correct,
    required this.wrong,
    required this.score,
  });

  final int total;
  final int correct;
  final int wrong;
  final double score;

  int get unattempted => total - correct - wrong;
}

/// One mark per correct answer, minus [negativeFraction] for each wrong one.
/// Skipped questions score zero.
QuizScore scoreQuiz(
  List<Question> questions,
  Map<String, int?> answers,
  double negativeFraction,
) {
  var correct = 0;
  var wrong = 0;
  for (final q in questions) {
    final a = answers[q.id];
    if (a == null) continue;
    if (a == q.answer) {
      correct++;
    } else {
      wrong++;
    }
  }
  return QuizScore(
    total: questions.length,
    correct: correct,
    wrong: wrong,
    score: correct - wrong * negativeFraction,
  );
}

String formatScore(double score) {
  final rounded = (score * 100).round() / 100;
  return rounded == rounded.roundToDouble()
      ? rounded.toStringAsFixed(0)
      : rounded.toStringAsFixed(2);
}
