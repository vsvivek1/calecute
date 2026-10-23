/// Build-time settings, passed with `--dart-define` or
/// `--dart-define-from-file=config/prod.json`. Nothing secret lives here: the
/// Supabase publishable key and the Google web client id are public values.
///
/// When any of the three is empty the app runs in demo mode with a small
/// bundled sample and no sign-in.
class AppConfig {
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
  );

  /// The Postgres schema that holds this course inside the USS project.
  static const schema = 'geological_assistant';

  static bool get isConfigured =>
      supabaseUrl.isNotEmpty &&
      supabaseKey.isNotEmpty &&
      googleWebClientId.isNotEmpty;

  /// Google Play in-app product (one-time, non-consumable, lifetime access).
  /// Create it in Play Console > Monetize > In-app products with this id.
  /// Billing is off in demo mode and when this is empty.
  static const playProductId = String.fromEnvironment(
    'PLAY_PRODUCT_ID',
    defaultValue: 'geological_assistant_lifetime',
  );

  /// Edge function that checks a Play purchase token and grants access.
  static const playVerifyFunction = 'ga-play-verify';

  static bool get billingConfigured => isConfigured && playProductId.isNotEmpty;

  static const siteUrl = 'https://calecutech.com/geological-assistant';
  static const privacyUrl = '$siteUrl/privacy/';
  static const termsUrl = '$siteUrl/terms/';
  static const deleteAccountUrl = '$siteUrl/delete-account/';
  static const supportUrl = '$siteUrl/support/';
}
