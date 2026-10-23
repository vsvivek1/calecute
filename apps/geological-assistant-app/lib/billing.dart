import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import 'app_state.dart';
import 'billing_logic.dart';
import 'config.dart';

/// The parts of Google Play Billing the app uses, so tests can swap in a fake.
abstract class PlayStore {
  Stream<List<PurchaseDetails>> get purchases;
  Future<bool> isAvailable();
  Future<ProductDetails?> queryProduct(String id);

  /// Opens the Play purchase sheet. [accountId] is stored on the purchase as
  /// its obfuscated account id. False if the sheet could not open.
  Future<bool> buy(ProductDetails product, String accountId);
  Future<void> restore(String accountId);
  Future<void> complete(PurchaseDetails purchase);
}

class GooglePlayStore implements PlayStore {
  InAppPurchase get _iap => InAppPurchase.instance;

  @override
  Stream<List<PurchaseDetails>> get purchases => _iap.purchaseStream;

  @override
  Future<bool> isAvailable() => _iap.isAvailable();

  @override
  Future<ProductDetails?> queryProduct(String id) async {
    final res = await _iap.queryProductDetails({id});
    for (final p in res.productDetails) {
      if (p.id == id) return p;
    }
    return null;
  }

  @override
  Future<bool> buy(ProductDetails product, String accountId) =>
      _iap.buyNonConsumable(
        purchaseParam: PurchaseParam(
          productDetails: product,
          applicationUserName: accountId,
        ),
      );

  @override
  Future<void> restore(String accountId) =>
      _iap.restorePurchases(applicationUserName: accountId);

  @override
  Future<void> complete(PurchaseDetails purchase) =>
      _iap.completePurchase(purchase);
}

/// Null when the app can't sell: demo mode, no product id, or not Android.
final playStoreProvider = Provider<PlayStore?>((_) {
  if (!AppConfig.billingConfigured) return null;
  if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return null;
  return GooglePlayStore();
});

class BillingState {
  const BillingState({
    this.supported = false,
    this.loading = false,
    this.product,
    this.busy = false,
    this.pending = false,
    this.message,
  });

  /// This build can sell through Google Play.
  final bool supported;

  /// Still asking Play for the product and price.
  final bool loading;

  /// The Play product with its local price; null if Play didn't return it.
  final ProductDetails? product;

  /// A purchase, restore or server check is running.
  final bool busy;

  /// Play is waiting for the payment (for example a cash or UPI collect
  /// payment that hasn't gone through yet).
  final bool pending;
  final String? message;

  BillingState copyWith({
    bool? loading,
    ProductDetails? product,
    bool? busy,
    bool? pending,
    String? message,
    bool clearMessage = false,
  }) => BillingState(
    supported: supported,
    loading: loading ?? this.loading,
    product: product ?? this.product,
    busy: busy ?? this.busy,
    pending: pending ?? this.pending,
    message: clearMessage ? null : (message ?? this.message),
  );
}

final billingProvider = NotifierProvider<BillingController, BillingState>(
  BillingController.new,
);

/// Buy and restore through Google Play. Access is granted only by the
/// `ga-play-verify` edge function; the app finishes a purchase with Play only
/// after the server accepted it, so a purchase the server never saw is
/// refunded by Google instead of being lost.
class BillingController extends Notifier<BillingState> {
  PlayStore? get _store => ref.read(playStoreProvider);

  /// Purchases that arrived while nobody was signed in.
  final _waiting = <PurchaseDetails>[];

  /// Account ids already checked with a silent restore this session.
  final _autoRestored = <String>{};

  /// Purchases handled since the last restore started.
  int _seen = 0;

  /// How long a restore waits for Play to send back past purchases.
  @visibleForTesting
  static Duration restoreWait = const Duration(seconds: 3);

  @override
  BillingState build() {
    final store = _store;
    if (store == null) return const BillingState();

    final sub = store.purchases.listen(
      _onPurchases,
      onError: (Object _) {
        if (!ref.mounted) return;
        state = state.copyWith(
          busy: false,
          message: 'Google Play reported a problem. Please try again.',
        );
      },
    );
    ref.onDispose(sub.cancel);

    // A locked account may have paid earlier without the server hearing
    // about it (app closed mid-check): look for it once, quietly.
    ref.listen(appProvider.select((s) => (s.phase, s.account?.id)), (_, next) {
      final (phase, uid) = next;
      if (uid == null) return;
      // Not during build: [state] isn't set yet.
      Future.microtask(() {
        if (!ref.mounted) return;
        if (_waiting.isNotEmpty) {
          final list = List.of(_waiting);
          _waiting.clear();
          _onPurchases(list);
        }
        if (phase == Phase.locked && _autoRestored.add(uid)) {
          restore(silent: true);
        }
      });
    }, fireImmediately: true);

    Future.microtask(loadProduct);
    return const BillingState(supported: true, loading: true);
  }

  Future<void> loadProduct() async {
    final store = _store;
    if (store == null) return;
    state = state.copyWith(loading: true, clearMessage: true);
    try {
      if (!await store.isAvailable()) {
        if (!ref.mounted) return;
        state = state.copyWith(
          loading: false,
          message: 'Google Play is not available on this device.',
        );
        return;
      }
      final product = await store.queryProduct(AppConfig.playProductId);
      if (!ref.mounted) return;
      state = state.copyWith(
        loading: false,
        product: product,
        message: product == null
            ? 'The course is not on sale in Google Play yet.'
            : null,
      );
    } catch (_) {
      if (!ref.mounted) return;
      state = state.copyWith(
        loading: false,
        message: 'Could not reach Google Play. Check your connection.',
      );
    }
  }

  /// Signs in first if needed. Returns the user id, or null to stop.
  Future<String?> _account() async {
    final app = ref.read(appProvider.notifier);
    var uid = ref.read(appProvider).account?.id;
    if (uid == null) {
      await app.signIn();
      uid = ref.read(appProvider).account?.id;
      // Signing in may show the account already has the course.
      if (ref.read(appProvider).phase == Phase.ready) return null;
    }
    return uid;
  }

  Future<void> buy() async {
    final store = _store;
    final product = state.product;
    if (store == null || product == null || state.busy) return;
    final uid = await _account();
    if (uid == null || !ref.mounted) return;
    state = state.copyWith(busy: true, pending: false, clearMessage: true);
    try {
      // The result arrives on the purchase stream.
      final opened = await store.buy(product, obfuscatedAccountId(uid));
      if (!opened && ref.mounted && state.busy) {
        state = state.copyWith(
          busy: false,
          message: 'Google Play could not start the purchase.',
        );
      }
    } catch (e) {
      if (!ref.mounted) return;
      state = state.copyWith(
        busy: false,
        message: 'Could not open Google Play. Please try again.',
      );
    }
  }

  /// Asks Play for purchases this Google Play account already made. With
  /// [silent], says nothing when there are none.
  Future<void> restore({bool silent = false}) async {
    final store = _store;
    if (store == null || state.busy) return;
    final uid = await _account();
    if (uid == null || !ref.mounted) return;
    state = state.copyWith(busy: true, clearMessage: true);
    _seen = 0;
    try {
      await store.restore(obfuscatedAccountId(uid));
      // Restored purchases arrive on the stream; give them a moment.
      await Future<void>.delayed(restoreWait);
      if (!ref.mounted || _seen > 0 || !state.busy) return;
      state = state.copyWith(
        busy: false,
        message: silent
            ? null
            : 'No Google Play purchase found for this account.',
      );
      // Also picks up a purchase made on the website meanwhile.
      if (!silent) await ref.read(appProvider.notifier).reload();
    } catch (_) {
      if (!ref.mounted) return;
      state = state.copyWith(
        busy: false,
        message: silent ? null : 'Could not reach Google Play to restore.',
      );
    }
  }

  Future<void> _onPurchases(List<PurchaseDetails> purchases) async {
    for (final p in purchases) {
      // A failed or cancelled sheet with no purchase comes with no product id.
      final ours =
          p.productID == AppConfig.playProductId ||
          (p.productID.isEmpty && p.status != PurchaseStatus.purchased);
      if (!ours) continue;
      _seen++;
      switch (p.status) {
        case PurchaseStatus.pending:
          state = state.copyWith(
            busy: false,
            pending: true,
            message: 'Payment pending. The course unlocks as soon as Google Play confirms it.',
          );
        case PurchaseStatus.canceled:
          state = state.copyWith(
            busy: false,
            pending: false,
            message: 'Purchase cancelled.',
          );
          if (p.pendingCompletePurchase) await _store?.complete(p);
        case PurchaseStatus.error:
          if (p.pendingCompletePurchase) await _store?.complete(p);
          state = state.copyWith(busy: false, pending: false);
          if (isAlreadyOwned(p.error?.code, p.error?.message)) {
            await restore();
          } else {
            state = state.copyWith(
              message: 'The purchase did not go through. Please try again.',
            );
          }
        case PurchaseStatus.purchased || PurchaseStatus.restored:
          await _verify(p);
      }
    }
  }

  Future<void> _verify(PurchaseDetails p) async {
    if (ref.read(appProvider).account == null) {
      _waiting.add(p);
      return;
    }
    state = state.copyWith(busy: true, pending: false, clearMessage: true);
    final backend = ref.read(backendProvider);
    VerifyResult result;
    try {
      result = await backend.verifyPlayPurchase(
        productId: p.productID,
        purchaseToken: p.verificationData.serverVerificationData,
      );
    } catch (_) {
      result = verifyFailure(0, null);
    }
    if (!ref.mounted) return;
    if (!result.ok) {
      state = state.copyWith(busy: false, message: result.message);
      return;
    }
    // Only now tell Play the purchase is delivered.
    if (p.pendingCompletePurchase) {
      try {
        await _store?.complete(p);
      } catch (_) {
        // The server acknowledged it already.
      }
    }
    await ref.read(appProvider.notifier).reload(refreshContent: true);
    if (!ref.mounted) return;
    state = state.copyWith(busy: false, clearMessage: true);
  }
}
