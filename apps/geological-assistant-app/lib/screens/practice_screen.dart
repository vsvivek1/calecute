import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../models.dart';
import '../quiz.dart';
import '../theme.dart';
import '../widgets.dart';
import 'cards_screen.dart';
import 'quiz_screen.dart';

const unitQuizSize = 20;

/// Question ids whose most recent answer was wrong or skipped.
List<Question> recentMistakes(AppState state) {
  final content = state.content!;
  final latest = <String, bool>{};
  // Attempts are newest first, so the first answer seen for a question wins.
  for (final a in state.attempts) {
    for (final e in a.answers.entries) {
      if (latest.containsKey(e.key)) continue;
      final q = content.questionById[e.key];
      if (q == null) continue;
      latest[e.key] = e.value == q.answer;
    }
  }
  return [
    for (final e in latest.entries)
      if (!e.value) content.questionById[e.key]!,
  ];
}

class PracticeScreen extends ConsumerWidget {
  const PracticeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appProvider);
    final content = state.content!;
    final mistakes = recentMistakes(state);
    final p = Palette.of(context);

    void startQuiz(List<Question> questions, String title, String? unitId) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) =>
              QuizScreen(title: title, questions: questions, unitId: unitId),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Practice'),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(8),
          child: StrataBar(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Unit quizzes have $unitQuizSize random questions with the answer and the fact behind it after each one.',
            style: TextStyle(color: p.muted),
          ),
          const SizedBox(height: 12),
          for (final unit in content.units) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    UnitLabel(
                      unit,
                      subtitle:
                          '${content.questionsByUnit[unit.id]?.length ?? 0} questions · '
                          '${content.cards.where((c) => c.unitId == unit.id).length} cards',
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => CardsScreen(unit: unit),
                              ),
                            ),
                            child: const Text('Read cards'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: FilledButton(
                            onPressed:
                                (content.questionsByUnit[unit.id] ?? const [])
                                    .isEmpty
                                ? null
                                : () => startQuiz(
                                    buildUnitQuiz(
                                      content,
                                      unit.id,
                                      unitQuizSize,
                                      Random(),
                                    ),
                                    'Unit ${unit.number} quiz',
                                    unit.id,
                                  ),
                            child: const Text('Quiz'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
          ],
          const SectionTitle('Your mistakes'),
          Card(
            child: ListTile(
              leading: Icon(Icons.replay, color: p.bad),
              title: Text(
                mistakes.isEmpty
                    ? 'No mistakes to retry'
                    : '${mistakes.length} questions to retry',
              ),
              subtitle: const Text(
                'Questions you got wrong or skipped last time',
              ),
              trailing: const Icon(Icons.chevron_right),
              enabled: mistakes.isNotEmpty,
              onTap: () => startQuiz(
                (List.of(mistakes)..shuffle()).take(unitQuizSize).toList(),
                'Retry mistakes',
                null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
