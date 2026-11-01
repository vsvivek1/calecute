import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../scheduler.dart';
import '../theme.dart';
import '../widgets.dart';
import 'study_screen.dart';

class TodayScreen extends ConsumerWidget {
  const TodayScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appProvider);
    final content = state.content!;
    final p = Palette.of(context);
    final now = DateTime.now();

    final queue = buildTodayQueue(
      cards: content.cards,
      progress: state.progress,
      now: now,
      newPerDay: state.newPerDay,
      newAlreadyToday: state.newToday,
      mode: state.priorityMode,
    );
    final due = queue.where((c) => state.progress.containsKey(c.id)).length;
    final fresh = queue.length - due;
    final studied = state.progress.length;
    final mastered = state.progress.values.where((p) => p.isMastered).length;
    final total = content.cards.length;
    final left = total - studied;
    final daysLeft = state.newPerDay == 0
        ? null
        : (left / state.newPerDay).ceil();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Today'),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(8),
          child: StrataBar(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(appProvider.notifier).sync(pull: true),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (state.offline)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Tag(
                  'Offline: reviews are saved on this phone and sync later',
                  color: p.warn,
                  icon: Icons.cloud_off,
                ),
              ),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      queue.isEmpty
                          ? 'All done for today'
                          : '${queue.length} cards today',
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      queue.isEmpty
                          ? 'Come back tomorrow, or practise a unit quiz.'
                          : '$due to review · $fresh new',
                      style: TextStyle(color: p.muted),
                    ),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: queue.isEmpty
                          ? null
                          : () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => StudyScreen(queue: queue),
                              ),
                            ),
                      icon: const Icon(Icons.play_arrow),
                      label: const Text('Start studying'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Stat('$studied', 'of $total cards started'),
                const SizedBox(width: 8),
                Stat('$mastered', 'mastered'),
                const SizedBox(width: 8),
                Stat(daysLeft == null ? '–' : '$daysLeft', 'days to cover all'),
              ],
            ),
            const SectionTitle('By unit'),
            for (final unit in content.units)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _UnitProgress(unitId: unit.id),
              ),
            const SizedBox(height: 8),
            Text(
              'New cards per day and priority order can be changed in Progress.',
              style: TextStyle(color: p.muted, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

class _UnitProgress extends ConsumerWidget {
  const _UnitProgress({required this.unitId});

  final String unitId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appProvider);
    final content = state.content!;
    final unit = content.unitById(unitId)!;
    final cards = content.cards.where((c) => c.unitId == unitId).toList();
    final started = cards.where((c) => state.progress.containsKey(c.id)).length;
    final fraction = cards.isEmpty ? 0.0 : started / cards.length;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            UnitLabel(
              unit,
              subtitle: '$started of ${cards.length} cards started',
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: fraction,
                minHeight: 8,
                color: Strata.unit(unit.number),
                backgroundColor: Palette.of(context).line,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
