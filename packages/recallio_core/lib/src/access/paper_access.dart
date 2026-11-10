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
    this.applyCouponRpc,
    this.basePrice = 1000,
    this.currency = '₹',
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

  /// RPC that applies a coupon to the cart (discount) or opens papers.
  final String? applyCouponRpc;

  /// Full price of one section, for totals before the store answers.
  final int basePrice;
  final String currency;

  /// Discount tiers that have their own Play product (`<id>_off<pct>`).
  static const tiers = [10, 25, 50, 75, 90, 99];

  /// Play product for [section], at [pct]% off (0 = full price).
  String? productFor(int section, [int pct = 0]) {
    final base = productIds[section];
    if (base == null) return null;
    return pct > 0 ? '${base}_off$pct' : base;
  }

  int? sectionFor(String productId) {
    final base = productId.replaceFirst(RegExp(r'_off\d+$'), '');
    for (final e in productIds.entries) {
      if (e.value == base) return e.key;
    }
    return null;
  }

  int priceAt(int pct) => (basePrice * (100 - pct) / 100).round();
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


/// Result of applying a coupon.
class CouponResult {
  const CouponResult({this.error, this.pct, this.unlocked = false});
  final String? error;

  /// Percent off at checkout, for a discount code.
  final int? pct;

  /// True when the code opened papers outright (reviewer/admin codes).
  final bool unlocked;
}

/// Which papers this learner owns, the cart, and checkout.
///
/// Every paper costs the full price and opens only after a paid checkout
/// (Google Play on Android). A coupon gives a discount at checkout; only
/// special reviewer/admin codes open papers outright. Ownership lives on the
/// server (tied to the signed-in account); the device keeps a copy so the
/// app works offline.
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
  final Map<String, String> _prices = {};
  bool _storeReady = false;
  int? _buying;
  bool _checkingOut = false;
  String? _message;
  final Set<int> _cart = {};
  int _pct = 0;
  String? _coupon;
  Completer<bool>? _waiting;
  StreamSubscription<List<StorePurchase>>? _sub;
  StreamSubscription<String>? _errSub;

  Set<int> get owned => _owned;
  bool owns(int section) => _owned.contains(section);
  bool get signedIn => client?.auth.currentUser != null;

  /// True when this device can pay in the app (Android with Play).
  bool get canBuy => _storeReady;

  /// The paper being paid for right now.
  int? get buying => _buying;
  bool get checkingOut => _checkingOut;

  /// Papers in the cart (never ones already owned).
  Set<int> get cart => _cart.difference(_owned);
  bool inCart(int section) => cart.contains(section);

  /// Discount from the applied coupon, 0 when none.
  int get discountPct => _pct;
  String? get coupon => _coupon;

  /// Last purchase or coupon result, for a snackbar; cleared when read.
  String? takeMessage() {
    final m = _message;
    _message = null;
    return m;
  }

  String _label(int amount) => '${pricing.currency}${_group(amount)}';

  static String _group(int n) {
    final s = '$n';
    if (s.length <= 3) return s;
    return '${s.substring(0, s.length - 3)},${s.substring(s.length - 3)}';
  }

  /// Full price of one paper (the store's own text when known).
  String priceOf(int section) =>
      _prices[pricing.productFor(section)] ?? _label(pricing.basePrice);

  /// Price of one paper after the applied discount.
  String cartPriceOf(int section) =>
      _prices[pricing.productFor(section, _pct)] ?? _label(pricing.priceAt(_pct));

  /// Cart total after discount, and before it.
  String get cartTotal => _label(pricing.priceAt(_pct) * cart.length);
  String get cartFullTotal => _label(pricing.basePrice * cart.length);

  void toggleCart(int section) {
    if (owns(section)) return;
    if (!_cart.remove(section)) _cart.add(section);
    notifyListeners();
  }

  void addToCart(int section) {
    if (owns(section) || _cart.contains(section)) return;
    _cart.add(section);
    notifyListeners();
  }

  void removeCoupon() {
    _pct = 0;
    _coupon = null;
    notifyListeners();
  }

  Future<void> start() async {
    final prefs = await SharedPreferences.getInstance();
    _owned = {...?prefs.getStringList(_key)?.map(int.parse)};
    notifyListeners();
    final b = billing;
    if (b != null) {
      _sub = b.purchases.listen(_onPurchases);
      _errSub = b.errors.listen((e) {
        _message = e;
        _finishWaiting(false);
        notifyListeners();
      });
      try {
        _storeReady = await b.available();
        if (_storeReady) await _loadPrices(0);
      } catch (_) {
        _storeReady = false;
      }
      notifyListeners();
    }
    unawaited(refresh());
  }

  Future<void> _loadPrices(int pct) async {
    final ids = {
      for (final s in pricing.productIds.keys) pricing.productFor(s, pct)!,
    };
    try {
      _prices.addAll(await billing!.prices(ids));
    } catch (_) {}
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

  /// Applies a coupon to the cart.
  Future<CouponResult> applyCoupon(String code) async {
    final c = client;
    if (c == null || c.auth.currentUser == null) {
      return const CouponResult(error: 'Sign in first, so the paper stays with your account.');
    }
    final k = code.trim();
    if (k.isEmpty) return const CouponResult(error: 'Type the code.');
    final rpc = pricing.applyCouponRpc;
    try {
      if (rpc == null) {
        final res = await c.rpc(pricing.redeemRpc, params: {'p_code': k});
        await _save({for (final s in (res as List? ?? const [])) (s as num).toInt()});
        return const CouponResult(unlocked: true);
      }
      final res = await c.rpc(rpc, params: {'p_code': k});
      final m = res is Map ? res : const {};
      if (m['kind'] == 'unlock') {
        await _save({for (final s in (m['papers'] as List? ?? const [])) (s as num).toInt()});
        return const CouponResult(unlocked: true);
      }
      final pct = (m['pct'] as num?)?.toInt() ?? 0;
      if (!CoursePricing.tiers.contains(pct)) return const CouponResult(error: 'That code is not valid.');
      _pct = pct;
      _coupon = (m['code'] as String?) ?? k.toUpperCase();
      if (_storeReady) await _loadPrices(pct);
      notifyListeners();
      return CouponResult(pct: pct);
    } on PostgrestException catch (e) {
      return CouponResult(error: e.message);
    } catch (_) {
      return const CouponResult(error: 'Could not reach the server. Check your internet and try again.');
    }
  }

  /// Pays for every paper in the cart through Google Play, one after
  /// another. Each paper opens only after its payment is verified. Returns
  /// null when all were paid, or a message.
  Future<String?> checkout() async {
    final c = client;
    final user = c?.auth.currentUser;
    if (user == null) return 'Sign in first, so the paper stays with your account.';
    final b = billing;
    if (b == null || !_storeReady) return 'Buying works in the Android app from Google Play.';
    final items = cart.toList()..sort();
    if (items.isEmpty) return 'Add a paper to the cart first.';
    _checkingOut = true;
    notifyListeners();
    try {
      for (final section in items) {
        final id = pricing.productFor(section, _pct)!;
        _buying = section;
        _waiting = Completer<bool>();
        notifyListeners();
        try {
          await b.buy(id, accountId: user.id);
        } catch (_) {
          _waiting = null;
          return 'Google Play could not start the purchase. Try again.';
        }
        final ok = await _waiting!.future;
        if (!ok) return takeMessage() ?? 'Checkout stopped.';
        _cart.remove(section);
      }
      _cart.clear();
      _pct = 0;
      _coupon = null;
      _message = items.length == 1 ? 'Paper unlocked. Happy studying!' : 'Papers unlocked. Happy studying!';
      return null;
    } finally {
      _buying = null;
      _waiting = null;
      _checkingOut = false;
      notifyListeners();
    }
  }

  void _finishWaiting(bool ok) {
    final w = _waiting;
    if (w != null && !w.isCompleted) w.complete(ok);
  }

  Future<void> _onPurchases(List<StorePurchase> list) async {
    for (final p in list) {
      final section = pricing.sectionFor(p.productId);
      if (section == null) continue;
      final ok = await _verify(p);
      if (ok) await p.complete();
      if (_buying == section) _finishWaiting(ok);
    }
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
    _cart.removeAll(owned);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_key, [for (final s in _owned) '$s']);
    notifyListeners();
  }

  @visibleForTesting
  Future<void> setOwnedForTest(Set<int> owned) => _save(owned);

  /// Forget the device copy (signing out of a different account).
  Future<void> clearLocal() async {
    _owned = {};
    _cart.clear();
    _pct = 0;
    _coupon = null;
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
