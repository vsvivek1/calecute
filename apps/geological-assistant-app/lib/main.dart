import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_state.dart';
import 'backend.dart';
import 'config.dart';
import 'local_store.dart';
import 'screens/entry.dart';
import 'screens/home_shell.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final store = await LocalStore.open();
  final Backend backend;
  if (AppConfig.isConfigured) {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      publishableKey: AppConfig.supabaseKey,
    );
    backend = SupabaseBackend();
  } else {
    backend = DemoBackend();
  }
  runApp(
    ProviderScope(
      overrides: [
        backendProvider.overrideWithValue(backend),
        storeProvider.overrideWithValue(store),
      ],
      child: const GeologicalAssistantApp(),
    ),
  );
}

class GeologicalAssistantApp extends StatelessWidget {
  const GeologicalAssistantApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Geological Assistant',
    debugShowCheckedModeBanner: false,
    theme: buildTheme(Brightness.light),
    darkTheme: buildTheme(Brightness.dark),
    home: const Gate(),
  );
}

/// Shows the screen that fits where the account is: signed out, waiting for
/// the course to be unlocked, or ready to study.
class Gate extends ConsumerWidget {
  const Gate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phase = ref.watch(appProvider.select((s) => s.phase));
    return switch (phase) {
      Phase.starting || Phase.loading => const LoadingScreen(),
      Phase.signedOut => const SignInScreen(),
      Phase.locked => const LockedScreen(),
      Phase.error => const ErrorScreen(),
      Phase.ready => const HomeShell(),
    };
  }
}
