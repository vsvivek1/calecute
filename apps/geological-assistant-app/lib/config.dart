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

  static const siteUrl = 'https://calecutech.com/geological-assistant';
  static const privacyUrl = '$siteUrl/privacy/';
  static const termsUrl = '$siteUrl/terms/';
  static const deleteAccountUrl = '$siteUrl/delete-account/';
  static const supportUrl = '$siteUrl/support/';
}
