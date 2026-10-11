import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:historyclock/main.dart';
import 'package:historyclock/src/home_page.dart';
import 'package:historyclock/src/links.dart';

void main() {
  testWidgets('shows the name, tagline and policy links', (tester) async {
    await tester.pumpWidget(const HistoryClockApp());

    expect(find.text('History Clock'), findsOneWidget);
    expect(
      find.text('Spin the clock. Watch empires rise and fall.'),
      findsOneWidget,
    );
    for (final label in ['Privacy', 'Terms', 'Delete account', 'Contact']) {
      expect(find.text(label), findsOneWidget);
    }
  });

  testWidgets('buttons open the matching web pages', (tester) async {
    final opened = <Uri>[];
    await tester.pumpWidget(
      MaterialApp(
        home: HomePage(
          openLink: (uri) async {
            opened.add(uri);
            return true;
          },
        ),
      ),
    );

    await tester.tap(find.text('Try the map on the web'));
    await tester.ensureVisible(find.text('Delete account'));
    await tester.tap(find.text('Delete account'));
    await tester.pump();

    expect(opened, [HistoryClockLinks.map, HistoryClockLinks.deleteAccount]);
  });

  testWidgets('says so when a link cannot be opened', (tester) async {
    await tester.pumpWidget(
      MaterialApp(home: HomePage(openLink: (_) async => false)),
    );

    await tester.tap(find.text('Try the map on the web'));
    await tester.pump();

    expect(find.textContaining('Could not open'), findsOneWidget);
  });

  test('links point at the History Clock routes', () {
    expect(
      HistoryClockLinks.privacy.toString(),
      'https://calecutech.com/history-clock/privacy',
    );
    expect(
      HistoryClockLinks.deleteAccount.toString(),
      'https://calecutech.com/history-clock/delete-account',
    );
  });
}
