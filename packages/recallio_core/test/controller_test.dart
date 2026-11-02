import 'package:flutter_test/flutter_test.dart';
import 'package:recallio_core/recallio_core.dart';
import 'package:shared_preferences/shared_preferences.dart';

CourseConfig _config(DateTime exam) => CourseConfig(
      id: 'test',
      appName: 'Test',
      tagline: '',
      sections: const [CourseSection(id: 1, name: 'Paper 1', short: 'P1'), CourseSection(id: 2, name: 'Paper 2', short: 'P2')],
      exam: ExamInfo(name: 'Exam', date: exam, official: false, source: 'test', checkedOn: DateTime(2026)),
      syncRpc: 'x',
      deleteRpc: 'y',
      androidRedirect: 'x://y',
      privacyUrl: 'https://a',
      termsUrl: 'https://a',
      deleteAccountUrl: 'https://a',
      inviteUrl: 'https://a',
    );

List<CourseCard> _cards() => [
      for (var s = 1; s <= 2; s++)
        for (var i = 0; i < 60; i++)
          CourseCard(
            id: 'p$s-$i',
            section: s,
            topic: 'T${i ~/ 10}',
            kind: i % 15 == 0 ? CardKind.math : CardKind.fact,
            prompt: 'Question $i',
            answer: 'Answer $i',
            why: 'Because $i',
            highYield: i % 4 == 0,
            order: i,
          ),
    ];

void main() {
  late DateTime now;
  Future<StudyController> make() async {
    final store = await LocalStore.open('test');
    final c = StudyController(
      config: _config(DateTime(2026, 11, 20)),
      library: CourseLibrary(_cards()),
      store: store,
      clock: () => now,
    );
    await c.start();
    return c;
  }

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    now = DateTime(2026, 11, 1, 9);
  });

  test('onboarding, a full sitting, and resume after restart', () async {
    var c = await make();
    expect(c.home, HomeKind.empty);
    await c.finishOnboarding(LearnerSettings(sections: [1, 2]));
    expect(c.home, HomeKind.ready);
    expect(c.plan.quota, greaterThan(0));

    await c.startSitting();
    final s = c.sitting!;
    expect(s.items, isNotEmpty);
    final slots = s.items.fold<int>(0, (n, i) => n + (c.library.byId[i.cardId]!.kind.isLong ? 2 : 1));
    expect(slots, lessThanOrEqualTo(10));

    // Rate two cards, then "kill" the app: the same sitting resumes.
    await c.rate(StudyRating.understood, 12);
    await c.saveScreen(1, 5);
    final third = c.sitting!.current!.cardId;
    c = await make();
    expect(c.sitting!.index, 1);
    expect(c.sitting!.current!.cardId, third);
    expect(c.sitting!.screen, 1);
    expect(c.today.done, 1);

    while (c.sitting != null) {
      await c.rate(StudyRating.understood, 10);
    }
    expect(c.today.sittingsDone, 1);
    expect(c.home, anyOf(HomeKind.sittingDone, HomeKind.quotaComplete));
    expect(c.store.log.length, greaterThanOrEqualTo(s.items.length));
  });

  test("Didn't get it returns once at the end of the sitting", () async {
    final c = await make();
    await c.finishOnboarding(LearnerSettings(sections: [1]));
    await c.startSitting();
    final first = c.sitting!.current!.cardId;
    final before = c.sitting!.items.length;
    await c.rate(StudyRating.didntGet, 10);
    final after = c.sitting!.items.length;
    if (after > before) {
      expect(c.sitting!.items.last.cardId, first);
    } else {
      expect(c.today.againToday, contains(first));
    }
  });

  test('a new day resets counters and drops an old sitting', () async {
    final c = await make();
    await c.finishOnboarding(LearnerSettings(sections: [1]));
    await c.startSitting();
    await c.rate(StudyRating.simple, 10);
    now = now.add(const Duration(days: 1));
    c.resume();
    expect(c.today.done, 0);
    expect(c.sitting, isNull);
  });

  test('bonus opens 90 minutes after the last sitting', () async {
    final c = await make();
    await c.finishOnboarding(LearnerSettings(sections: [1], minutesPerDay: 15));
    while (!c.plan.complete) {
      await c.startSitting();
      while (c.sitting != null) {
        await c.rate(StudyRating.understood, 10);
      }
    }
    expect(c.home, HomeKind.quotaComplete);
    final opens = c.bonusOpensAt!;
    expect(opens.difference(now).inMinutes, 90);
    expect(c.bonusOpenNow, isFalse);
    now = now.add(const Duration(minutes: 91));
    expect(c.bonusOpenNow, isTrue);
  });

  test('a locked paper offers only its free cards until it is unlocked', () async {
    final store = await LocalStore.open('test');
    final access = PaperAccess(
      pricing: const CoursePricing(
        freeCardsPerSection: 5,
        productIds: {1: 'paper_1', 2: 'paper_2'},
        priceLabel: 'Rs 1,000',
        myPapersRpc: 'a',
        redeemRpc: 'b',
        verifyFunction: 'c',
      ),
      client: null,
      storageKey: 'test',
    );
    await access.start();
    final base = _config(DateTime(2026, 11, 20));
    final config = CourseConfig(
      id: base.id,
      appName: base.appName,
      tagline: base.tagline,
      sections: base.sections,
      exam: base.exam,
      syncRpc: base.syncRpc,
      deleteRpc: base.deleteRpc,
      androidRedirect: base.androidRedirect,
      privacyUrl: base.privacyUrl,
      termsUrl: base.termsUrl,
      deleteAccountUrl: base.deleteAccountUrl,
      inviteUrl: base.inviteUrl,
      pricing: access.pricing,
    );
    final c = StudyController(
      config: config,
      library: CourseLibrary(_cards()),
      store: store,
      access: access,
      clock: () => now,
    );
    await c.start();
    await c.finishOnboarding(LearnerSettings(sections: [1]));
    expect(c.lockedSections, [1]);
    expect(c.freeLeft(1), 5);

    // Study everything on offer: never more than the 5 free cards.
    final seen = <String>{};
    for (var day = 0; day < 5; day++) {
      now = DateTime(2026, 11, 1 + day, 9);
      c.resume();
      for (var k = 0; k < 4 && c.home != HomeKind.quotaComplete; k++) {
        await c.startSitting();
        if (c.sitting == null) break;
        while (c.sitting != null) {
          seen.add(c.sitting!.current!.cardId);
          await c.rate(StudyRating.understood, 10);
        }
      }
    }
    expect(seen.length, lessThanOrEqualTo(5));
    expect(seen.every((id) => ['p1-0', 'p1-1', 'p1-2', 'p1-3', 'p1-4'].contains(id)), isTrue);
    expect(c.freeLeft(1), 0);

    await access.setOwnedForTest({1});
    expect(c.lockedSections, isEmpty);
    expect(c.freeLeft(1), greaterThan(40));
  });
}
