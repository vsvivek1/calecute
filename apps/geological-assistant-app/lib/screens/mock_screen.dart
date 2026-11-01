import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../models.dart';
import '../quiz.dart';
import '../theme.dart';
import '../widgets.dart';
import 'quiz_screen.dart';

/// Mock test tab: the rules, a start button and past mock scores.
class MockScreen extends ConsumerWidget {
  const MockScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appProvider);
    final course = state.course;
    final content = state.content!;
    final p = Palette.of(context);
    final mocks = state.attempts.where((a) => a.kind == 'mock').toList();
    final available = content.questionsByUnit.values.fold<int>(
      0,
      (s, l) => s + l.length,
    );
    final count = min(course.mockQuestionCount, available);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mock test'),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(8),
          child: StrataBar(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Full mock paper',
                    style: Theme.of(context).textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 10),
                  _rule(
                    context,
                    Icons.format_list_numbered,
                    '$count questions, about equal from each unit',
                  ),
                  _rule(
                    context,
                    Icons.timer_outlined,
                    '${course.mockDurationMinutes} minutes, submits itself when time runs out',
                  ),
                  _rule(
                    context,
                    Icons.add_circle_outline,
                    '1 mark for each correct answer',
                  ),
                  _rule(
                    context,
                    Icons.remove_circle_outline,
                    '${formatScore(course.negativeMarkFraction)} mark taken off for each wrong answer. Skipped questions cost nothing.',
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: count == 0
                          ? null
                          : () => Navigator.of(context).push(
                              MaterialPageRoute(
                                fullscreenDialog: true,
                                builder: (_) => MockRunnerScreen(
                                  questions: buildMock(
                                    content,
                                    count,
                                    Random(),
                                  ),
                                  duration: Duration(
                                    minutes: course.mockDurationMinutes,
                                  ),
                                  negativeFraction: course.negativeMarkFraction,
                                ),
                              ),
                            ),
                      icon: const Icon(Icons.play_arrow),
                      label: const Text('Start mock test'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SectionTitle('Your mock scores'),
          if (mocks.isEmpty)
            Text(
              'No mock tests yet. Take one under exam conditions to see where you stand.',
              style: TextStyle(color: p.muted),
            ),
          for (final m in mocks)
            Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(
                  '${formatScore(m.score)} / ${m.total}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: Text(
                  '${m.correct} right · ${m.wrong} wrong · ${m.unattempted} skipped',
                ),
                trailing: Text(
                  _date(m.finishedAt),
                  style: TextStyle(color: p.muted, fontSize: 13),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _rule(BuildContext context, IconData icon, String text) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Palette.of(context).muted),
        const SizedBox(width: 10),
        Expanded(child: Text(text)),
      ],
    ),
  );
}

String _date(DateTime t) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${t.day} ${months[t.month - 1]}';
}

String formatClock(Duration d) {
  final s = d.inSeconds.clamp(0, 359999);
  final h = s ~/ 3600;
  final m = (s % 3600) ~/ 60;
  final sec = s % 60;
  String two(int n) => n.toString().padLeft(2, '0');
  return h > 0 ? '$h:${two(m)}:${two(sec)}' : '${two(m)}:${two(sec)}';
}

/// The timed paper. Answers can be changed or cleared until submission.
class MockRunnerScreen extends ConsumerStatefulWidget {
  const MockRunnerScreen({
    super.key,
    required this.questions,
    required this.duration,
    required this.negativeFraction,
  });

  final List<Question> questions;
  final Duration duration;
  final double negativeFraction;

  @override
  ConsumerState<MockRunnerScreen> createState() => _MockRunnerState();
}

class _MockRunnerState extends ConsumerState<MockRunnerScreen> {
  final _answers = <String, int?>{};
  final _marked = <String>{};
  final _seen = <String>{};
  late final DateTime _startedAt = DateTime.now();
  late final DateTime _deadline = _startedAt.add(widget.duration);
  Timer? _ticker;
  int _index = 0;
  bool _submitted = false;

  @override
  void initState() {
    super.initState();
    _seen.add(widget.questions.first.id);
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (DateTime.now().isAfter(_deadline)) {
        _submit();
      } else {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  void _go(int i) => setState(() {
    _index = i;
    _seen.add(widget.questions[i].id);
  });

  Future<void> _submit() async {
    if (_submitted) return;
    _submitted = true;
    _ticker?.cancel();
    final answers = {for (final q in widget.questions) q.id: _answers[q.id]};
    final score = scoreQuiz(widget.questions, answers, widget.negativeFraction);
    final attempt = QuizAttempt(
      kind: 'mock',
      unitId: null,
      total: score.total,
      correct: score.correct,
      wrong: score.wrong,
      score: score.score,
      answers: answers,
      startedAt: _startedAt,
      finishedAt: DateTime.now(),
    );
    await ref.read(appProvider.notifier).recordAttempt(attempt);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => MockResultScreen(
          questions: widget.questions,
          attempt: attempt,
          negativeFraction: widget.negativeFraction,
        ),
      ),
    );
  }

  Future<void> _confirmSubmit() async {
    final answered = _answers.values.where((v) => v != null).length;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Submit the test?'),
        content: Text(
          '$answered of ${widget.questions.length} answered'
          '${_marked.isEmpty ? '' : ', ${_marked.length} marked for review'}. '
          'Time left: ${formatClock(_deadline.difference(DateTime.now()))}.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Keep going'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
    if (ok == true) await _submit();
  }

  void _openPalette() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        final p = Palette.of(context);
        final accent = Theme.of(context).colorScheme.primary;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Wrap(
                  spacing: 12,
                  children: [
                    Tag('Answered', color: p.ok),
                    Tag('Marked', color: p.warn),
                    Tag('Not answered', color: p.muted),
                  ],
                ),
                const SizedBox(height: 12),
                Flexible(
                  child: GridView.builder(
                    shrinkWrap: true,
                    gridDelegate:
                        const SliverGridDelegateWithMaxCrossAxisExtent(
                          maxCrossAxisExtent: 52,
                          mainAxisSpacing: 6,
                          crossAxisSpacing: 6,
                        ),
                    itemCount: widget.questions.length,
                    itemBuilder: (context, i) {
                      final q = widget.questions[i];
                      final color = _marked.contains(q.id)
                          ? p.warn
                          : _answers[q.id] != null
                          ? p.ok
                          : p.muted;
                      return InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () {
                          Navigator.of(context).pop();
                          _go(i);
                        },
                        child: Container(
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color:
                                _answers[q.id] != null || _marked.contains(q.id)
                                ? color.withValues(alpha: 0.18)
                                : null,
                            border: Border.all(
                              color: i == _index ? accent : color,
                              width: i == _index ? 2 : 1,
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text('${i + 1}'),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.questions[_index];
    final left = _deadline.difference(DateTime.now());
    final p = Palette.of(context);
    final lowTime = left.inMinutes < 5;
    final last = _index == widget.questions.length - 1;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final leave = await confirmLeave(context);
        if (leave && context.mounted) Navigator.of(context).pop();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text('Q ${_index + 1} / ${widget.questions.length}'),
          actions: [
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  formatClock(left),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: lowTime ? const Color(0xFFF2867E) : null,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ),
            ),
            IconButton(
              tooltip: 'All questions',
              onPressed: _openPalette,
              icon: const Icon(Icons.grid_view),
            ),
            TextButton(
              onPressed: _confirmSubmit,
              child: const Text(
                'Submit',
                style: TextStyle(color: Color(0xFFF0E6D6)),
              ),
            ),
          ],
        ),
        body: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(
                      q.stem,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 10),
                    for (var i = 0; i < 4; i++)
                      OptionTile(
                        letter: Question.letters[i],
                        text: q.options[i],
                        selected: _answers[q.id] == i,
                        onTap: () => setState(() {
                          // Tapping the chosen option again clears it.
                          _answers[q.id] = _answers[q.id] == i ? null : i;
                        }),
                      ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Checkbox(
                          value: _marked.contains(q.id),
                          onChanged: (v) => setState(() {
                            v == true
                                ? _marked.add(q.id)
                                : _marked.remove(q.id);
                          }),
                        ),
                        const Flexible(child: Text('Mark for review')),
                        const SizedBox(width: 8),
                        if (_answers[q.id] != null) ...[
                          const Spacer(),
                          TextButton(
                            onPressed: () =>
                                setState(() => _answers[q.id] = null),
                            child: const Text('Clear'),
                          ),
                        ],
                      ],
                    ),
                    Text(
                      'Tap a chosen option again to clear it. A wrong answer costs ${formatScore(widget.negativeFraction)} mark.',
                      style: TextStyle(color: p.muted, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _index == 0 ? null : () => _go(_index - 1),
                        child: const Text('Previous'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton(
                        onPressed: last
                            ? _confirmSubmit
                            : () => _go(_index + 1),
                        child: Text(last ? 'Submit' : 'Next'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

enum _ReviewFilter { wrong, skipped, all }

class MockResultScreen extends ConsumerStatefulWidget {
  const MockResultScreen({
    super.key,
    required this.questions,
    required this.attempt,
    required this.negativeFraction,
  });

  final List<Question> questions;
  final QuizAttempt attempt;
  final double negativeFraction;

  @override
  ConsumerState<MockResultScreen> createState() => _MockResultState();
}

class _MockResultState extends ConsumerState<MockResultScreen> {
  _ReviewFilter _filter = _ReviewFilter.wrong;

  @override
  Widget build(BuildContext context) {
    final content = ref.watch(appProvider.select((s) => s.content!));
    final a = widget.attempt;
    final p = Palette.of(context);
    final taken = a.finishedAt.difference(a.startedAt);

    // Per-unit breakdown.
    final unitOf = <String, String>{
      for (final e in content.questionsByUnit.entries)
        for (final q in e.value) q.id: e.key,
    };
    final perUnit = <String, List<Question>>{};
    for (final q in widget.questions) {
      perUnit.putIfAbsent(unitOf[q.id] ?? '', () => []).add(q);
    }

    final shown = widget.questions.where((q) {
      final ans = a.answers[q.id];
      return switch (_filter) {
        _ReviewFilter.all => true,
        _ReviewFilter.skipped => ans == null,
        _ReviewFilter.wrong => ans != null && ans != q.answer,
      };
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Mock result')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  Text(
                    '${formatScore(a.score)} / ${a.total}',
                    style: Theme.of(context).textTheme.displaySmall
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${a.correct} right · ${a.wrong} wrong (−${formatScore(a.wrong * widget.negativeFraction)}) · ${a.unattempted} skipped',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Time taken ${formatClock(taken)}',
                    style: TextStyle(color: p.muted),
                  ),
                ],
              ),
            ),
          ),
          const SectionTitle('By unit'),
          for (final unit in content.units)
            if (perUnit[unit.id] != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Builder(
                  builder: (context) {
                    final qs = perUnit[unit.id]!;
                    final s = scoreQuiz(qs, a.answers, widget.negativeFraction);
                    return UnitLabel(
                      unit,
                      subtitle:
                          '${s.correct}/${s.total} right · score ${formatScore(s.score)}',
                    );
                  },
                ),
              ),
          const SectionTitle('Review answers'),
          Wrap(
            spacing: 8,
            children: [
              for (final f in _ReviewFilter.values)
                ChoiceChip(
                  label: Text(switch (f) {
                    _ReviewFilter.wrong => 'Wrong',
                    _ReviewFilter.skipped => 'Skipped',
                    _ReviewFilter.all => 'All',
                  }),
                  selected: _filter == f,
                  onSelected: (_) => setState(() => _filter = f),
                ),
            ],
          ),
          const SizedBox(height: 10),
          if (shown.isEmpty)
            Text('Nothing here.', style: TextStyle(color: p.muted)),
          for (final q in shown)
            _ReviewItem(question: q, picked: a.answers[q.id]),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }
}

class _ReviewItem extends ConsumerWidget {
  const _ReviewItem({required this.question, required this.picked});

  final Question question;
  final int? picked;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final content = ref.watch(appProvider.select((s) => s.content!));
    final q = question;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ExpansionTile(
        shape: const Border(),
        title: Text(
          q.stem,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          picked == null
              ? 'Skipped · answer ${q.answer < 0 ? '?' : Question.letters[q.answer].toUpperCase()}'
              : 'You: ${Question.letters[picked!].toUpperCase()} · answer ${Question.letters[q.answer].toUpperCase()}',
        ),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        children: [
          for (var i = 0; i < 4; i++)
            OptionTile(
              letter: Question.letters[i],
              text: q.options[i],
              onTap: null,
              correct: i == q.answer ? true : (i == picked ? false : null),
            ),
          for (final card in content.explanationsFor(q.id).take(2))
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: FactView(card),
            ),
        ],
      ),
    );
  }
}
