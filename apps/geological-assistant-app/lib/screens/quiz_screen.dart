import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../models.dart';
import '../quiz.dart';
import '../theme.dart';
import '../widgets.dart';

/// A practice quiz: one question at a time, answer and explanation shown
/// straight after each pick.
class QuizScreen extends ConsumerStatefulWidget {
  const QuizScreen({
    super.key,
    required this.title,
    required this.questions,
    this.unitId,
  });

  final String title;
  final List<Question> questions;
  final String? unitId;

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  final _answers = <String, int?>{};
  final _startedAt = DateTime.now();
  int _index = 0;
  QuizScore? _result;

  Future<void> _finish() async {
    final course = ref.read(appProvider).course;
    final answers = {for (final q in widget.questions) q.id: _answers[q.id]};
    final score = scoreQuiz(
      widget.questions,
      answers,
      course.negativeMarkFraction,
    );
    setState(() => _result = score);
    await ref
        .read(appProvider.notifier)
        .recordAttempt(
          QuizAttempt(
            kind: 'unit',
            unitId: widget.unitId,
            total: score.total,
            correct: score.correct,
            wrong: score.wrong,
            score: score.score,
            answers: answers,
            startedAt: _startedAt,
            finishedAt: DateTime.now(),
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final content = ref.watch(appProvider.select((s) => s.content!));
    return PopScope(
      canPop: _result != null || _answers.isEmpty,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final leave = await confirmLeave(context);
        if (leave && context.mounted) Navigator.of(context).pop();
      },
      child: Scaffold(
        appBar: AppBar(title: Text(widget.title)),
        body: SafeArea(
          child: _result != null
              ? _summary(context)
              : _question(context, content),
        ),
      ),
    );
  }

  Widget _question(BuildContext context, CourseContent content) {
    final q = widget.questions[_index];
    final picked = _answers[q.id];
    final answered = _answers.containsKey(q.id);
    final p = Palette.of(context);
    final last = _index == widget.questions.length - 1;
    return Column(
      children: [
        LinearProgressIndicator(
          value: (_index + (answered ? 1 : 0)) / widget.questions.length,
          minHeight: 4,
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Question ${_index + 1} of ${widget.questions.length}',
                style: TextStyle(color: p.muted, fontSize: 13),
              ),
              const SizedBox(height: 6),
              Text(
                q.stem,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (q.paperCode != null) ...[
                const SizedBox(height: 4),
                Text(
                  q.paperCode!,
                  style: TextStyle(color: p.muted, fontSize: 13),
                ),
              ],
              const SizedBox(height: 10),
              for (var i = 0; i < 4; i++)
                OptionTile(
                  letter: Question.letters[i],
                  text: q.options[i],
                  selected: picked == i,
                  correct: !answered
                      ? null
                      : i == q.answer
                      ? true
                      : (i == picked ? false : null),
                  onTap: answered
                      ? null
                      : () => setState(() => _answers[q.id] = i),
                ),
              if (answered) ...[
                const SizedBox(height: 12),
                for (final card in content.explanationsFor(q.id).take(2))
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: FactView(card),
                      ),
                    ),
                  ),
              ],
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Row(
            children: [
              if (!answered)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _answers[q.id] = null),
                    child: const Text('Skip'),
                  ),
                ),
              if (answered)
                Expanded(
                  child: FilledButton(
                    onPressed: last ? _finish : () => setState(() => _index++),
                    child: Text(last ? 'See result' : 'Next'),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _summary(BuildContext context) {
    final r = _result!;
    final frac = ref.read(appProvider).course.negativeMarkFraction;
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Center(child: StrataLogo(size: 64)),
        const SizedBox(height: 16),
        Text(
          '${r.correct} of ${r.total} correct',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Text(
          'Exam score with negative marking: ${formatScore(r.score)} '
          '(${r.wrong} wrong × ${formatScore(frac)}, ${r.unattempted} skipped)',
          textAlign: TextAlign.center,
          style: TextStyle(color: Palette.of(context).muted),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Done'),
        ),
      ],
    );
  }
}

Future<bool> confirmLeave(BuildContext context) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave this test?'),
        content: const Text('Your answers so far will not be saved.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Stay'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Leave'),
          ),
        ],
      ),
    ) ??
    false;
