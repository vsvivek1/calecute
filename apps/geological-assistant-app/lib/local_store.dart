import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'models.dart';
import 'scheduler.dart';

/// On-device cache so the course works offline: content in a file, progress,
/// attempts and settings in shared preferences. Every key is per account.
class LocalStore {
  LocalStore(this._prefs, this._dir);

  final SharedPreferences _prefs;
  final Directory _dir;

  static Future<LocalStore> open() async => LocalStore(
    await SharedPreferences.getInstance(),
    await getApplicationSupportDirectory(),
  );

  File _contentFile(String userId) =>
      File('${_dir.path}/content_${_safe(userId)}.json');

  static String _safe(String s) => s.replaceAll(RegExp(r'[^A-Za-z0-9_-]'), '_');

  // Content ---------------------------------------------------------------

  Future<CourseContent?> readContent(String userId) async {
    final file = _contentFile(userId);
    if (!await file.exists()) return null;
    try {
      final json = jsonDecode(await file.readAsString());
      return CourseContent.fromJson(json as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> writeContent(String userId, CourseContent content) async {
    await _contentFile(userId).writeAsString(jsonEncode(content.toJson()));
    await _prefs.setString(
      'contentAt:$userId',
      DateTime.now().toIso8601String(),
    );
  }

  DateTime? contentSavedAt(String userId) {
    final raw = _prefs.getString('contentAt:$userId');
    return raw == null ? null : DateTime.tryParse(raw);
  }

  Course? readCourse() {
    final raw = _prefs.getString('course');
    return raw == null
        ? null
        : Course.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<void> writeCourse(Course c) =>
      _prefs.setString('course', jsonEncode(c.toJson()));

  // Access ----------------------------------------------------------------

  bool? readAccess(String userId) => _prefs.getBool('access:$userId');
  Future<void> writeAccess(String userId, bool value) =>
      _prefs.setBool('access:$userId', value);

  // Progress --------------------------------------------------------------

  Map<String, CardProgress> readProgress(String userId) {
    final raw = _prefs.getString('progress:$userId');
    if (raw == null) return {};
    final list = jsonDecode(raw) as List;
    return {
      for (final r in list)
        (r as Map<String, dynamic>)['card_id'] as String: CardProgress.fromRow(
          r,
        ),
    };
  }

  Future<void> writeProgress(
    String userId,
    Map<String, CardProgress> progress,
  ) => _prefs.setString(
    'progress:$userId',
    jsonEncode([for (final p in progress.values) p.toRow(userId)]),
  );

  /// Card ids reviewed on device but not yet saved to the server.
  Set<String> readDirty(String userId) =>
      (_prefs.getStringList('dirty:$userId') ?? const []).toSet();

  Future<void> writeDirty(String userId, Set<String> ids) =>
      _prefs.setStringList('dirty:$userId', ids.toList());

  // New-card count per day -------------------------------------------------

  static String _day(DateTime t) =>
      '${t.year}-${t.month.toString().padLeft(2, '0')}-${t.day.toString().padLeft(2, '0')}';

  int readNewToday(String userId, DateTime now) =>
      _prefs.getInt('new:$userId:${_day(now)}') ?? 0;

  Future<void> writeNewToday(String userId, DateTime now, int count) =>
      _prefs.setInt('new:$userId:${_day(now)}', count);

  // Attempts --------------------------------------------------------------

  List<QuizAttempt> readAttempts(String userId, {bool pending = false}) {
    final raw = _prefs.getString('${pending ? 'pending' : 'attempts'}:$userId');
    if (raw == null) return [];
    return [
      for (final r in jsonDecode(raw) as List)
        QuizAttempt.fromRow(r as Map<String, dynamic>),
    ];
  }

  Future<void> writeAttempts(
    String userId,
    List<QuizAttempt> attempts, {
    bool pending = false,
  }) => _prefs.setString(
    '${pending ? 'pending' : 'attempts'}:$userId',
    jsonEncode([for (final a in attempts) a.toRow(userId)]),
  );

  // Settings (device-wide) -------------------------------------------------

  int? readNewPerDay() => _prefs.getInt('newPerDay');
  Future<void> writeNewPerDay(int n) => _prefs.setInt('newPerDay', n);

  PriorityMode readPriorityMode() {
    final raw = _prefs.getString('priorityMode');
    return PriorityMode.values.firstWhere(
      (m) => m.name == raw,
      orElse: () => PriorityMode.highFirst,
    );
  }

  Future<void> writePriorityMode(PriorityMode m) =>
      _prefs.setString('priorityMode', m.name);

  /// Removes the downloaded course and the access flag (on sign-out).
  /// Progress stays so reviews not yet saved to the server aren't lost.
  Future<void> clearContent(String userId) async {
    final file = _contentFile(userId);
    if (await file.exists()) await file.delete();
    await _prefs.remove('contentAt:$userId');
    await _prefs.remove('access:$userId');
  }
}
