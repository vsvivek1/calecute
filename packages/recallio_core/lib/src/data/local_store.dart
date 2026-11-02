import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../engine/sitting_builder.dart';
import '../model/learner.dart';
import '../model/progress.dart';

/// Today's counters. They reset when the local date changes.
class DayState {
  DayState({
    required this.day,
    this.done = 0,
    this.newIntroduced = 0,
    List<String>? ratedIds,
    List<String>? againToday,
    this.sittingsDone = 0,
    this.bonusDone = 0,
    this.lastSittingEnd,
    this.quotaCompleteShown = false,
  })  : ratedIds = ratedIds ?? <String>[],
        againToday = againToday ?? <String>[];

  /// Local date, yyyy-mm-dd.
  final String day;
  int done;
  int newIntroduced;

  /// Cards rated at least once today (a card counts once toward the quota).
  List<String> ratedIds;

  /// Rated "Didn't get it" today and not yet shown again.
  List<String> againToday;
  int sittingsDone;
  int bonusDone;
  DateTime? lastSittingEnd;
  bool quotaCompleteShown;

  static String keyFor(DateTime local) =>
      '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')}';

  Map<String, dynamic> toJson() => {
        'day': day,
        'done': done,
        'new': newIntroduced,
        'rated': ratedIds,
        'again': againToday,
        'sittings': sittingsDone,
        'bonus': bonusDone,
        if (lastSittingEnd != null) 'last': lastSittingEnd!.toUtc().toIso8601String(),
        'qc': quotaCompleteShown,
      };

  factory DayState.fromJson(Map<String, dynamic> j) => DayState(
        day: j['day'] as String,
        done: j['done'] as int? ?? 0,
        newIntroduced: j['new'] as int? ?? 0,
        ratedIds: [for (final s in (j['rated'] as List? ?? const [])) s as String],
        againToday: [for (final s in (j['again'] as List? ?? const [])) s as String],
        sittingsDone: j['sittings'] as int? ?? 0,
        bonusDone: j['bonus'] as int? ?? 0,
        lastSittingEnd: j['last'] == null ? null : DateTime.parse(j['last'] as String),
        quotaCompleteShown: j['qc'] as bool? ?? false,
      );
}

/// The sitting in progress. Saved after every step so killing the app
/// resumes on the same card and screen.
class SavedSitting {
  SavedSitting({
    required this.items,
    this.index = 0,
    this.screen = 0,
    this.elapsed = 0,
    this.bonus = false,
    List<String>? returned,
  }) : returned = returned ?? <String>[];

  final List<SittingItem> items;
  int index;

  /// Screen within the card (multi-step cards).
  int screen;

  /// Seconds already spent on the current screen.
  int elapsed;
  final bool bonus;

  /// Cards already sent back to the end of this sitting once.
  final List<String> returned;

  bool get finished => index >= items.length;
  SittingItem? get current => finished ? null : items[index];

  Map<String, dynamic> toJson() => {
        'items': [for (final i in items) i.toJson()],
        'i': index,
        'sc': screen,
        'e': elapsed,
        'b': bonus,
        'ret': returned,
      };

  factory SavedSitting.fromJson(Map<String, dynamic> j) => SavedSitting(
        items: [
          for (final i in (j['items'] as List)) SittingItem.fromJson((i as Map).cast<String, dynamic>()),
        ],
        index: j['i'] as int? ?? 0,
        screen: j['sc'] as int? ?? 0,
        elapsed: j['e'] as int? ?? 0,
        bonus: j['b'] as bool? ?? false,
        returned: [for (final s in (j['ret'] as List? ?? const [])) s as String],
      );
}

/// Everything the app keeps on the device. Offline first: the feed works
/// from here and [SyncService] copies changes to Supabase when it can.
///
/// Backed by shared_preferences (a JSON blob per kind). A full course is a
/// few thousand small records, well within what it handles on Android and
/// in the browser's localStorage.
class LocalStore {
  LocalStore._(this._prefs, this._prefix);

  static Future<LocalStore> open(String courseId) async {
    final prefs = await SharedPreferences.getInstance();
    final s = LocalStore._(prefs, 'recallio.$courseId.');
    s._load();
    return s;
  }

  final SharedPreferences _prefs;
  final String _prefix;

  late Map<String, CardProgress> progress;
  late List<ReviewEntry> log;
  late LearnerSettings settings;
  DateTime settingsUpdatedAt = DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
  DayState? day;
  SavedSitting? sitting;
  DateTime? planStart;
  DateTime? lastReportShown;

  /// Cards changed since the last successful sync.
  final Set<String> dirty = {};

  /// Log rows not yet sent.
  int unsentLogFrom = 0;
  bool settingsDirty = false;
  DateTime? lastServerSync;

  String _k(String name) => '$_prefix$name';

  Map<String, dynamic>? _json(String name) {
    final raw = _prefs.getString(_k(name));
    if (raw == null) return null;
    try {
      return (jsonDecode(raw) as Map).cast<String, dynamic>();
    } catch (_) {
      return null;
    }
  }

  void _load() {
    final p = _json('progress') ?? const {};
    progress = {
      for (final e in p.entries) e.key: CardProgress.fromJson((e.value as Map).cast<String, dynamic>()),
    };
    final l = _prefs.getString(_k('log'));
    log = l == null
        ? <ReviewEntry>[]
        : [for (final e in jsonDecode(l) as List) ReviewEntry.fromJson((e as Map).cast<String, dynamic>())];
    final s = _json('settings');
    settings = s == null ? LearnerSettings() : LearnerSettings.fromJson(s);
    final meta = _json('meta') ?? const {};
    settingsUpdatedAt = _date(meta['settingsAt']) ?? settingsUpdatedAt;
    planStart = _date(meta['planStart']);
    lastReportShown = _date(meta['report']);
    lastServerSync = _date(meta['sync']);
    unsentLogFrom = meta['logFrom'] as int? ?? 0;
    settingsDirty = meta['settingsDirty'] as bool? ?? false;
    dirty.addAll([for (final d in (meta['dirty'] as List? ?? const [])) d as String]);
    final d = _json('day');
    day = d == null ? null : DayState.fromJson(d);
    final st = _json('sitting');
    sitting = st == null ? null : SavedSitting.fromJson(st);
  }

  static DateTime? _date(Object? v) => v == null ? null : DateTime.tryParse(v as String);

  /// Today's counters, starting fresh on a new local date.
  DayState today(DateTime now) {
    final key = DayState.keyFor(now.toLocal());
    if (day?.day != key) {
      day = DayState(day: key);
      // A sitting from an earlier day is dropped; the plan is rebuilt.
      sitting = null;
      saveDay();
      saveSitting();
    }
    return day!;
  }

  Future<void> saveProgress() =>
      _prefs.setString(_k('progress'), jsonEncode({for (final e in progress.entries) e.key: e.value.toJson()}));

  Future<void> saveLog() {
    // Keep the device log bounded: 120 days is plenty for weekly reports;
    // the full history lives in Supabase.
    final cutoff = DateTime.now().toUtc().subtract(const Duration(days: 120));
    final firstKept = log.indexWhere((e) => e.at.isAfter(cutoff));
    if (firstKept > 0 && firstKept <= unsentLogFrom) {
      log = log.sublist(firstKept);
      unsentLogFrom -= firstKept;
    }
    return _prefs.setString(_k('log'), jsonEncode([for (final e in log) e.toJson()]));
  }

  Future<void> saveSettings({bool touched = true}) async {
    if (touched) {
      settingsUpdatedAt = DateTime.now().toUtc();
      settingsDirty = true;
    }
    await _prefs.setString(_k('settings'), jsonEncode(settings.toJson()));
    await saveMeta();
  }

  Future<void> saveMeta() => _prefs.setString(
      _k('meta'),
      jsonEncode({
        'settingsAt': settingsUpdatedAt.toIso8601String(),
        if (planStart != null) 'planStart': planStart!.toIso8601String(),
        if (lastReportShown != null) 'report': lastReportShown!.toIso8601String(),
        if (lastServerSync != null) 'sync': lastServerSync!.toIso8601String(),
        'logFrom': unsentLogFrom,
        'settingsDirty': settingsDirty,
        'dirty': dirty.toList(),
      }));

  Future<void> saveDay() async {
    if (day == null) {
      await _prefs.remove(_k('day'));
    } else {
      await _prefs.setString(_k('day'), jsonEncode(day!.toJson()));
    }
  }

  Future<void> saveSitting() async {
    if (sitting == null) {
      await _prefs.remove(_k('sitting'));
    } else {
      await _prefs.setString(_k('sitting'), jsonEncode(sitting!.toJson()));
    }
  }

  /// One rating: card state and log row are written together, then the
  /// feed moves on (learning engine §1).
  Future<void> recordReview(CardProgress p, ReviewEntry e) async {
    progress[p.cardId] = p;
    log.add(e);
    dirty.add(p.cardId);
    await Future.wait([saveProgress(), saveLog(), saveMeta()]);
  }

  /// Wipes this course's data on the device (sign out with delete, or
  /// account deletion).
  Future<void> clear() async {
    for (final k in _prefs.getKeys().where((k) => k.startsWith(_prefix)).toList()) {
      await _prefs.remove(k);
    }
    progress = {};
    log = [];
    settings = LearnerSettings();
    settingsUpdatedAt = DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
    day = null;
    sitting = null;
    planStart = null;
    lastReportShown = null;
    lastServerSync = null;
    dirty.clear();
    unsentLogFrom = 0;
    settingsDirty = false;
  }
}
