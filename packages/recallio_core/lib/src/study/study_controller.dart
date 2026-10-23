import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';

import '../access/paper_access.dart';
import '../alerts/alert_service.dart';
import '../data/local_store.dart';
import '../data/sync_service.dart';
import '../engine/bonus.dart';
import '../engine/library.dart';
import '../engine/planner.dart';
import '../engine/report.dart';
import '../engine/scheduler_service.dart';
import '../engine/sitting_builder.dart';
import '../model/card.dart';
import '../model/learner.dart';
import '../model/progress.dart';
import '../model/rating.dart';
import 'course_config.dart';

/// What the feed shows when no card is open.
enum HomeKind {
  /// A sitting of today's quota is ready.
  ready,

  /// A sitting just ended; more of today's quota is left.
  sittingDone,

  /// Today's quota is done; a bonus set may open later.
  quotaComplete,

  /// Exam day, after the confidence cards.
  examMorning,

  /// The exam date has passed.
  afterExam,

  /// Nothing enrolled or nothing left in the course.
  empty,
}

/// Ties the engine, the device store, sync and alerts together for the
/// Daily Feed. The UI only reads this and calls [startSitting] / [rate].
class StudyController extends ChangeNotifier {
  StudyController({
    required this.config,
    required this.library,
    required this.store,
    this.sync,
    this.alerts,
    this.access,
    SchedulerService? scheduler,
    DateTime Function()? clock,
  })  : scheduler = scheduler ?? SchedulerService(),
        clock = clock ?? DateTime.now {
    planner = Planner(this.scheduler);
    builder = SittingBuilder(this.scheduler);
    access?.addListener(_onAccess);
  }

  void _onAccess() {
    _refresh();
    notifyListeners();
  }

  @override
  void dispose() {
    access?.removeListener(_onAccess);
    super.dispose();
  }

  final CourseConfig config;
  final CourseLibrary library;
  final LocalStore store;
  final SyncService? sync;
  final AlertService? alerts;
  final PaperAccess? access;
  final SchedulerService scheduler;
  final DateTime Function() clock;
  late final Planner planner;
  late final SittingBuilder builder;
  final bonusRule = const BonusRule();

  late DailyPlan plan;
  List<CourseCard> _enrolled = const [];

  LearnerSettings get settings => store.settings;
  bool get onboarded => settings.onboarded && settings.sections.isNotEmpty;
  DateTime get examDate => settings.examDate ?? config.exam.date;
  bool get examDateIsOfficial => settings.examDate == null && config.exam.official;
  SavedSitting? get sitting => store.sitting;
  CourseCard? get currentCard {
    final id = sitting?.current?.cardId;
    return id == null ? null : library.byId[id];
  }

  CardProgress? progressOf(String id) => store.progress[id];
  DayState get today => store.today(clock());

  // ---------------------------------------------------------------- setup

  Future<void> start() async {
    _refresh();
    notifyListeners();
    unawaited(syncNow());
    unawaited(_reschedule());
  }

  Future<void> finishOnboarding(LearnerSettings s) async {
    s.onboarded = true;
    store.settings = s;
    store.planStart ??= clock().toUtc();
    await store.saveSettings();
    _refresh();
    notifyListeners();
    unawaited(syncNow());
    unawaited(_reschedule());
  }

  Future<void> updateSettings(void Function(LearnerSettings s) change) async {
    change(store.settings);
    await store.saveSettings();
    // A new paper or exam date changes the plan; an unstarted sitting is
    // rebuilt so it matches.
    if (store.sitting != null && store.sitting!.index == 0 && store.sitting!.screen == 0) {
      store.sitting = null;
      await store.saveSitting();
    }
    _refresh();
    notifyListeners();
    unawaited(syncNow());
    unawaited(_reschedule());
  }

  Future<void> syncNow() async {
    final s = sync;
    if (s == null) return;
    final changed = await s.sync(store);
    if (changed) {
      _refresh();
      notifyListeners();
    }
  }

  void _refresh() {
    final now = clock();
    _enrolled = _accessible(library.forSections(settings.sections));
    final d = store.today(now);
    plan = planner.plan(
      now: now,
      examDate: examDate,
      cards: _enrolled,
      progress: store.progress,
      minutesPerDay: settings.minutesPerDay,
      newIntroducedToday: d.newIntroduced,
      doneToday: d.done,
      planStart: store.planStart,
    );
  }

  /// Owned papers in full; a locked paper's first free cards only (in
  /// chapter order, no topic summaries).
  List<CourseCard> _accessible(List<CourseCard> cards) {
    final a = access;
    final pr = config.pricing;
    if (a == null || pr == null) return cards;
    final used = <int, int>{};
    return [
      for (final c in cards)
        if (a.owns(c.section) ||
            (c.kind != CardKind.summary && (used[c.section] = (used[c.section] ?? 0) + 1) <= pr.freeCardsPerSection))
          c,
    ];
  }

  /// Enrolled papers this learner has not bought.
  List<int> get lockedSections {
    final a = access;
    if (a == null || config.pricing == null) return const [];
    return [for (final s in settings.sections) if (!a.owns(s)) s];
  }

  /// Free cards of a locked paper not yet started.
  int freeLeft(int section) => _enrolled
      .where((c) => c.section == section && (store.progress[c.id]?.reps ?? 0) == 0)
      .length;

  /// Re-reads the clock: call when the app returns to the foreground.
  void resume() {
    final before = today.day;
    _refresh();
    if (before != today.day) notifyListeners();
    notifyListeners();
  }

  // ---------------------------------------------------------------- home

  HomeKind get home {
    if (!onboarded || _enrolled.isEmpty) return HomeKind.empty;
    if (plan.mode == DayMode.afterExam) return HomeKind.afterExam;
    if (plan.mode == DayMode.examDay && plan.complete) return HomeKind.examMorning;
    if (plan.complete) return HomeKind.quotaComplete;
    return today.sittingsDone > 0 ? HomeKind.sittingDone : HomeKind.ready;
  }

  /// No study for more than two days: a short, friendly first sitting.
  bool get welcomeBack {
    if (store.log.isEmpty || today.sittingsDone > 0) return false;
    return clock().difference(store.log.last.at.toLocal()).inHours > 48;
  }

  /// Next study time today, or null if none is left.
  DateTime? get nextStudyTime {
    final now = clock();
    final times = [...settings.studyTimes]..sort();
    for (final t in times) {
      final at = DateTime(now.year, now.month, now.day, t ~/ 60, t % 60);
      if (at.isAfter(now)) return at;
    }
    return null;
  }

  DateTime? get bonusOpensAt => bonusRule.opensAt(
        now: clock(),
        lastSittingEnd: today.lastSittingEnd?.toLocal(),
        bonusDoneToday: today.bonusDone,
        quietStart: settings.quietStart,
        quietEnd: settings.quietEnd,
      );

  bool get bonusOpenNow {
    final at = bonusOpensAt;
    final pool = _bonusPool();
    return at != null && !at.isAfter(clock()) && (pool.reviews.isNotEmpty || pool.fresh.isNotEmpty);
  }

  /// About how many minutes the rest of today takes.
  int get minutesLeft {
    if (plan.quota == 0) return 0;
    final share = plan.left / math.max(1, plan.quota - plan.doneToday);
    return math.max(1, (plan.minutesNeeded * share).ceil());
  }

  // ---------------------------------------------------------------- report

  /// The weekly report is due on Sunday from 6 PM, once a week, after the
  /// learner has studied at least once.
  bool get reportDue {
    if (store.log.isEmpty) return false;
    final now = clock();
    final last = store.lastReportShown?.toLocal();
    final sunday = DateTime(now.year, now.month, now.day - (now.weekday % 7), 18);
    if (now.isBefore(sunday)) return last == null ? false : now.difference(last).inDays >= 7;
    return last == null || last.isBefore(sunday);
  }

  WeeklyReport buildReport() => WeeklyReport.build(
        now: clock(),
        examDate: examDate,
        log: store.log,
        progress: store.progress,
        cards: {for (final c in _enrolled) c.id: c},
        scheduler: scheduler,
      );

  Future<void> markReportSeen() async {
    store.lastReportShown = clock().toUtc();
    await store.saveMeta();
    notifyListeners();
  }

  // ---------------------------------------------------------------- sitting

  Future<void> startSitting({bool bonus = false}) async {
    if (store.sitting != null) return;
    final now = clock();
    _refresh();
    final byId = {for (final c in _enrolled) c.id: c};
    List<SittingItem> items;
    if (bonus) {
      final pool = _bonusPool();
      items = builder.build(
        plan: plan,
        cards: byId,
        progress: store.progress,
        now: now,
        bonus: true,
        bonusReviews: pool.reviews,
        bonusNew: pool.fresh,
      );
    } else {
      items = builder.build(
        plan: plan,
        cards: byId,
        progress: store.progress,
        now: now,
        againToday: today.againToday,
        focusSize: welcomeBack ? 5 : SittingBuilder.maxSlots,
      );
      if (plan.mode == DayMode.examDay) {
        items = [for (final i in items) SittingItem(i.cardId, ReviewMode.cram)];
      }
    }
    if (items.isEmpty) return;
    store.sitting = SavedSitting(items: items, bonus: bonus);
    await store.saveSitting();
    notifyListeners();
  }

  ({List<String> reviews, List<String> fresh}) _bonusPool() {
    final now = clock();
    final soon = now.add(const Duration(days: 2));
    final rated = today.ratedIds.toSet();
    final byId = {for (final c in _enrolled) c.id: c};
    final reviews = [
      for (final p in store.progress.values)
        if (byId.containsKey(p.cardId) && p.reps > 0 && !rated.contains(p.cardId) && p.due.isBefore(soon)) p,
    ]..sort((a, b) => a.due.compareTo(b.due));
    final fresh = plan.mode == DayMode.normal
        ? planner.nextNew(_enrolled, store.progress, 5, exclude: rated)
        : <String>[];
    return (reviews: [for (final p in reviews) p.cardId], fresh: fresh);
  }

  /// Saves where the learner is inside a card so a restart resumes there.
  Future<void> saveScreen(int screen, int elapsed) async {
    final s = store.sitting;
    if (s == null) return;
    s.screen = screen;
    s.elapsed = elapsed;
    await store.saveSitting();
  }

  /// One rating for the whole card, then the next card.
  Future<void> rate(StudyRating rating, int seconds) async {
    final s = store.sitting;
    final item = s?.current;
    if (s == null || item == null) return;
    final now = clock();
    final id = item.cardId;
    final current = store.progress[id];
    final wasNew = current == null || current.reps == 0;
    final next = scheduler.review(
      cardId: id,
      current: current,
      rating: rating,
      now: now,
      examDate: examDate,
      mode: item.mode,
    );
    await store.recordReview(
      next,
      ReviewEntry(cardId: id, rating: rating, mode: item.mode, seconds: seconds, at: now.toUtc()),
    );

    final d = today;
    if (!d.ratedIds.contains(id)) {
      d.ratedIds.add(id);
      if (!s.bonus) {
        d.done++;
        if (wasNew) d.newIntroduced++;
      }
    }
    d.againToday.remove(id);
    if (rating == StudyRating.didntGet) {
      // Back once at the end of this sitting if a slot is free, otherwise
      // first in the next one.
      final used = s.items.skip(s.index + 1).fold<int>(0, (n, i) => n + _cost(i.cardId));
      if (!s.returned.contains(id) && used + _cost(id) <= SittingBuilder.maxSlots - _costDone(s)) {
        s.items.add(SittingItem(id, ReviewMode.recall));
        s.returned.add(id);
      } else if (!s.returned.contains(id)) {
        d.againToday.add(id);
      }
    }

    s.index++;
    s.screen = 0;
    s.elapsed = 0;
    // Keep the quota header current card by card.
    _refresh();
    if (s.finished) {
      if (s.bonus) {
        d.bonusDone++;
      } else {
        d.sittingsDone++;
      }
      d.lastSittingEnd = now.toUtc();
      store.sitting = null;
      _refresh();
      if (plan.complete && !d.quotaCompleteShown && !s.bonus) {
        d.quotaCompleteShown = true;
        unawaited(alerts?.quotaComplete('Today ${plan.doneToday}/${plan.quota}. Well done.'));
      }
      unawaited(syncNow());
      unawaited(_reschedule());
    }
    await Future.wait([store.saveDay(), store.saveSitting()]);
    notifyListeners();
  }

  int _cost(String id) => (library.byId[id]?.kind.isLong ?? false) ? 2 : 1;
  int _costDone(SavedSitting s) => s.items.take(s.index + 1).fold<int>(0, (n, i) => n + _cost(i.cardId));

  // ---------------------------------------------------------------- alerts

  Future<void> _reschedule() async {
    final a = alerts;
    if (a == null || !onboarded) return;
    await a.schedule(
      settings: settings,
      now: clock(),
      quotaLeft: plan.left,
      minutesLeft: minutesLeft,
      flash: _flashFacts(),
    );
  }

  /// Noon flash: high-yield facts the learner has already met, one per
  /// enrolled paper, rotating by date.
  List<FlashFact> _flashFacts() {
    final out = <FlashFact>[];
    final seed = clock().difference(DateTime(2026)).inDays;
    for (var day = 0; day < 2; day++) {
      final lines = <String>[];
      for (final sec in settings.sections) {
        final pool = [
          for (final c in _enrolled)
            if (c.section == sec && c.highYield && c.kind == CardKind.fact && (store.progress[c.id]?.reps ?? 0) > 0) c,
        ];
        final fallback = [
          for (final c in _enrolled)
            if (c.section == sec && c.highYield && c.kind == CardKind.fact) c,
        ];
        final list = pool.isNotEmpty ? pool : fallback;
        if (list.isEmpty) continue;
        final c = list[(seed + day) % list.length];
        lines.add('${config.section(sec).short}: ${c.answer}');
        if (lines.length == 2) break;
      }
      if (lines.isEmpty) continue;
      out.add(FlashFact('Noon flash ⚡', lines.join('\n')));
    }
    return out;
  }

  Future<bool> requestAlertPermission() async => await alerts?.requestPermission() ?? false;

  // ---------------------------------------------------------------- account

  Future<void> deleteAllData() async {
    await sync?.deleteMyData(config.deleteRpc);
    await store.clear();
    _refresh();
    notifyListeners();
  }
}
