import 'dart:convert';
import 'dart:io';

import 'package:calecutech_pta/main.dart';
import 'package:calecutech_pta/src/api.dart';
import 'package:calecutech_pta/src/app_state.dart';
import 'package:calecutech_pta/src/screens/quizzes.dart';
import 'package:calecutech_pta/src/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Fixtures are real responses from the demo database (apps/pta), so these
// tests break if the app and the SQL disagree about a shape.
dynamic fixture(String name) =>
    jsonDecode(File('test/fixtures/$name.json').readAsStringSync());

/// Records calls and answers from fixtures.
class FakeApi implements Api {
  FakeApi(this.who);
  final String who;
  final calls = <(String, Map<String, dynamic>)>[];
  String? _email = 'someone@example.com';

  @override
  String? get email => _email;

  @override
  Future<dynamic> call(
    String fn, [
    Map<String, dynamic> args = const {},
  ]) async {
    calls.add((fn, args));
    return switch (fn) {
      'whoami' => fixture('whoami_$who'),
      'child_today' => fixture('child_today'),
      'child_fees' => fixture('child_fees'),
      'child_grades' => fixture('child_grades'),
      'child_homework' => <dynamic>[],
      'quiz' => fixture('quiz'),
      'quiz_review' => null,
      'class_register' => fixture('class_register'),
      'class_homework' => <dynamic>[],
      _ => null,
    };
  }

  @override
  Future<void> signOut() async => _email = null;
}

/// The screen's main vertical list (not the horizontal child switcher).
final vertical = find.byWidgetPredicate(
  (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
);

Future<void> scrollTo(WidgetTester tester, Finder f) async {
  await tester.scrollUntilVisible(f, 200, scrollable: vertical.first);
  await tester.pumpAndSettle();
}

Future<FakeApi> pump(WidgetTester tester, String who) async {
  SharedPreferences.setMockInitialValues({});
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 2.6;
  addTearDown(tester.view.reset);
  final api = FakeApi(who);
  final state = AppState(api);
  await state.restorePrefs();
  await tester.pumpWidget(PtaApp(state: state));
  await tester.pumpAndSettle();
  return api;
}

void main() {
  testWidgets('a parent lands on Today with what needs them first', (
    tester,
  ) async {
    await pump(tester, 'parent');
    expect(find.text('Aditi’s day'), findsOneWidget);
    expect(find.text('Needs your reply'), findsOneWidget);
    expect(
      find.textContaining('Urgent: School closed on Friday'),
      findsOneWidget,
    );
    expect(find.textContaining('Permission needed'), findsOneWidget);
    // Both children can be switched between.
    expect(find.textContaining('Aditi · Grade 5 A'), findsOneWidget);
    expect(find.textContaining('Arjun · Grade 8 B'), findsOneWidget);
  });

  testWidgets('fees show the balance in rupees and receipts', (tester) async {
    await pump(tester, 'parent');
    await tester.tap(find.text('Fees').last);
    await tester.pumpAndSettle();
    await scrollTo(tester, find.text('Receipts'));
    expect(find.text('Receipts'), findsOneWidget);
    expect(find.textContaining('₹'), findsWidgets);
    expect(find.text('Term 1 tuition'), findsWidgets);
  });

  testWidgets('switching to Malayalam relabels the tabs', (tester) async {
    await pump(tester, 'parent');
    await tester.tap(find.text('മലയാളം'));
    await tester.pumpAndSettle();
    expect(find.text('ഇന്ന്'), findsOneWidget);
    expect(find.text('ഫീസ്'), findsWidgets);
  });

  testWidgets('a teacher lands on the register with everyone present', (
    tester,
  ) async {
    final api = await pump(tester, 'teacher');
    expect(find.text('Grade 5 A register'), findsOneWidget);
    await tester.tap(find.text('A').first);
    await tester.pumpAndSettle();
    await scrollTo(tester, find.text('Save register'));
    await tester.tap(find.text('Save register'));
    await tester.pumpAndSettle();
    final (fn, args) = api.calls.firstWhere((c) => c.$1 == 'save_register');
    expect(fn, 'save_register');
    final entries = (args['p_entries'] as List).cast<Map>();
    expect(entries.where((e) => e['status'] == 'absent'), hasLength(1));
    expect(
      entries.where((e) => e['status'] == 'present'),
      hasLength(entries.length - 1),
    );
  });

  testWidgets('a quiz sends one answer per question for server-side marking', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final api = FakeApi('parent');
    final state = AppState(api);
    await state.load();
    await tester.pumpWidget(
      AppScope(
        state: state,
        child: const MaterialApp(
          home: QuizScreen(id: '00000000-0000-4000-a000-0000000000f1'),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      find.text('What is 1/2 + 1/4?'),
      findsNothing,
    ); // prompt is in the section title with its number
    expect(find.text('1. What is 1/2 + 1/4?'), findsOneWidget);
    for (final option in ['3/4', '2/3']) {
      await tester.tap(find.text(option).first);
      await tester.pumpAndSettle();
    }
    await scrollTo(tester, find.text('Submit'));
    await tester.tap(find.text('Submit'));
    await tester.pumpAndSettle();
    expect(
      api.calls.where((c) => c.$1 == 'submit_quiz'),
      isEmpty,
      reason: 'one question still unanswered',
    );
    final q3 = find.text('3. Simplify 6/8');
    await tester.scrollUntilVisible(
      q3,
      200,
      scrollable: find.byType(Scrollable).first,
    );
    final lastOption = find.descendant(
      of: find.ancestor(of: q3, matching: find.byType(Card)),
      matching: find.text('1/2'),
    );
    await tester.ensureVisible(lastOption);
    await tester.tap(lastOption);
    await tester.pumpAndSettle();
    await scrollTo(tester, find.text('Submit'));
    await tester.tap(find.text('Submit'));
    await tester.pumpAndSettle();
    final submit = api.calls.firstWhere((c) => c.$1 == 'submit_quiz').$2;
    expect(submit['p_answers'], [0, 0, 3]);
  });

  test('the demo client posts to the web app and surfaces refusals', () async {
    final seen = <Map<String, dynamic>>[];
    final api = DemoApi(
      Uri.parse('https://pta.example'),
      httpClient: MockClient((req) async {
        seen.add(jsonDecode(req.body) as Map<String, dynamic>);
        expect(req.url.toString(), 'https://pta.example/api/demo/rpc');
        return http.Response(
          jsonEncode({'error': 'new row violates row-level security policy'}),
          400,
        );
      }),
    );
    api.signInAs('parent@example.com');
    await expectLater(
      api.call('read_notice', {'p_notice': 'x'}),
      throwsA(
        isA<ApiException>().having(
          (e) => e.message,
          'message',
          'Your account is not allowed to do that.',
        ),
      ),
    );
    expect(seen.single, {
      'fn': 'read_notice',
      'args': {'p_notice': 'x'},
      'as': 'parent@example.com',
    });
  });
}
