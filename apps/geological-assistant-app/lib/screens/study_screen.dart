import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../models.dart';
import '../scheduler.dart';
import '../theme.dart';
import '../widgets.dart';

/// Works through today's queue. New cards are read and confirmed; review
/// cards are tested first, with one of their past-paper questions when the
/// card has one, then rated.
class StudyScreen extends ConsumerStatefulWidget {
  const StudyScreen({super.key, required this.queue});

  final List<FactCard> queue;

  @override
  ConsumerState<StudyScreen> createState() => _StudyScreenState();
}

class _StudyScreenState extends ConsumerState<StudyScreen> {
  late final List<FactCard> _queue = List.of(widget.queue);
  final _againCount = <String, int>{};
  final _rng = Random();
  int _index = 0;
  int _done = 0;

  // Per-card state.
  bool _revealed = false;
  Question? _question;
  int? _picked;

  @override
  void initState() {
    super.initState();
    _prepare();
  }

  void _prepare() {
    _revealed = false;
    _picked = null;
    _question = null;
    if (_index >= _queue.length) return;
    final card = _queue[_index];
    final state = ref.read(appProvider);
    if (!state.progress.containsKey(card.id)) return;
    final ids = state.content!.questionsByCard[card.id] ?? const <String>[];
    if (ids.isNotEmpty) {
      _question = state.content!.questionById[ids[_rng.nextInt(ids.length)]];
    }
  }

  Future<void> _rate(Rating rating) async {
    final card = _queue[_index];
    await ref.read(appProvider.notifier).rate(card, rating);
    final again = _againCount[card.id] ?? 0;
    if (rating == Rating.again && again < 2) {
      _againCount[card.id] = again + 1;
      _queue.add(card);
    } else {
      _done++;
    }
    setState(() {
      _index++;
      _prepare();
    });
  }

  @override
  Widget build(BuildContext context) {
    final content = ref.watch(appProvider.select((s) => s.content!));
    final finished = _index >= _queue.length;
    return Scaffold(
      appBar: AppBar(
        title: Text(
          finished ? 'Done' : 'Card ${_index + 1} of ${_queue.length}',
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: _queue.isEmpty ? 1 : _index / _queue.length,
            minHeight: 4,
          ),
        ),
      ),
      body: SafeArea(
        child: finished ? _summary(context) : _cardView(context, content),
      ),
    );
  }

  Widget _summary(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const StrataLogo(size: 72),
          const SizedBox(height: 18),
          Text(
            'Session complete',
            style: Theme.of(context).textTheme.headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Text('$_done cards studied. Cards you missed will come back soon.'),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Back to Today'),
          ),
        ],
      ),
    ),
  );

  Widget _cardView(BuildContext context, CourseContent content) {
    final card = _queue[_index];
    final unit = content.unitById(card.unitId);
    final isNew =
        !ref.read(appProvider).progress.containsKey(card.id) &&
        !_againCount.containsKey(card.id);
    final p = Palette.of(context);

    final children = <Widget>[];
    if (isNew) {
      children.addAll([
        Tag('New card', color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: FactView(card, unit: unit),
          ),
        ),
      ]);
    } else if (_question != null) {
      final q = _question!;
      children.addAll([
        if (unit != null) UnitLabel(unit),
        const SizedBox(height: 12),
        Text(
          q.stem,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
        if (q.paperCode != null) ...[
          const SizedBox(height: 4),
          Text(q.paperCode!, style: TextStyle(color: p.muted, fontSize: 13)),
        ],
        const SizedBox(height: 10),
        for (var i = 0; i < 4; i++)
          OptionTile(
            letter: Question.letters[i],
            text: q.options[i],
            selected: _picked == i,
            correct: !_revealed
                ? null
                : i == q.answer
                ? true
                : (i == _picked ? false : null),
            onTap: _revealed
                ? null
                : () => setState(() {
                    _picked = i;
                    _revealed = true;
                  }),
          ),
        if (_revealed) ...[
          const SizedBox(height: 14),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: FactView(card),
            ),
          ),
        ],
      ]);
    } else {
      children.addAll([
        if (unit != null) UnitLabel(unit),
        const SizedBox(height: 16),
        Text('Recall the fact', style: TextStyle(color: p.muted)),
        const SizedBox(height: 6),
        Text(
          card.subtopic.isEmpty ? 'This card' : card.subtopic,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 16),
        if (_revealed)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: FactView(card),
            ),
          ),
      ]);
    }

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: children,
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: _actions(isNew),
        ),
      ],
    );
  }

  Widget _actions(bool isNew) {
    if (isNew) {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => _rate(Rating.easy),
              child: const Text('Knew it already'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: FilledButton(
              onPressed: () => _rate(Rating.good),
              child: const Text('Got it'),
            ),
          ),
        ],
      );
    }
    if (!_revealed) {
      if (_question != null) {
        return Text(
          'Pick an answer to see the fact.',
          style: TextStyle(color: Palette.of(context).muted),
        );
      }
      return SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: () => setState(() => _revealed = true),
          child: const Text('Show the fact'),
        ),
      );
    }
    final wrong = _question != null && _picked != _question!.answer;
    Widget button(String label, Rating r, {bool suggested = false}) => Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 3),
        child: suggested
            ? FilledButton(onPressed: () => _rate(r), child: Text(label))
            : OutlinedButton(onPressed: () => _rate(r), child: Text(label)),
      ),
    );
    return Row(
      children: [
        button('Again', Rating.again, suggested: wrong),
        button('Hard', Rating.hard),
        button('Good', Rating.good, suggested: !wrong),
        if (!wrong) button('Easy', Rating.easy),
      ],
    );
  }
}
