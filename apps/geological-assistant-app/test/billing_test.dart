import 'dart:async';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:geological_assistant/app_state.dart';
import 'package:geological_assistant/backend.dart';
import 'package:geological_assistant/billing.dart';
import 'package:geological_assistant/billing_logic.dart';
import 'package:geological_assistant/config.dart';
import 'package:geological_assistant/local_store.dart';
import 'package:geological_assistant/models.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _user = Account(id: 'user-1', email: 'a@b.c', name: 'A');

class FakeBackend extends DemoBackend {
  bool granted = false;
  VerifyResult answer = const VerifyResult.ok();
  final verified = <String>[];

  @override
  Account? get currentAccount => _user;

  @override
  Future<bool> hasAccess() async => granted;

  @override
  Future<VerifyResult> verifyPlayPurchase({
    required String productId,
    required String purchaseToken,
  }) async {
    verified.add(purchaseToken);
    if (answer.ok) granted = true;
    return answer;
  }
}

class FakeStore implements PlayStore {
  final controller = StreamController<List<PurchaseDetails>>.broadcast();
  final completed = <PurchaseDetails>[];
  final buyAccounts = <String>[];
  final restoreAccounts = <String>[];

  @override
  Stream<List<PurchaseDetails>> get purchases => controller.stream;

  @override
  Future<bool> isAvailable() async => true;

  @override
  Future<ProductDetails?> queryProduct(String id) async => ProductDetails(
    id: id,
    title: 'Geological Assistant',
    description: 'Lifetime',
    price: '₹3,000',
    rawPrice: 3000,
    currencyCode: 'INR',
  );

  @override
  Future<bool> buy(ProductDetails product, String accountId) async {
    buyAccounts.add(accountId);
    return true;
  }

  @override
  Future<void> restore(String accountId) async =>
      restoreAccounts.add(accountId);

  @override
  Future<void> complete(PurchaseDetails purchase) async =>
      completed.add(purchase);
}

PurchaseDetails purchase(PurchaseStatus status, {String token = 'tok-1'}) =>
    PurchaseDetails(
      purchaseID: 'GPA.1',
      productID: AppConfig.playProductId,
      status: status,
      transactionDate: null,
      verificationData: PurchaseVerificationData(
        localVerificationData: '',
        serverVerificationData: token,
        source: 'google_play',
      ),
    )..pendingCompletePurchase = status != PurchaseStatus.pending;

Future<void> settle() async {
  for (var i = 0; i < 30; i++) {
    await Future<void>.delayed(const Duration(milliseconds: 5));
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('billing logic', () {
    test('account id is the sha256 hex of the user id', () {
      // Play caps the obfuscated account id at 64 characters.
      expect(obfuscatedAccountId(_user.id), hasLength(64));
      expect(
        obfuscatedAccountId('abc'),
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      );
    });

    test('verify failures map to messages', () {
      expect(
        verifyFailure(403, {'error': 'other_account'}).message,
        contains('different account'),
      );
      expect(
        verifyFailure(409, '{"error":"refunded"}').message,
        contains('refunded'),
      );
      expect(verifyFailure(409, {'error': 'not_purchased'}).retry, isFalse);
      expect(verifyFailure(502, null).retry, isTrue);
      expect(verifyFailure(0, null).retry, isTrue);
    });

    test('already owned is recognised', () {
      expect(
        isAlreadyOwned('purchase_error', 'BillingResponse.itemAlreadyOwned'),
        isTrue,
      );
      expect(
        isAlreadyOwned('purchase_error', 'BillingResponse.error'),
        isFalse,
      );
    });
  });

  group('billing controller', () {
    late FakeBackend backend;
    late FakeStore store;
    late ProviderContainer container;

    setUp(() async {
      BillingController.restoreWait = const Duration(milliseconds: 20);
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      backend = FakeBackend();
      store = FakeStore();
      container = ProviderContainer(
        overrides: [
          backendProvider.overrideWithValue(backend),
          storeProvider.overrideWithValue(
            LocalStore(prefs, Directory.systemTemp.createTempSync('ga_bill')),
          ),
          playStoreProvider.overrideWithValue(store),
        ],
      );
      container.listen(billingProvider, (_, _) {});
      container.read(appProvider);
      await settle();
    });

    tearDown(() => container.dispose());

    test(
      'locked account sees the Play price and is restored quietly once',
      () async {
        expect(container.read(appProvider).phase, Phase.locked);
        final billing = container.read(billingProvider);
        expect(billing.supported, isTrue);
        expect(billing.product?.price, '₹3,000');
        expect(billing.message, isNull);
        expect(store.restoreAccounts, [obfuscatedAccountId(_user.id)]);
      },
    );

    test('buy -> server ok -> complete -> unlocked', () async {
      await container.read(billingProvider.notifier).buy();
      expect(store.buyAccounts, [obfuscatedAccountId(_user.id)]);
      expect(container.read(billingProvider).busy, isTrue);

      final p = purchase(PurchaseStatus.purchased);
      store.controller.add([p]);
      await settle();

      expect(backend.verified, ['tok-1']);
      expect(store.completed, [p]);
      expect(container.read(appProvider).phase, Phase.ready);
      expect(container.read(billingProvider).busy, isFalse);
    });

    test('server failure leaves the purchase unfinished', () async {
      backend.answer = verifyFailure(502, null);
      store.controller.add([purchase(PurchaseStatus.purchased)]);
      await settle();

      expect(store.completed, isEmpty);
      expect(container.read(appProvider).phase, Phase.locked);
      expect(container.read(billingProvider).message, contains('Restore'));
    });

    test('pending and cancelled', () async {
      store.controller.add([purchase(PurchaseStatus.pending)]);
      await settle();
      expect(container.read(billingProvider).pending, isTrue);
      expect(backend.verified, isEmpty);

      store.controller.add([purchase(PurchaseStatus.canceled)]);
      await settle();
      final billing = container.read(billingProvider);
      expect(billing.pending, isFalse);
      expect(billing.busy, isFalse);
      expect(billing.message, 'Purchase cancelled.');
    });
  });
}
