import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// How a course sells its sections ("papers").
class CoursePricing {
  const CoursePricing({
    required this.freeCardsPerSection,
    required this.productIds,
    required this.priceLabel,
    required this.myPapersRpc,
    required this.redeemRpc,
    required this.verifyFunction,
  });

  /// Cards of a locked section a learner may study for free.
  final int freeCardsPerSection;

  /// Play one-time product id per section id.
  final Map<int, String> productIds;

  /// Shown until the store returns its own localized price.
  final String priceLabel;
  final String myPapersRpc;
  final String redeemRpc;

  /// Edge Function that verifies a Play purchase token.
  final String verifyFunction;

  int? sectionFor(String productId) {
    for (final e in productIds.entries) {
      if (e.value == productId) return e.key;
    }
    return null;
  }
}

/// A Play Store purchase the app has received but not yet verified.
class StorePurchase {
  const StorePurchase({required this.productId, required this.token, required this.complete});
  final String productId;
  final String token;

  /// Tells the store the purchase was delivered.
  final Future<void> Function() complete;
}

/// The device's store (Google Play Billing on Android). Kept behind an
/// interface so tests and the web build run without the plugin.
abstract class StoreBilling {
  Future<bool> available();

  /// Localized prices by product id.
  Future<Map<String, String>> prices(Set<String> productIds);

  /// Starts a purchase; the result arrives on [purchases].
  Future<void> buy(String productId, {required String accountId});

  /// Asks the store to re-send past purchases on [purchases].
  Future<void> restore();

  Stream<List<StorePurchase>> get purchases;

  /// Store-side errors and cancellations, as readable text.
  Stream<String> get errors;
}

/// Which papers this learner owns, and buying or redeeming more.
///
/// Ownership lives on the server (tied to the signed-in account); the device
/// keeps a copy so the app works offline.
class PaperAccess extends ChangeNotifier {
  PaperAccess({
    required this.pricing,
    required this.client,
    required String storageKey,
    this.billing,
  }) : _key = 'recallio.$storageKey.owned';

  final CoursePricing pricing;
  final SupabaseClient? client;
  final StoreBilling? billing;
  final String _key;

  Set<int> _owned = {};
  Map<int, String> _prices = {};
  bool _storeReady = false;
  int? _buying;
  String? _message;
  StreamSubscription<List<StorePurchase>>? _sub;
  StreamSubscription<String>? _errSub;

  Set<int> get owned => _owned;
  bool owns(int section) => _owned.contains(section);
  bool get signedIn => client?.auth.currentUser != null;

  /// True when this device can pay in the app (Android with Play).
  bool get canBuy => _storeReady;
  int? get buying => _buying;

  /// Last purchase or coupon result, for a snackbar; cleared when read.
  String? takeMessage() {
    final m = _message;
    _message = null;
    return m;
  }

  String priceOf(int section) => _prices[section] ?? pricing.priceLabel;

  Future<void> start() async {
    final prefs = await SharedPreferences.getInstance();
    _owned = {...?prefs.getStringList(_key)?.map(int.parse)};
    notifyListeners();
    final b = billing;
    if (b != null) {
      _sub = b.purchases.listen(_onPurchases);
      _errSub = b.errors.listen((e) {
        _buying = null;
        _message = e;
        notifyListeners();
      });
      try {
        _storeReady = await b.available();
        if (_storeReady) {
          final p = await b.prices(pricing.productIds.values.toSet());
          _prices = {
            for (final e in pricing.productIds.entries)
              if (p[e.value] != null) e.key: p[e.value]!,
          };
        }
      } catch (_) {
        _storeReady = false;
      }
      notifyListeners();
    }
    unawaited(refresh());
  }

  /// Reads ownership from the server; on Android also re-checks purchases
  /// the store has that the server has not seen (e.g. after reinstalling).
  Future<void> refresh() async {
    final c = client;
    if (c == null || c.auth.currentUser == null) return;
    try {
      final res = await c.rpc(pricing.myPapersRpc);
      await _save({for (final s in (res as List? ?? const [])) (s as num).toInt()});
    } catch (_) {
      // Offline: keep the device copy.
    }
    if (_storeReady) {
      try {
        await billing!.restore();
      } catch (_) {}
    }
  }

  /// Returns null on success, or a message to show.
  Future<String?> redeem(String code) async {
    final c = client;
    if (c == null || c.auth.currentUser == null) return 'Sign in first, so the paper stays with your account.';
    final k = code.trim();
    if (k.isEmpty) return 'Type the code.';
    try {
      final res = await c.rpc(pricing.redeemRpc, params: {'p_code': k});
      await _save({for (final s in (res as List? ?? const [])) (s as num).toInt()});
      return null;
    } on PostgrestException catch (e) {
      return e.message;
    } catch (_) {
      return 'Could not reach the server. Check your internet and try again.';
    }
  }

  /// Starts a Play purchase. Returns a message when it cannot start.
  Future<String?> buy(int section) async {
    final c = client;
    final user = c?.auth.currentUser;
    if (user == null) return 'Sign in first, so the paper stays with your account.';
    final b = billing;
    final id = pricing.productIds[section];
    if (b == null || !_storeReady || id == null) return 'Buying works in the Android app from Google Play.';
    _buying = section;
    notifyListeners();
    try {
      await b.buy(id, accountId: user.id);
      return null;
    } catch (_) {
      _buying = null;
      notifyListeners();
      return 'Google Play could not start the purchase. Try again.';
    }
  }

  Future<void> _onPurchases(List<StorePurchase> list) async {
    for (final p in list) {
      final section = pricing.sectionFor(p.productId);
      if (section == null) continue;
      final ok = await _verify(p);
      if (ok) {
        await p.complete();
        if (_buying == section) _message = 'Paper unlocked. Happy studying!';
      }
    }
    _buying = null;
    notifyListeners();
  }

  Future<bool> _verify(StorePurchase p) async {
    final c = client;
    if (c == null || c.auth.currentUser == null) return false;
    try {
      final res = await c.functions.invoke(pricing.verifyFunction,
          body: {'productId': p.productId, 'purchaseToken': p.token});
      final data = res.data;
      if (data is Map && data['papers'] is List) {
        await _save({for (final s in data['papers'] as List) (s as num).toInt()});
        return true;
      }
    } on FunctionException catch (e) {
      final d = e.details;
      _message = d is Map && d['error'] is String
          ? d['error'] as String
          : 'Payment received; unlocking failed. It will retry when you reopen the app.';
    } catch (_) {
      _message = 'Payment received; unlocking will finish when you are back online.';
    }
    return false;
  }

  /// Stores the server's answer, which is the authority.
  Future<void> _save(Set<int> owned) async {
    if (setEquals(owned, _owned)) return;
    _owned = owned;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_key, [for (final s in _owned) '$s']);
    notifyListeners();
  }

  @visibleForTesting
  Future<void> setOwnedForTest(Set<int> owned) => _save(owned);

  /// Forget the device copy (signing out of a different account).
  Future<void> clearLocal() async {
    _owned = {};
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
    notifyListeners();
  }

  @override
  void dispose() {
    _sub?.cancel();
    _errSub?.cancel();
    super.dispose();
  }
}
