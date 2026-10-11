import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../config.dart';
import '../quiz.dart';
import '../scheduler.dart';
import '../theme.dart';
import '../widgets.dart';
import 'entry.dart';

class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appProvider);
    final controller = ref.read(appProvider.notifier);
    final content = state.content!;
    final p = Palette.of(context);
    final now = DateTime.now();

    final studied = state.progress.length;
    final mastered = state.progress.values.where((x) => x.isMastered).length;
    final dueTomorrow = state.progress.values
        .where((x) => x.isDue(now.add(const Duration(days: 1))))
        .length;
    final unitAttempts = state.attempts.where((a) => a.kind == 'unit').toList();
    final answered = unitAttempts.fold<int>(
      0,
      (s, a) => s + a.correct + a.wrong,
    );
    final right = unitAttempts.fold<int>(0, (s, a) => s + a.correct);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Progress'),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(8),
          child: StrataBar(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Stat('$studied', 'cards started'),
              const SizedBox(width: 8),
              Stat('$mastered', 'mastered'),
              const SizedBox(width: 8),
              Stat('$dueTomorrow', 'due by tomorrow'),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Stat('${unitAttempts.length}', 'quizzes taken'),
              const SizedBox(width: 8),
              Stat(
                answered == 0 ? '–' : '${(100 * right / answered).round()}%',
                'quiz accuracy',
              ),
            ],
          ),
          const SectionTitle('Recent quizzes'),
          if (unitAttempts.isEmpty)
            Text('No quizzes yet.', style: TextStyle(color: p.muted)),
          for (final a in unitAttempts.take(8))
            Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                dense: true,
                title: Text(
                  a.unitId == null
                      ? 'Mistakes retry'
                      : 'Unit ${content.unitById(a.unitId!)?.number ?? ''} quiz',
                ),
                subtitle: Text('${a.correct}/${a.total} right'),
                trailing: Text(
                  formatScore(a.score),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          const SectionTitle('Study settings'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('New cards per day: ${state.newPerDay}'),
                  Slider(
                    value: state.newPerDay.toDouble(),
                    min: 5,
                    max: 80,
                    divisions: 15,
                    label: '${state.newPerDay}',
                    onChanged: (v) => controller.setNewPerDay(v.round()),
                  ),
                  Text(
                    'At ${state.newPerDay} a day you cover all ${content.cards.length} cards in about ${(content.cards.length / state.newPerDay).ceil()} days.',
                    style: TextStyle(color: p.muted, fontSize: 13),
                  ),
                  const SizedBox(height: 16),
                  const Text('Order of new cards'),
                  const SizedBox(height: 8),
                  SegmentedButton<PriorityMode>(
                    showSelectedIcon: false,
                    segments: const [
                      ButtonSegment(
                        value: PriorityMode.highFirst,
                        label: Text('High first'),
                      ),
                      ButtonSegment(
                        value: PriorityMode.highOnly,
                        label: Text('High only'),
                      ),
                      ButtonSegment(
                        value: PriorityMode.syllabus,
                        label: Text('Syllabus'),
                      ),
                    ],
                    selected: {state.priorityMode},
                    onSelectionChanged: (s) =>
                        controller.setPriorityMode(s.first),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'High-priority cards are the facts asked most often in past papers.',
                    style: TextStyle(color: p.muted, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          const SectionTitle('Account'),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.person_outline),
                  title: Text(state.account?.name ?? ''),
                  subtitle: Text(state.account?.email ?? ''),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.sync),
                  title: const Text('Sync and refresh course'),
                  subtitle: Text(
                    state.offline
                        ? 'Offline right now'
                        : 'Progress is saved to your account',
                  ),
                  onTap: () => controller.reload(refreshContent: true),
                ),
                ListTile(
                  leading: const Icon(Icons.privacy_tip_outlined),
                  title: const Text('Privacy policy'),
                  onTap: () => openLink(AppConfig.privacyUrl),
                ),
                ListTile(
                  leading: const Icon(Icons.description_outlined),
                  title: const Text('Terms'),
                  onTap: () => openLink(AppConfig.termsUrl),
                ),
                ListTile(
                  leading: const Icon(Icons.help_outline),
                  title: const Text('Support'),
                  onTap: () => openLink(AppConfig.supportUrl),
                ),
                ListTile(
                  leading: const Icon(Icons.delete_outline),
                  title: const Text('Delete my account'),
                  onTap: () => openLink(AppConfig.deleteAccountUrl),
                ),
                ListTile(
                  leading: const Icon(Icons.logout),
                  title: const Text('Sign out'),
                  onTap: controller.signOut,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              '${state.course.name} · Cat. ${state.course.code}\n${state.course.department}',
              textAlign: TextAlign.center,
              style: TextStyle(color: p.muted, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
