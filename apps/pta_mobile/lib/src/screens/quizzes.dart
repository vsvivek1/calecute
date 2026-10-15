import 'package:flutter/material.dart';

import '../format.dart';
import '../widgets.dart';

class QuizzesScreen extends StatelessWidget {
  const QuizzesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final child = app.child!;
    return Scaffold(
      appBar: AppBar(title: Text(app.t('Quizzes'))),
      body: Loader<List<Map<String, dynamic>>>(
        load: () async => asList(
          await app.api.call('child_quizzes', {'p_student': child['id']}),
        ),
        builder: (context, list, reload) => ListView(
          padding: const EdgeInsets.only(top: 12, bottom: 24),
          children: [
            Section(
              children: [
                if (list.isEmpty) const Empty('No quizzes yet.'),
                for (final q in list)
                  ListTile(
                    leading: Pill('${q['subject']}', color: brandBlue),
                    title: Text(
                      '${q['title']}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      '${q['questions']} questions${q['due_date'] != null ? ' · by ${day(q['due_date'])}' : ''}',
                    ),
                    trailing: q['submitted_at'] != null
                        ? Pill('${q['score']} / ${q['total']}', color: green)
                        : FilledButton(
                            onPressed: () => Navigator.of(context)
                                .push(
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        QuizScreen(id: '${q['id']}'),
                                  ),
                                )
                                .then((_) => reload()),
                            child: Text(app.t('Start quiz')),
                          ),
                    onTap: q['submitted_at'] != null
                        ? () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => QuizScreen(id: '${q['id']}'),
                            ),
                          )
                        : null,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Takes a quiz, or reviews it after submitting. Marking happens on the
/// server; the answer key is released for review only after submission.
class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key, required this.id});
  final String id;
  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  final Map<int, int> _answers = {};
  int _version = 0;

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final child = app.child!;
    return Scaffold(
      appBar: AppBar(title: Text(app.t('Quizzes'))),
      body: Loader<(Map<String, dynamic>, Map<String, dynamic>?)>(
        key: ValueKey(_version),
        load: () async {
          final q = (await app.api.call('quiz', {
            'p_quiz': widget.id,
          })) as Map<String, dynamic>;
          final r = (await app.api.call('quiz_review', {
            'p_quiz': widget.id,
            'p_student': child['id'],
          })) as Map<String, dynamic>?;
          return (q, r);
        },
        builder: (context, data, reload) {
          final (quiz, review) = data;
          final questions = asList(quiz['questions']);
          return ListView(
            padding: const EdgeInsets.only(bottom: 32),
            children: [
              Heading(
                '${quiz['title']}',
                sub: review == null
                    ? '${quiz['subject']} · ${questions.length} questions'
                    : 'Scored ${review['score']} of ${review['total']}. Correct answers in green.',
              ),
              for (final q in questions)
                Section(
                  title: '${q['position']}. ${q['prompt']}',
                  children: [
                    for (final (i, o) in (q['options'] as List).indexed)
                      Builder(
                        builder: (_) {
                          final pos = asInt(q['position']);
                          Color? bg;
                          if (review != null) {
                            final correct = asInt(
                              (review['correct'] as List)[pos - 1],
                            );
                            final mine = asInt(
                              (review['answers'] as List)[pos - 1],
                            );
                            if (i == correct) {
                              bg = green.withValues(alpha: 0.12);
                            } else if (i == mine) {
                              bg = red.withValues(alpha: 0.12);
                            }
                          }
                          return Container(
                            color: bg,
                            child: RadioListTile<int>(
                              value: i,
                              // ignore: deprecated_member_use
                              groupValue: review != null
                                  ? asInt((review['answers'] as List)[pos - 1])
                                  : _answers[pos],
                              // ignore: deprecated_member_use
                              onChanged: review != null
                                  ? null
                                  : (v) => setState(() => _answers[pos] = v!),
                              title: Text('$o'),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              if (review == null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: FilledButton(
                    onPressed: () async {
                      if (_answers.length < questions.length) {
                        context.toast(
                          'Please answer every question.',
                          error: true,
                        );
                        return;
                      }
                      final answers = [
                        for (var i = 1; i <= questions.length; i++) _answers[i],
                      ];
                      if (await context.act(
                        () => app.api.call('submit_quiz', {
                          'p_quiz': widget.id,
                          'p_student': child['id'],
                          'p_answers': answers,
                        }),
                        'Submitted',
                      )) {
                        setState(() => _version++);
                      }
                    },
                    child: Text(app.t('Submit')),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
