import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:recallio_core/recallio_core.dart';
import 'package:recallio_core/src/ui/study_card_view.dart';

void main() {
  const math = CourseCard(
    id: 'm1',
    section: 1,
    topic: 'Boilers',
    kind: CardKind.math,
    prompt: 'Find the boiler efficiency.',
    answer: '82%',
    steps: [StudyStep(text: 'Heat output', answer: '100 kW', explain: 'Steam × enthalpy'), StudyStep(text: 'Divide')],
  );

  testWidgets('math card walks step by step, then rates once', (tester) async {
    StudyRating? rated;
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: StudyCardView(
          card: math,
          mode: ReviewMode.learn,
          progress: null,
          sectionName: 'Paper 2',
          initialScreen: 0,
          initialElapsed: 0,
          onScreen: (_, _) {},
          onRate: (r, _) => rated = r,
        ),
      ),
    ));
    expect(find.text('Find the boiler efficiency.'), findsOneWidget);
    // Locked until the minimum time passes.
    await tester.tap(find.text('Next step'));
    await tester.pump();
    expect(find.text('Heat output'), findsNothing);
    for (var screen = 0; screen < 3; screen++) {
      await tester.pump(const Duration(seconds: 41));
      await tester.tap(find.text('Next step'));
      await tester.pump();
    }
    expect(find.text('82%'), findsWidgets);
    await tester.pump(const Duration(seconds: 20));
    await tester.tap(find.text('Understood'));
    await tester.pump();
    expect(rated, StudyRating.understood);
  });
}
