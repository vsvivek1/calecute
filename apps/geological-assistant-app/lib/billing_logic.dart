import 'dart:convert';

import 'package:crypto/crypto.dart';

/// Sent to Google Play as the purchase's obfuscated account id, so a purchase
/// token can only unlock the account that bought it. `ga-play-verify` hashes
/// the signed-in user's id the same way and compares.
String obfuscatedAccountId(String userId) =>
    sha256.convert(utf8.encode(userId)).toString();

/// What `ga-play-verify` said about a purchase token.
class VerifyResult {
  const VerifyResult.ok() : ok = true, message = null, retry = false;
  const VerifyResult.rejected(this.message, {this.retry = false}) : ok = false;

  final bool ok;
  final String? message;

  /// The server could not decide (Google or the server was down). The
  /// purchase stays unfinished so "Restore purchase" can try again.
  final bool retry;
}

/// Turns a non-2xx answer from `ga-play-verify` into a message for the user.
VerifyResult verifyFailure(int status, Object? details) {
  String? code;
  if (details is Map) code = details['error']?.toString();
  if (details is String) {
    try {
      final decoded = jsonDecode(details);
      if (decoded is Map) code = decoded['error']?.toString();
    } catch (_) {}
  }
  return switch ((status, code)) {
    (401, _) => const VerifyResult.rejected(
      'Your sign-in expired. Sign in again, then tap Restore purchase.',
    ),
    (403, _) => const VerifyResult.rejected(
      'This Google Play purchase belongs to a different account. '
      'Sign in with the account you used when you bought the course.',
    ),
    (409, 'refunded') => const VerifyResult.rejected(
      'This purchase was refunded, so it no longer unlocks the course.',
    ),
    (409, _) => const VerifyResult.rejected(
      'Google Play has not completed this payment yet. '
      'Access unlocks as soon as it does.',
    ),
    (503, _) => const VerifyResult.rejected(
      'Purchases are not switched on yet. Your payment is safe; '
      'tap Restore purchase later or contact support.',
      retry: true,
    ),
    _ => const VerifyResult.rejected(
      'Could not confirm the purchase right now. Your payment is safe; '
      'tap Restore purchase to try again.',
      retry: true,
    ),
  };
}

/// Google Play says the account already owns the product (the purchase
/// sheet failed with ITEM_ALREADY_OWNED). The plugin reports it as
/// "BillingResponse.itemAlreadyOwned".
bool isAlreadyOwned(String? code, String? message) =>
    '${code ?? ''} ${message ?? ''}'.toLowerCase().contains('alreadyowned');
