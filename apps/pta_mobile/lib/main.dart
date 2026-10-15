import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'src/api.dart';
import 'src/app_state.dart';
import 'src/screens/home.dart';
import 'src/screens/sign_in.dart';
import 'src/widgets.dart';

// Build-time configuration:
//   flutter run --dart-define=SUPABASE_URL=https://xxxx.supabase.co \
//               --dart-define=SUPABASE_KEY=sb_publishable_...
// Without them the app runs against the demo school served by the web app.
const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const supabaseKey = String.fromEnvironment('SUPABASE_KEY');
const demoUrl = String.fromEnvironment(
  'DEMO_URL',
  defaultValue: 'https://pta.calecutech.com',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final Api api;
  if (supabaseUrl.isNotEmpty) {
    await Supabase.initialize(url: supabaseUrl, publishableKey: supabaseKey);
    api = SupabaseApi(Supabase.instance.client);
  } else {
    api = DemoApi(Uri.parse(demoUrl));
  }
  final state = AppState(api);
  await state.restorePrefs();
  runApp(PtaApp(state: state));
}

class PtaApp extends StatelessWidget {
  const PtaApp({super.key, required this.state});
  final AppState state;

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: state,
      child: MaterialApp(
        title: 'Calecutech PTA',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorSchemeSeed: brandBlue,
          scaffoldBackgroundColor: const Color(0xFFF5F7FB),
          useMaterial3: true,
        ),
        home: const Gate(),
      ),
    );
  }
}

/// Signed out: the sign-in screen. Signed in: load who this is, then home.
class Gate extends StatefulWidget {
  const Gate({super.key});
  @override
  State<Gate> createState() => _GateState();
}

class _GateState extends State<Gate> {
  Future<void>? _loading;

  bool _listening = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_listening) return;
    _listening = true;
    final api = AppScope.of(context).api;
    if (api is SupabaseApi) {
      api.client.auth.onAuthStateChange.listen((_) {
        if (mounted) setState(() => _loading = null);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    if (app.api.email == null) {
      return SignInScreen(onSignedIn: () => setState(() => _loading = null));
    }
    _loading ??= app.load();
    return FutureBuilder(
      future: _loading,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (snap.hasError) {
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('${snap.error}', textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () => setState(() => _loading = null),
                      child: const Text('Try again'),
                    ),
                    TextButton(
                      onPressed: () async {
                        await app.signOut();
                        setState(() => _loading = null);
                      },
                      child: const Text('Sign out'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
        if (!app.isParent && !app.isTeacher) {
          return NotLinkedScreen(
            onSignOut: () => setState(() => _loading = null),
          );
        }
        return const HomeScreen();
      },
    );
  }
}
