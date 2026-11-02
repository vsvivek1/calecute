/// Course content as the engine sees it. Course apps map their own content
/// files onto these classes; the engine never reads a course file directly.
library;

enum CardKind {
  /// One idea: learn view first, then recall question → reveal.
  fact,

  /// A worked numerical: question → steps one at a time → answer.
  math,

  /// A big topic taught one step per screen.
  steps,

  /// 2–5 short points for a topic (revision and cram). Built by the engine.
  summary;

  static CardKind parse(String raw) => switch (raw) {
        'problem' || 'math' || 'reasoning' => CardKind.math,
        'steps' => CardKind.steps,
        'summary' => CardKind.summary,
        _ => CardKind.fact,
      };

  /// Long cards take two sitting slots.
  bool get isLong => this == CardKind.math || this == CardKind.steps;
}

class StudyStep {
  const StudyStep({required this.text, this.answer, this.explain});

  /// What to do on this step ("Heat added per kg of steam").
  final String text;

  /// The working for this step, shown with the step.
  final String? answer;

  /// Why this step works. Shown on "Explain".
  final String? explain;

  factory StudyStep.fromJson(Map<String, dynamic> j) => StudyStep(
        text: (j['prompt'] ?? j['text'] ?? '') as String,
        answer: j['answer'] as String?,
        explain: j['explain'] as String?,
      );
}

class CourseCard {
  const CourseCard({
    required this.id,
    required this.section,
    required this.topic,
    required this.kind,
    required this.prompt,
    required this.answer,
    this.why,
    this.steps = const [],
    this.points = const [],
    this.highYield = false,
    this.source,
    this.order = 0,
  });

  final String id;

  /// Paper / subject number. Courses with one section use 1.
  final int section;
  final String topic;
  final CardKind kind;

  /// Fact: the question. Math: the exam-style question. Summary: the title.
  final String prompt;

  /// Fact: the answer (the key line). Math: the final answer.
  final String answer;

  /// The reason in plain words. Also the "simple explanation" shown after
  /// "Didn't get it".
  final String? why;
  final List<StudyStep> steps;

  /// Summary cards only.
  final List<String> points;

  /// Exam-frequent facts: noon flash, cram mode and the first cut to keep
  /// when time runs short.
  final bool highYield;
  final String? source;

  /// Syllabus order. Lower comes first.
  final int order;

  factory CourseCard.fromJson(Map<String, dynamic> j, {int order = 0}) =>
      CourseCard(
        id: j['id'] as String,
        section: (j['paper'] ?? j['section'] ?? 1) as int,
        topic: (j['topic'] ?? '') as String,
        kind: CardKind.parse((j['kind'] ?? 'fact') as String),
        prompt: (j['front'] ?? j['prompt'] ?? '') as String,
        answer: (j['back'] ?? j['answer'] ?? '') as String,
        why: j['explain'] as String?,
        steps: [
          for (final s in (j['steps'] as List? ?? const []))
            StudyStep.fromJson((s as Map).cast<String, dynamic>()),
        ],
        highYield: (j['flash'] ?? false) as bool,
        source: j['source'] as String?,
        order: (j['order'] as int?) ?? order,
      );
}
