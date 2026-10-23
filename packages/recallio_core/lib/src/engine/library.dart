import '../model/card.dart';

/// The course's cards plus the summary cards the engine builds from them.
class CourseLibrary {
  CourseLibrary(List<CourseCard> cards) : cards = [...cards, ..._summaries(cards)] {
    byId = {for (final c in this.cards) c.id: c};
  }

  final List<CourseCard> cards;
  late final Map<String, CourseCard> byId;

  List<CourseCard> forSections(List<int> sections) => [
        for (final c in cards)
          if (sections.contains(c.section)) c,
      ];

  /// One summary per topic: up to four short key lines from its facts,
  /// high-yield ones first. Used in the revision window and cram mode.
  static List<CourseCard> _summaries(List<CourseCard> cards) {
    final byTopic = <String, List<CourseCard>>{};
    for (final c in cards) {
      if (c.kind != CardKind.fact) continue;
      byTopic.putIfAbsent('${c.section}|${c.topic}', () => []).add(c);
    }
    final out = <CourseCard>[];
    for (final MapEntry(:key, :value) in byTopic.entries) {
      final facts = [...value]
        ..sort((a, b) {
          if (a.highYield != b.highYield) return a.highYield ? -1 : 1;
          return a.order.compareTo(b.order);
        });
      final points = [
        for (final f in facts)
          if (f.answer.length <= 160) f.answer,
      ].take(4).toList();
      if (points.length < 2) continue;
      final section = value.first.section;
      out.add(CourseCard(
        id: 'sum:$key',
        section: section,
        topic: value.first.topic,
        kind: CardKind.summary,
        prompt: value.first.topic,
        answer: '',
        points: points,
        order: value.map((c) => c.order).reduce((a, b) => a < b ? a : b),
      ));
    }
    return out;
  }
}
