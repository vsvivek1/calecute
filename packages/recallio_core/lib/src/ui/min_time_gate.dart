import 'dart:async';

import 'package:flutter/material.dart';

import '../model/rating.dart';
import 'strings.dart';

/// Counts seconds on one screen, only while the app is in the foreground.
/// Buttons built by [builder] unlock when [required] seconds have passed.
class MinTimeGate extends StatefulWidget {
  const MinTimeGate({
    super.key,
    required this.required,
    this.initial = 0,
    this.onTick,
    required this.builder,
  });

  final int required;
  final int initial;

  /// Called every few seconds and on pause with the elapsed time, so the
  /// sitting can be saved.
  final void Function(int elapsed)? onTick;
  final Widget Function(BuildContext context, double progress, bool unlocked, int elapsed) builder;

  @override
  State<MinTimeGate> createState() => _MinTimeGateState();
}

class _MinTimeGateState extends State<MinTimeGate> {
  late int _elapsed = widget.initial;
  Timer? _timer;
  bool _foreground = true;
  late final AppLifecycleListener _life;

  @override
  void initState() {
    super.initState();
    _life = AppLifecycleListener(onStateChange: (s) {
      final fg = s == AppLifecycleState.resumed;
      if (_foreground && !fg) widget.onTick?.call(_elapsed);
      _foreground = fg;
    });
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!_foreground || !mounted) return;
      setState(() => _elapsed++);
      if (_elapsed % 3 == 0) widget.onTick?.call(_elapsed);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _life.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.required <= 0 ? 1.0 : (_elapsed / widget.required).clamp(0.0, 1.0);
    return widget.builder(context, p, _elapsed >= widget.required, _elapsed);
  }
}

/// A button that fades in with a quiet ring while its gate fills.
class GatedButton extends StatelessWidget {
  const GatedButton({
    super.key,
    required this.label,
    required this.progress,
    required this.onPressed,
    this.filled = true,
  });

  final String label;
  final double progress;
  final VoidCallback? onPressed;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final unlocked = progress >= 1;
    final scheme = Theme.of(context).colorScheme;
    final child = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (!unlocked) ...[
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(value: progress, strokeWidth: 2.5, color: scheme.primary),
          ),
          const SizedBox(width: 10),
        ],
        Flexible(child: Text(label, textAlign: TextAlign.center)),
      ],
    );
    final style = ButtonStyle(minimumSize: WidgetStateProperty.all(const Size(64, 52)));
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 400),
      opacity: unlocked ? 1 : 0.55,
      child: filled
          ? FilledButton(onPressed: unlocked ? onPressed : null, style: style, child: child)
          : OutlinedButton(onPressed: unlocked ? onPressed : null, style: style, child: child),
    );
  }
}

/// The four rating buttons, always the same, always in this order.
class RatingBar extends StatelessWidget {
  const RatingBar({super.key, required this.progress, required this.onRate});

  final double progress;
  final void Function(StudyRating) onRate;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final scheme = Theme.of(context).colorScheme;
    final unlocked = progress >= 1;
    Color tone(StudyRating r) => switch (r) {
          StudyRating.didntGet => scheme.error,
          StudyRating.tough => scheme.tertiary,
          StudyRating.understood => scheme.primary,
          StudyRating.simple => scheme.secondary,
        };
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (!unlocked)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: LinearProgressIndicator(value: progress, minHeight: 3, borderRadius: BorderRadius.circular(2)),
          ),
        AnimatedOpacity(
          duration: const Duration(milliseconds: 400),
          opacity: unlocked ? 1 : 0.4,
          child: Row(
            children: [
              for (final r in StudyRating.values)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: FilledButton(
                      onPressed: unlocked ? () => onRate(r) : null,
                      style: FilledButton.styleFrom(
                        backgroundColor: tone(r),
                        foregroundColor: Colors.white,
                        minimumSize: const Size(0, 60),
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(
                        t.ml ? '${r.ml}\n${r.en}' : r.en,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 13, height: 1.15, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
