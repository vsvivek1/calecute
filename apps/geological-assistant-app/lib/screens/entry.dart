import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app_state.dart';
import '../billing.dart';
import '../config.dart';
import '../theme.dart';
import '../widgets.dart';

Future<void> openLink(String url) =>
    launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

class _EntryLayout extends StatelessWidget {
  const _EntryLayout({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Column(
        children: [
          const StrataBar(),
          Expanded(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: children,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class _Heading extends StatelessWidget {
  const _Heading(this.title, this.body);

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      const Center(child: StrataLogo(size: 84)),
      const SizedBox(height: 20),
      Text(
        title,
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.headlineSmall
            ?.copyWith(fontWeight: FontWeight.w800),
      ),
      const SizedBox(height: 10),
      Text(
        body,
        textAlign: TextAlign.center,
        style: TextStyle(color: Palette.of(context).muted, fontSize: 16),
      ),
      const SizedBox(height: 28),
    ],
  );
}

class LoadingScreen extends StatelessWidget {
  const LoadingScreen({super.key});

  @override
  Widget build(BuildContext context) => const _EntryLayout(
    children: [
      Center(child: StrataLogo(size: 84)),
      SizedBox(height: 28),
      Center(child: CircularProgressIndicator()),
      SizedBox(height: 14),
      Center(child: Text('Loading your course…')),
    ],
  );
}

class SignInScreen extends ConsumerWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appProvider);
    final demo = ref.watch(backendProvider).isDemo;
    return _EntryLayout(
      children: [
        const _Heading(
          'Geological Assistant',
          'Kerala PSC · Ground Water Department\nDaily fact cards, unit quizzes and timed mock tests.',
        ),
        FilledButton.icon(
          onPressed: state.busy
              ? null
              : () => ref.read(appProvider.notifier).signIn(),
          icon: state.busy
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Icon(demo ? Icons.play_arrow : Icons.login),
          label: Text(demo ? 'Try the demo' : 'Continue with Google'),
        ),
        if (state.message != null) ...[
          const SizedBox(height: 12),
          Text(
            state.message!,
            textAlign: TextAlign.center,
            style: TextStyle(color: Palette.of(context).bad),
          ),
        ],
        const SizedBox(height: 16),
        Text(
          demo
              ? 'Demo build: a small sample of cards and questions, saved only on this phone.'
              : 'Use the same Google account you use on the Calecutech website.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Palette.of(context).muted, fontSize: 13),
        ),
        const SizedBox(height: 24),
        Wrap(
          alignment: WrapAlignment.center,
          children: [
            TextButton(
              onPressed: () => openLink(AppConfig.privacyUrl),
              child: const Text('Privacy'),
            ),
            TextButton(
              onPressed: () => openLink(AppConfig.termsUrl),
              child: const Text('Terms'),
            ),
          ],
        ),
      ],
    );
  }
}

/// Signed in, but this account doesn't have the course. Sells it through
/// Google Play when this build can; a purchase made on calecutech.com with
/// the same Google account unlocks the app too.
class LockedScreen extends ConsumerWidget {
  const LockedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appProvider);
    final billing = ref.watch(billingProvider);
    final controller = ref.read(appProvider.notifier);
    final store = ref.read(billingProvider.notifier);
    final email = state.account?.email ?? '';
    final muted = TextStyle(color: Palette.of(context).muted, fontSize: 13);

    if (!billing.supported) {
      return _EntryLayout(
        children: [
          _Heading(
            'Course not active on this account',
            'You are signed in as $email. '
                'If you already have the Geological Assistant course, sign in with the Google account you used to get it.',
          ),
          FilledButton.icon(
            onPressed: () => controller.reload(refreshContent: true),
            icon: const Icon(Icons.refresh),
            label: const Text('Check again'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: controller.signOut,
            child: const Text('Use a different account'),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => openLink(AppConfig.supportUrl),
            child: const Text('Need help? Contact support'),
          ),
        ],
      );
    }

    final product = billing.product;
    final canBuy = product != null && !billing.busy && !billing.pending;
    return _EntryLayout(
      children: [
        const _Heading(
          'Unlock the full course',
          'All the fact cards, unit quizzes and timed mock tests. '
              'One-time purchase, lifetime access.',
        ),
        FilledButton.icon(
          onPressed: canBuy ? store.buy : null,
          icon: billing.busy || billing.loading
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.lock_open),
          label: Text(
            billing.loading
                ? 'Loading price…'
                : product == null
                ? 'Not available'
                : 'Buy for ${product.price}',
          ),
        ),
        if (billing.message != null) ...[
          const SizedBox(height: 12),
          Text(
            billing.message!,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: billing.pending
                  ? Palette.of(context).muted
                  : Palette.of(context).bad,
            ),
          ),
        ],
        const SizedBox(height: 10),
        OutlinedButton(
          onPressed: billing.busy ? null : store.restore,
          child: const Text('Restore purchase'),
        ),
        if (product == null && !billing.loading) ...[
          const SizedBox(height: 4),
          TextButton(
            onPressed: billing.busy ? null : store.loadProduct,
            child: const Text('Try loading the price again'),
          ),
        ],
        const SizedBox(height: 20),
        Text(
          'Signed in as $email.\n'
          'Already bought on calecutech.com? Sign in with the same Google account.',
          textAlign: TextAlign.center,
          style: muted,
        ),
        const SizedBox(height: 4),
        Wrap(
          alignment: WrapAlignment.center,
          children: [
            TextButton(
              onPressed: billing.busy
                  ? null
                  : () => controller.reload(refreshContent: true),
              child: const Text('Check again'),
            ),
            TextButton(
              onPressed: billing.busy ? null : controller.signOut,
              child: const Text('Use a different account'),
            ),
            TextButton(
              onPressed: () => openLink(AppConfig.supportUrl),
              child: const Text('Help'),
            ),
          ],
        ),
      ],
    );
  }
}

class ErrorScreen extends ConsumerWidget {
  const ErrorScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appProvider);
    final controller = ref.read(appProvider.notifier);
    return _EntryLayout(
      children: [
        _Heading('Can\'t load the course', state.message ?? ''),
        FilledButton.icon(
          onPressed: () => controller.reload(),
          icon: const Icon(Icons.refresh),
          label: const Text('Try again'),
        ),
        const SizedBox(height: 10),
        OutlinedButton(
          onPressed: controller.signOut,
          child: const Text('Sign out'),
        ),
      ],
    );
  }
}
