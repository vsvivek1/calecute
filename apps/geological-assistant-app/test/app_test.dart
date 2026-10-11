import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:geological_assistant/app_state.dart';
import 'package:geological_assistant/backend.dart';
import 'package:geological_assistant/local_store.dart';
import 'package:geological_assistant/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// The demo loads its sample from the asset bundle, which needs real time.
Future<void> waitForHome(WidgetTester tester) async {
  for (var i = 0; i < 50; i++) {
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 100)),
    );
    await tester.pump(const Duration(milliseconds: 100));
    if (find.text('Start studying').evaluate().isNotEmpty) break;
  }
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('demo: sign in, study a new card, see it counted', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final dir = Directory.systemTemp.createTempSync('ga_test');
    final store = LocalStore(prefs, dir);
    final backend = DemoBackend();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          backendProvider.overrideWithValue(backend),
          storeProvider.overrideWithValue(store),
        ],
        child: const GeologicalAssistantApp(),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Try the demo'), findsOneWidget);

    await tester.tap(find.text('Try the demo'));
    await waitForHome(tester);
    expect(find.text('30 cards today'), findsOneWidget);

    await tester.tap(find.text('Start studying'));
    await tester.pumpAndSettle();
    expect(find.text('New card'), findsOneWidget);
    await tester.tap(find.text('Got it'));
    await tester.pumpAndSettle();
    expect(find.text('Card 2 of 30'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(find.text('29 cards today'), findsOneWidget);
    expect(prefs.getString('progress:demo'), contains('interval_days'));

    // Let the delayed sync timer fire so the test ends cleanly.
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('demo: mock test opens with the timer', (tester) async {
    tester.view.physicalSize = const Size(1080, 2340);
    tester.view.devicePixelRatio = 2.6;
    addTearDown(tester.view.reset);
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = LocalStore(prefs, Directory.systemTemp.createTempSync('ga'));
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          backendProvider.overrideWithValue(DemoBackend()),
          storeProvider.overrideWithValue(store),
        ],
        child: const GeologicalAssistantApp(),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Try the demo'));
    await waitForHome(tester);
    await tester.tap(find.byIcon(Icons.timer_outlined));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Start mock test'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.textContaining('Q 1 /'), findsOneWidget);
    expect(find.text('75:00'), findsNothing); // clock shows h:mm:ss for 75 min
    expect(find.textContaining('1:1'), findsWidgets);
    await tester.tap(find.text('A.').first);
    await tester.pump();
    await tester.tap(find.text('Submit').first);
    await tester.pump(const Duration(milliseconds: 300));
    await tester.tap(find.text('Submit').last);
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpAndSettle();
    expect(find.text('Mock result'), findsOneWidget);
    await tester.pump(const Duration(seconds: 5));
  });
}
