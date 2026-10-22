import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Google sign-in through Supabase. Optional: the app works signed out and
/// keeps progress on the device.
class AuthGateway extends ChangeNotifier {
  AuthGateway(this.client, {required this.androidRedirect}) {
    client.auth.onAuthStateChange.listen((_) => notifyListeners());
  }

  final SupabaseClient client;
  final String androidRedirect;

  String? get email => client.auth.currentUser?.email;
  bool get signedIn => client.auth.currentSession != null;

  Future<void> signIn() async {
    await client.auth.signInWithOAuth(
      OAuthProvider.google,
      // Web returns to /auth/callback on this site (listed in the Supabase
      // redirect URLs); Android returns through the app's deep link.
      redirectTo: kIsWeb ? '${Uri.base.origin}/auth/callback' : androidRedirect,
      authScreenLaunchMode: kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication,
    );
  }

  Future<void> signOut() => client.auth.signOut();
}
