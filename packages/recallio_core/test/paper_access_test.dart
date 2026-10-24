import 'package:flutter_test/flutter_test.dart';
import 'package:recallio_core/recallio_core.dart';
import 'package:shared_preferences/shared_preferences.dart';

const pricing = CoursePricing(
  freeCardsPerSection: 20,
  productIds: {1: 'paper_1', 2: 'paper_2', 3: 'paper_3', 4: 'paper_4'},
  priceLabel: '₹1,000',
  myPapersRpc: 'em_my_papers',
  redeemRpc: 'em_redeem_coupon',
  verifyFunction: 'em-play-verify',
  applyCouponRpc: 'em_apply_coupon',
);

void main() {
  test('discounted products map back to their paper', () {
    expect(pricing.productFor(2), 'paper_2');
    expect(pricing.productFor(2, 50), 'paper_2_off50');
    expect(pricing.sectionFor('paper_3_off99'), 3);
    expect(pricing.sectionFor('paper_4'), 4);
    expect(pricing.sectionFor('other'), isNull);
    expect(pricing.priceAt(0), 1000);
    expect(pricing.priceAt(25), 750);
    expect(pricing.priceAt(99), 10);
  });

  test('cart totals skip owned papers', () async {
    SharedPreferences.setMockInitialValues({});
    final a = PaperAccess(pricing: pricing, client: null, storageKey: 't');
    await a.start();
    a.addToCart(1);
    a.addToCart(3);
    expect(a.cartTotal, '₹2,000');
    await a.setOwnedForTest({3});
    expect(a.cart, {1});
    expect(a.cartTotal, '₹1,000');
    a.toggleCart(1);
    expect(a.cart, isEmpty);
    expect(await a.checkout(), contains('Sign in'));
  });
}
