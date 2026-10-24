import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets.dart';

enum CardFilter { all, highPriority, pastPaper, verify }

/// Every card in one unit, with filters for priority, past-paper cards and
/// cards flagged "verify before exam".
class CardsScreen extends ConsumerStatefulWidget {
  const CardsScreen({super.key, required this.unit});

  final Unit unit;

  @override
  ConsumerState<CardsScreen> createState() => _CardsScreenState();
}

class _CardsScreenState extends ConsumerState<CardsScreen> {
  CardFilter _filter = CardFilter.all;
  String _search = '';

  bool _matches(FactCard c) {
    final passes = switch (_filter) {
      CardFilter.all => true,
      CardFilter.highPriority => c.isHighPriority,
      CardFilter.pastPaper => c.isPastPaper,
      CardFilter.verify => !c.verified,
    };
    if (!passes) return false;
    if (_search.isEmpty) return true;
    final q = _search.toLowerCase();
    return c.statement.toLowerCase().contains(q) ||
        c.subtopic.toLowerCase().contains(q) ||
        (c.reasoning ?? '').toLowerCase().contains(q);
  }

  @override
  Widget build(BuildContext context) {
    final content = ref.watch(appProvider.select((s) => s.content!));
    final cards =
        content.cards
            .where((c) => c.unitId == widget.unit.id && _matches(c))
            .toList()
          ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    final p = Palette.of(context);

    return Scaffold(
      appBar: AppBar(title: Text('Unit ${widget.unit.number} cards')),
      body: Column(
        children: [
          Container(height: 6, color: Strata.unit(widget.unit.number)),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Search this unit',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (v) => setState(() => _search = v.trim()),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: Row(
              children: [
                for (final f in CardFilter.values)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(switch (f) {
                        CardFilter.all => 'All',
                        CardFilter.highPriority => 'High priority',
                        CardFilter.pastPaper => 'Past paper',
                        CardFilter.verify => 'Verify before exam',
                      }),
                      selected: _filter == f,
                      onSelected: (_) => setState(() => _filter = f),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                '${cards.length} cards',
                style: TextStyle(color: p.muted, fontSize: 13),
              ),
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
              itemCount: cards.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, i) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: FactView(cards[i]),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
