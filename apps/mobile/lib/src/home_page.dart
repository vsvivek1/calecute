import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'links.dart';
import 'theme.dart';

/// Opens a link in the device browser. Swappable in tests.
typedef LinkOpener = Future<bool> Function(Uri uri);

Future<bool> openInBrowser(Uri uri) =>
    launchUrl(uri, mode: LaunchMode.externalApplication);

/// The single screen of the preview app: what History Clock is, a way to try
/// it on the web, and the policy links a store listing needs.
class HomePage extends StatelessWidget {
  const HomePage({super.key, this.openLink = openInBrowser});

  final LinkOpener openLink;

  Future<void> _open(BuildContext context, Uri uri) async {
    final messenger = ScaffoldMessenger.of(context);
    var ok = false;
    try {
      ok = await openLink(uri);
    } catch (_) {
      ok = false;
    }
    if (!ok) {
      messenger.showSnackBar(
        SnackBar(content: Text('Could not open ${uri.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Transform.rotate(
                    angle: -0.02,
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(22, 28, 22, 26),
                      decoration: Sketch.cardDecoration(),
                      child: Column(
                        children: [
                          const _ClockBadge(),
                          const SizedBox(height: 16),
                          Text(
                            'History Clock',
                            textAlign: TextAlign.center,
                            style: text.displaySmall?.copyWith(
                              color: Sketch.ink,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Spin the clock. Watch empires rise and fall.',
                            textAlign: TextAlign.center,
                            style: text.titleLarge?.copyWith(
                              color: Sketch.terracotta,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'Pick a corner of the world, slide back through the '
                            'centuries, and see the dynasties, monuments, '
                            'thinkers and arts of that place.',
                            textAlign: TextAlign.center,
                            style: text.bodyLarge?.copyWith(
                              color: Sketch.inkSoft,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  _SketchButton(
                    label: 'Try the map on the web',
                    icon: Icons.public,
                    color: Sketch.mustard,
                    onPressed: () => _open(context, HistoryClockLinks.map),
                  ),
                  const SizedBox(height: 14),
                  _SketchButton(
                    label: 'Take the Kerala history quiz',
                    icon: Icons.quiz_outlined,
                    color: Sketch.card,
                    onPressed: () => _open(context, HistoryClockLinks.quiz),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    'This is an early preview. The full app, with the map '
                    'built in, is on its way.',
                    textAlign: TextAlign.center,
                    style: text.bodyMedium?.copyWith(color: Sketch.inkSoft),
                  ),
                  const SizedBox(height: 22),
                  const Divider(color: Sketch.ink, thickness: 1.5),
                  const SizedBox(height: 10),
                  Text(
                    'A Calecutech product',
                    textAlign: TextAlign.center,
                    style: text.titleSmall?.copyWith(
                      color: Sketch.ink,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 4,
                    children: [
                      _FooterLink(
                        'Privacy',
                        () => _open(context, HistoryClockLinks.privacy),
                      ),
                      _FooterLink(
                        'Terms',
                        () => _open(context, HistoryClockLinks.terms),
                      ),
                      _FooterLink(
                        'Delete account',
                        () => _open(context, HistoryClockLinks.deleteAccount),
                      ),
                      _FooterLink(
                        'Contact',
                        () => _open(context, HistoryClockLinks.contact),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ClockBadge extends StatelessWidget {
  const _ClockBadge();

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/images/mascot.png',
      width: 132,
      height: 132,
      semanticLabel: 'History Clock mascot, a crowned clock',
    );
  }
}

class _SketchButton extends StatelessWidget {
  const _SketchButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: Sketch.wobble,
          child: Ink(
            decoration: Sketch.cardDecoration(color: color),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: Sketch.ink),
                const SizedBox(width: 10),
                Flexible(
                  child: Text(
                    label,
                    style: const TextStyle(
                      color: Sketch.ink,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FooterLink extends StatelessWidget {
  const _FooterLink(this.label, this.onTap);

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(foregroundColor: Sketch.ink),
      child: Text(
        label,
        style: const TextStyle(decoration: TextDecoration.underline),
      ),
    );
  }
}
