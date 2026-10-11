import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config.dart';
import 'models.dart';
import 'scheduler.dart';

/// Everything the app needs from the server. [SupabaseBackend] talks to the
/// `geological_assistant` schema; [DemoBackend] serves a bundled sample when
/// the app is built without Supabase settings.
abstract class Backend {
  bool get isDemo;
  Account? get currentAccount;
  Future<Account> signIn();
  Future<void> signOut();

  Future<Course> fetchCourse();

  /// True when this account bought the course (on the website).
  Future<bool> hasAccess();
  Future<CourseContent> fetchContent();

  Future<List<CardProgress>> fetchProgress();
  Future<void> pushProgress(List<CardProgress> rows);
  Future<void> saveAttempt(QuizAttempt attempt);
  Future<List<QuizAttempt>> fetchAttempts();
}

class SupabaseBackend implements Backend {
  bool _googleReady = false;

  SupabaseClient get _client => Supabase.instance.client;
  SupabaseQuerySchema get _db => _client.schema(AppConfig.schema);

  @override
  bool get isDemo => false;

  @override
  Account? get currentAccount {
    final user = _client.auth.currentUser;
    if (user == null) return null;
    return Account(
      id: user.id,
      email: user.email ?? '',
      name: (user.userMetadata?['full_name'] as String?) ?? user.email ?? '',
    );
  }

  @override
  Future<Account> signIn() async {
    if (!_googleReady) {
      await GoogleSignIn.instance.initialize(
        serverClientId: AppConfig.googleWebClientId,
      );
      _googleReady = true;
    }
    final google = await GoogleSignIn.instance.authenticate();
    final idToken = google.authentication.idToken;
    if (idToken == null) throw StateError('Google sign-in gave no ID token.');
    await _client.auth.signInWithIdToken(
      provider: OAuthProvider.google,
      idToken: idToken,
    );
    return currentAccount!;
  }

  @override
  Future<void> signOut() async {
    await _client.auth.signOut();
    if (_googleReady) await GoogleSignIn.instance.signOut();
  }

  @override
  Future<Course> fetchCourse() async {
    final row = await _db
        .from('courses')
        .select()
        .eq('id', courseId)
        .maybeSingle();
    return row == null ? Course.fallback : Course.fromJson(row);
  }

  @override
  Future<bool> hasAccess() async {
    final result = await _db.rpc(
      'has_active_subscription',
      params: {'p_course_id': courseId},
    );
    return result == true;
  }

  /// Reads a whole table past the API's row limit, a page at a time.
  /// [orderBy] must make the order unique so pages don't overlap.
  Future<List<Map<String, dynamic>>> _all(
    String table,
    String columns, {
    bool byCourse = true,
    List<String> orderBy = const ['id'],
  }) async {
    const page = 1000;
    final rows = <Map<String, dynamic>>[];
    while (true) {
      var filter = _db.from(table).select(columns);
      if (byCourse) filter = filter.eq('course_id', courseId);
      var query = filter.order(orderBy.first, ascending: true);
      for (final column in orderBy.skip(1)) {
        query = query.order(column, ascending: true);
      }
      final batch = await query.range(rows.length, rows.length + page - 1);
      // Stop on an empty page, not a short one, in case the project's
      // max-rows setting is below [page].
      if (batch.isEmpty) break;
      rows.addAll(batch);
    }
    return rows;
  }

  @override
  Future<CourseContent> fetchContent() async {
    final results = await Future.wait([
      _db
          .from('modules')
          .select('id,module_no,name,marks')
          .eq('course_id', courseId),
      _all(
        'cards',
        'id,module_id,subtopic,statement,reasoning,source_ref,verified,tier,order_index',
      ),
      _all(
        'questions',
        'id,paper_code,stem,option_a,option_b,option_c,option_d,official_answer,verified_answer',
      ),
      _all(
        'question_cards',
        'question_id,card_id',
        byCourse: false,
        orderBy: const ['question_id', 'card_id'],
      ),
    ]);
    return CourseContent.fromJson({
      'units': results[0],
      'cards': results[1],
      'questions': results[2],
      'question_cards': results[3],
    });
  }

  @override
  Future<List<CardProgress>> fetchProgress() async {
    final rows = await _all(
      'user_card_state',
      'card_id,ease,interval_days,reps,lapses,due_at,last_reviewed_at',
      byCourse: false,
      orderBy: const ['card_id'],
    );
    return [for (final r in rows) CardProgress.fromRow(r)];
  }

  @override
  Future<void> pushProgress(List<CardProgress> rows) async {
    final userId = currentAccount?.id;
    if (userId == null || rows.isEmpty) return;
    await _db.from('user_card_state').upsert([
      for (final r in rows) r.toRow(userId),
    ], onConflict: 'user_id,card_id');
  }

  @override
  Future<void> saveAttempt(QuizAttempt attempt) async {
    final userId = currentAccount?.id;
    if (userId == null) return;
    await _db.from('quiz_attempts').insert(attempt.toRow(userId));
  }

  @override
  Future<List<QuizAttempt>> fetchAttempts() async {
    final rows = await _db
        .from('quiz_attempts')
        .select()
        .eq('course_id', courseId)
        .order('started_at', ascending: false)
        .limit(50);
    return [for (final r in rows) QuizAttempt.fromRow(r)];
  }
}

/// Runs with no server: a demo account and a small sample of real cards and
/// questions bundled in `assets/demo/sample.json`. Progress stays on device.
class DemoBackend implements Backend {
  Account? _account;
  final _attempts = <QuizAttempt>[];

  static const _demoAccount = Account(
    id: 'demo',
    email: 'demo@device',
    name: 'Demo student',
  );

  static const _units = [
    {
      'id': 'geological-assistant-m1',
      'module_no': 1,
      'name': 'Geotectonics, Geomorphology & Remote Sensing',
      'marks': 20,
    },
    {
      'id': 'geological-assistant-m2',
      'module_no': 2,
      'name': 'Structural Geology, Stratigraphy & Palaeontology',
      'marks': 20,
    },
    {
      'id': 'geological-assistant-m3',
      'module_no': 3,
      'name': 'Mineralogy & Economic Deposits',
      'marks': 20,
    },
    {
      'id': 'geological-assistant-m4',
      'module_no': 4,
      'name': 'Petrology (Igneous, Metamorphic, Sedimentary)',
      'marks': 20,
    },
    {
      'id': 'geological-assistant-m5',
      'module_no': 5,
      'name': 'Hydrogeology & Environmental Geology',
      'marks': 20,
    },
  ];

  @override
  bool get isDemo => true;

  @override
  Account? get currentAccount => _account;

  @override
  Future<Account> signIn() async => _account = _demoAccount;

  @override
  Future<void> signOut() async => _account = null;

  @override
  Future<Course> fetchCourse() async => Course.fallback;

  @override
  Future<bool> hasAccess() async => true;

  @override
  Future<CourseContent> fetchContent() async {
    final raw = await rootBundle.loadString(
      'assets/demo/sample.json',
      cache: false,
    );
    final json = jsonDecode(raw) as Map<String, dynamic>;
    return CourseContent.fromJson({...json, 'units': _units});
  }

  @override
  Future<List<CardProgress>> fetchProgress() async => const [];

  @override
  Future<void> pushProgress(List<CardProgress> rows) async {}

  @override
  Future<void> saveAttempt(QuizAttempt attempt) async =>
      _attempts.insert(0, attempt);

  @override
  Future<List<QuizAttempt>> fetchAttempts() async => List.of(_attempts);
}
