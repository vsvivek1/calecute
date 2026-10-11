import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'backend.dart';
import 'local_store.dart';
import 'models.dart';
import 'scheduler.dart';

/// Set in `main()` before the app starts.
final backendProvider = Provider<Backend>((_) => throw UnimplementedError());
final storeProvider = Provider<LocalStore>((_) => throw UnimplementedError());

enum Phase { starting, signedOut, loading, locked, ready, error }

class AppState {
  const AppState({
    this.phase = Phase.starting,
    this.account,
    this.course = Course.fallback,
    this.content,
    this.progress = const {},
    this.attempts = const [],
    this.newToday = 0,
    this.newPerDay = 25,
    this.priorityMode = PriorityMode.highFirst,
    this.offline = false,
    this.busy = false,
    this.message,
  });

  final Phase phase;
  final Account? account;
  final Course course;
  final CourseContent? content;
  final Map<String, CardProgress> progress;
  final List<QuizAttempt> attempts;

  /// New cards started today (counts toward [newPerDay]).
  final int newToday;
  final int newPerDay;
  final PriorityMode priorityMode;

  /// Last server call failed; showing what's cached on device.
  final bool offline;
  final bool busy;
  final String? message;

  AppState copyWith({
    Phase? phase,
    Account? account,
    Course? course,
    CourseContent? content,
    Map<String, CardProgress>? progress,
    List<QuizAttempt>? attempts,
    int? newToday,
    int? newPerDay,
    PriorityMode? priorityMode,
    bool? offline,
    bool? busy,
    String? message,
    bool clearMessage = false,
  }) => AppState(
    phase: phase ?? this.phase,
    account: account ?? this.account,
    course: course ?? this.course,
    content: content ?? this.content,
    progress: progress ?? this.progress,
    attempts: attempts ?? this.attempts,
    newToday: newToday ?? this.newToday,
    newPerDay: newPerDay ?? this.newPerDay,
    priorityMode: priorityMode ?? this.priorityMode,
    offline: offline ?? this.offline,
    busy: busy ?? this.busy,
    message: clearMessage ? null : (message ?? this.message),
  );
}

final appProvider = NotifierProvider<AppController, AppState>(
  AppController.new,
);

class AppController extends Notifier<AppState> {
  Backend get _backend => ref.read(backendProvider);
  LocalStore get _store => ref.read(storeProvider);

  /// Content older than this is fetched again when online.
  static const _contentMaxAge = Duration(days: 3);

  @override
  AppState build() {
    final store = ref.read(storeProvider);
    Future.microtask(start);
    return AppState(
      course: store.readCourse() ?? Course.fallback,
      newPerDay: store.readNewPerDay() ?? 25,
      priorityMode: store.readPriorityMode(),
    );
  }

  Future<void> start() async {
    final account = _backend.currentAccount;
    if (account == null) {
      state = state.copyWith(phase: Phase.signedOut);
      return;
    }
    await _load(account);
  }

  Future<void> signIn() async {
    state = state.copyWith(busy: true, clearMessage: true);
    try {
      final account = await _backend.signIn();
      state = state.copyWith(busy: false);
      await _load(account);
    } catch (e) {
      state = state.copyWith(
        busy: false,
        phase: Phase.signedOut,
        message: 'Sign-in did not finish. Please try again.',
      );
    }
  }

  Future<void> signOut() async {
    final account = state.account;
    if (account != null) {
      await sync();
      // Paid content leaves the device; unsynced reviews stay for next time.
      await _store.clearContent(account.id);
    }
    await _backend.signOut();
    state = AppState(
      phase: Phase.signedOut,
      course: state.course,
      newPerDay: state.newPerDay,
      priorityMode: state.priorityMode,
    );
  }

  /// Checks access again (after buying on the web) and reloads.
  Future<void> reload({bool refreshContent = false}) async {
    final account = state.account ?? _backend.currentAccount;
    if (account == null) {
      state = state.copyWith(phase: Phase.signedOut);
      return;
    }
    await _load(account, refreshContent: refreshContent);
  }

  Future<void> _load(Account account, {bool refreshContent = false}) async {
    final uid = account.id;
    final now = DateTime.now();
    final cachedContent = await _store.readContent(uid);
    state = state.copyWith(
      phase: Phase.loading,
      account: account,
      progress: _store.readProgress(uid),
      attempts: _store.readAttempts(uid),
      newToday: _store.readNewToday(uid, now),
      clearMessage: true,
    );

    try {
      final course = await _backend.fetchCourse();
      await _store.writeCourse(course);
      final access = await _backend.hasAccess();
      await _store.writeAccess(uid, access);
      if (!access) {
        await _store.clearContent(uid);
        state = state.copyWith(
          phase: Phase.locked,
          course: course,
          offline: false,
        );
        return;
      }

      final savedAt = _store.contentSavedAt(uid);
      final stale = savedAt == null || now.difference(savedAt) > _contentMaxAge;
      var content = cachedContent;
      if (content == null || stale || refreshContent || _backend.isDemo) {
        content = await _backend.fetchContent();
        if (!_backend.isDemo) await _store.writeContent(uid, content);
      }

      state = state.copyWith(
        phase: Phase.ready,
        course: course,
        content: content,
        offline: false,
      );
      unawaited(sync(pull: true));
    } catch (e) {
      final hadAccess = _store.readAccess(uid) ?? false;
      if (hadAccess && cachedContent != null) {
        state = state.copyWith(
          phase: Phase.ready,
          content: cachedContent,
          offline: true,
        );
      } else {
        state = state.copyWith(
          phase: Phase.error,
          message: 'Could not reach the server. Check your connection and try again.',
        );
      }
    }
  }

  /// Saves local reviews and attempts to the server and, with [pull], brings
  /// in progress made on the website.
  Future<void> sync({bool pull = false}) async {
    final account = state.account;
    if (account == null) return;
    final uid = account.id;
    try {
      final dirty = _store.readDirty(uid);
      final progress = Map.of(state.progress);
      if (dirty.isNotEmpty) {
        await _backend.pushProgress([
          for (final id in dirty)
            if (progress[id] != null) progress[id]!,
        ]);
        await _store.writeDirty(uid, {});
      }

      final pending = _store.readAttempts(uid, pending: true);
      for (final a in pending) {
        await _backend.saveAttempt(a);
      }
      if (pending.isNotEmpty) {
        await _store.writeAttempts(uid, [], pending: true);
      }

      if (pull && !_backend.isDemo) {
        final server = await _backend.fetchProgress();
        final stillDirty = _store.readDirty(uid);
        for (final row in server) {
          final local = progress[row.cardId];
          final serverNewer =
              local == null ||
              (row.lastReviewedAt != null &&
                  (local.lastReviewedAt == null ||
                      row.lastReviewedAt!.isAfter(local.lastReviewedAt!)));
          if (serverNewer && !stillDirty.contains(row.cardId)) {
            progress[row.cardId] = row;
          }
        }
        // Keep reviews made while this sync was running.
        for (final id in stillDirty) {
          if (state.progress[id] != null) progress[id] = state.progress[id]!;
        }
        await _store.writeProgress(uid, progress);
        final attempts = await _backend.fetchAttempts();
        await _store.writeAttempts(uid, attempts);
        state = state.copyWith(
          progress: progress,
          attempts: attempts,
          offline: false,
        );
      } else {
        state = state.copyWith(offline: false);
      }
    } catch (_) {
      state = state.copyWith(offline: true);
    }
  }

  Timer? _syncTimer;

  /// Records one card review on device and schedules a server save.
  Future<void> rate(FactCard card, Rating rating) async {
    final account = state.account;
    if (account == null) return;
    final uid = account.id;
    final now = DateTime.now();
    final previous = state.progress[card.id];
    final next = review(previous, card.id, rating, now);
    final progress = {...state.progress, card.id: next};
    var newToday = _store.readNewToday(uid, now);
    if (previous == null) {
      newToday += 1;
      await _store.writeNewToday(uid, now, newToday);
    }
    state = state.copyWith(progress: progress, newToday: newToday);
    await _store.writeProgress(uid, progress);
    await _store.writeDirty(uid, {..._store.readDirty(uid), card.id});

    _syncTimer?.cancel();
    _syncTimer = Timer(const Duration(seconds: 4), () => sync());
  }

  Future<void> recordAttempt(QuizAttempt attempt) async {
    final account = state.account;
    if (account == null) return;
    final uid = account.id;
    final attempts = [attempt, ...state.attempts];
    state = state.copyWith(attempts: attempts);
    await _store.writeAttempts(uid, attempts);
    await _store.writeAttempts(uid, [
      ..._store.readAttempts(uid, pending: true),
      attempt,
    ], pending: true);
    unawaited(sync());
  }

  Future<void> setNewPerDay(int n) async {
    await _store.writeNewPerDay(n);
    state = state.copyWith(newPerDay: n);
  }

  Future<void> setPriorityMode(PriorityMode m) async {
    await _store.writePriorityMode(m);
    state = state.copyWith(priorityMode: m);
  }
}
