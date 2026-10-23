import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:recallio_core/recallio_core.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(url: supabaseUrl, publishableKey: supabaseKey);
  final client = Supabase.instance.client;

  final raw = jsonDecode(await rootBundle.loadString('assets/content.json')) as Map<String, dynamic>;
  final cards = [
    for (final c in raw['cards'] as List) CourseCard.fromJson((c as Map).cast<String, dynamic>()),
  ];

  final store = await LocalStore.open(energyCourse.id);
  // Google Play Billing on Android; the web unlocks with coupons only.
  final access = PaperAccess(
    pricing: energyCourse.pricing!,
    client: client,
    storageKey: energyCourse.id,
    billing: !kIsWeb && defaultTargetPlatform == TargetPlatform.android ? PlayBilling() : null,
  );
  final controller = StudyController(
    config: energyCourse,
    library: CourseLibrary(cards),
    store: store,
    sync: SyncService(client, rpc: energyCourse.syncRpc),
    alerts: AlertService(channelId: energyCourse.id, appName: energyCourse.appName),
    access: access,
  );
  final auth = AuthGateway(client, androidRedirect: energyCourse.androidRedirect);
  // Signing in pulls progress and owned papers from the account.
  client.auth.onAuthStateChange.listen((s) {
    if (s.event == AuthChangeEvent.signedIn) {
      controller.syncNow();
      access.refresh();
    } else if (s.event == AuthChangeEvent.signedOut) {
      access.clearLocal();
    }
  });
  await access.start();
  await controller.start();

  runApp(EnergyApp(controller: controller, auth: auth));
}

class EnergyApp extends StatefulWidget {
  const EnergyApp({super.key, required this.controller, required this.auth});
  final StudyController controller;
  final AuthGateway auth;

  @override
  State<EnergyApp> createState() => _EnergyAppState();
}

class _EnergyAppState extends State<EnergyApp> {
  String? _lang;

  @override
  Widget build(BuildContext context) {
    final c = widget.controller;
    return ListenableBuilder(
      listenable: c,
      builder: (context, _) {
        final lang = c.onboarded ? c.settings.language : (_lang ?? c.settings.language);
        return MaterialApp(
          title: 'Energy Auditor · Recallio',
          debugShowCheckedModeBanner: false,
          theme: energyTheme(Brightness.light),
          darkTheme: energyTheme(Brightness.dark),
          builder: (context, child) => TScope(t: T(lang), child: child!),
          home: c.onboarded
              ? FeedPage(controller: c, auth: widget.auth)
              : OnboardingPage(
                  controller: c,
                  auth: widget.auth,
                  onLanguage: (l) => setState(() => _lang = l),
                ),
        );
      },
    );
  }
}
