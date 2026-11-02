import 'dart:async';

import 'package:in_app_purchase/in_app_purchase.dart';

import 'paper_access.dart';

/// Google Play Billing through the in_app_purchase plugin.
class PlayBilling implements StoreBilling {
  PlayBilling() {
    _sub = _iap.purchaseStream.listen(_onUpdate, onError: (_) {
      _errors.add('Google Play reported a problem. Try again.');
    });
  }

  final _iap = InAppPurchase.instance;
  final _out = StreamController<List<StorePurchase>>.broadcast();
  final _errors = StreamController<String>.broadcast();
  final Map<String, ProductDetails> _details = {};
  late final StreamSubscription<List<PurchaseDetails>> _sub;

  @override
  Stream<List<StorePurchase>> get purchases => _out.stream;

  @override
  Stream<String> get errors => _errors.stream;

  @override
  Future<bool> available() => _iap.isAvailable();

  @override
  Future<Map<String, String>> prices(Set<String> productIds) async {
    final res = await _iap.queryProductDetails(productIds);
    for (final d in res.productDetails) {
      _details[d.id] = d;
    }
    return {for (final d in res.productDetails) d.id: d.price};
  }

  @override
  Future<void> buy(String productId, {required String accountId}) async {
    var d = _details[productId];
    if (d == null) {
      await prices({productId});
      d = _details[productId];
    }
    if (d == null) throw StateError('product $productId not found');
    await _iap.buyNonConsumable(purchaseParam: PurchaseParam(productDetails: d, applicationUserName: accountId));
  }

  @override
  Future<void> restore() => _iap.restorePurchases();

  void _onUpdate(List<PurchaseDetails> list) {
    final ready = <StorePurchase>[];
    for (final p in list) {
      switch (p.status) {
        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          ready.add(StorePurchase(
            productId: p.productID,
            token: p.verificationData.serverVerificationData,
            complete: () async {
              if (p.pendingCompletePurchase) await _iap.completePurchase(p);
            },
          ));
        case PurchaseStatus.pending:
          _errors.add('Payment is pending. The paper unlocks when Google Play confirms it.');
        case PurchaseStatus.canceled:
          _errors.add('Purchase cancelled.');
        case PurchaseStatus.error:
          _errors.add(p.error?.message ?? 'Google Play could not finish the purchase.');
      }
    }
    if (ready.isNotEmpty) _out.add(ready);
  }

  void dispose() {
    _sub.cancel();
    _out.close();
    _errors.close();
  }
}
