import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

/// Thrown when a call is refused or fails; [message] is fit to show a parent.
class ApiException implements Exception {
  ApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// The PTA backend: the `pta.*` database functions.
///
/// The web app at calecutech calls exactly the same functions, so a parent
/// sees the same numbers in both. Every function runs as the signed-in user
/// under row-level security; this app holds no rules of its own about who
/// may see what.
abstract class Api {
  Future<dynamic> call(String fn, [Map<String, dynamic> args = const {}]);

  /// The signed-in email, or null before sign-in.
  String? get email;

  Future<void> signOut();
}

/// Talks to Supabase directly with the user's own session.
class SupabaseApi implements Api {
  SupabaseApi(this.client);
  final SupabaseClient client;

  @override
  String? get email => client.auth.currentUser?.email;

  @override
  Future<dynamic> call(
    String fn, [
    Map<String, dynamic> args = const {},
  ]) async {
    try {
      return await client.schema('pta').rpc(fn, params: args);
    } on PostgrestException catch (e) {
      throw ApiException(clean(e.message));
    }
  }

  @override
  Future<void> signOut() => client.auth.signOut();
}

/// The demo school served by the web app's demo deployment. Same functions,
/// same rules, sample data; "signing in" is picking one of three people.
class DemoApi implements Api {
  DemoApi(this.base, {http.Client? httpClient})
    : _http = httpClient ?? http.Client();

  final Uri base;
  final http.Client _http;
  String? _as;

  static const people = [
    ('parent@example.com', 'Parent', 'Meera Nair, mother of Aditi and Arjun'),
    ('anitha@example.com', 'Class teacher', 'Anitha K, Grade 5 A'),
  ];

  void signInAs(String email) => _as = email;

  @override
  String? get email => _as;

  @override
  Future<dynamic> call(
    String fn, [
    Map<String, dynamic> args = const {},
  ]) async {
    final http.Response res;
    try {
      res = await _http.post(
        base.resolve('/api/demo/rpc'),
        headers: {'content-type': 'application/json'},
        body: jsonEncode({'fn': fn, 'args': args, 'as': _as}),
      );
    } catch (_) {
      throw ApiException('No connection. Check your internet and try again.');
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) {
      throw ApiException(clean('${body['error'] ?? 'Request failed'}'));
    }
    return body['data'];
  }

  @override
  Future<void> signOut() async => _as = null;
}

/// Postgres refusals in words a parent can act on.
String clean(String m) {
  if (RegExp(
    'row-level security|permission denied',
    caseSensitive: false,
  ).hasMatch(m)) {
    return 'Your account is not allowed to do that.';
  }
  if (m.contains('duplicate key')) return 'That has already been done.';
  return m;
}
