import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';

import '../engine/min_time.dart';
import '../model/card.dart';
import '../model/progress.dart';
import '../model/rating.dart';
import 'min_time_gate.dart';
import 'strings.dart';

enum _Footer { next, reveal, rate }

class _Screen {
  const _Screen({
    required this.kind,
    required this.minText,
    required this.footer,
    required this.body,
    this.speak = '',
    this.explain,
    this.authorSeconds,
    this.label,
  });

  final ScreenKind kind;
  final String minText;
  final _Footer footer;
  final Widget Function(BuildContext, bool showExplain) body;
  final String speak;

  /// Optional "Explain" text for this screen.
  final String? explain;
  final int? authorSeconds;
  final String? label;
}

/// One card, full screen, one screen at a time. The only way out is a
/// rating at the end; there is no back and no skip.
class StudyCardView extends StatefulWidget {
  const StudyCardView({
    super.key,
    required this.card,
    required this.mode,
    required this.progress,
    required this.sectionName,
    required this.initialScreen,
    required this.initialElapsed,
    required this.onScreen,
    required this.onRate,
  });

  final CourseCard card;
  final ReviewMode mode;
  final CardProgress? progress;
  final String sectionName;
  final int initialScreen;
  final int initialElapsed;
  final void Function(int screen, int elapsed) onScreen;
  final void Function(StudyRating rating, int seconds) onRate;

  @override
  State<StudyCardView> createState() => _StudyCardViewState();
}

class _StudyCardViewState extends State<StudyCardView> {
  late int _screen = widget.initialScreen;
  late int _startElapsed = widget.initialElapsed;
  int _spent = 0;
  bool _showExplain = false;
  bool _explainedOnce = false;
  bool _simpleVersion = false;
  final _tts = FlutterTts();
  bool _busy = false;

  CourseCard get c => widget.card;
  bool get _review => widget.mode != ReviewMode.learn;

  @override
  void dispose() {
    _stopSpeech();
    super.dispose();
  }

  /// Speech is a nice-to-have: never let it block or break the card.
  void _stopSpeech() {
    _tts.stop().then((_) {}, onError: (_) {});
  }

  void _speak(String text) {
    _tts.speak(text).then((_) {}, onError: (_) {});
  }

  List<_Screen> _screens(T t) {
    final theme = Theme.of(context);
    final key = theme.textTheme.headlineSmall!.copyWith(fontSize: 22, fontWeight: FontWeight.w700, height: 1.3);
    final body = theme.textTheme.bodyLarge!.copyWith(fontSize: 18, height: 1.45);
    final muted = body.copyWith(color: theme.colorScheme.onSurfaceVariant);

    Widget whyBlock(String? why) => why == null || why.isEmpty
        ? const SizedBox.shrink()
        : _Panel(title: t.why, child: Text(why, style: body));

    switch (c.kind) {
      case CardKind.summary:
        return [
          _Screen(
            kind: ScreenKind.summary,
            minText: c.points.join(' '),
            footer: _Footer.rate,
            speak: '${c.topic}. ${c.points.join('. ')}',
            body: (_, _) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.keyPoints, style: muted),
                const SizedBox(height: 12),
                for (final p in c.points)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('•  ', style: key.copyWith(fontSize: 20)),
                      Expanded(child: Text(p, style: body)),
                    ]),
                  ),
              ],
            ),
          ),
        ];

      case CardKind.fact:
        if (!_review) {
          return [
            _Screen(
              kind: ScreenKind.factLearn,
              minText: '${c.prompt} ${c.answer} ${c.why ?? ''}',
              footer: _Footer.rate,
              speak: '${c.prompt}. ${c.answer}. ${c.why ?? ''}',
              body: (_, _) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(c.prompt, style: muted),
                const SizedBox(height: 14),
                Text(c.answer, style: key),
                const SizedBox(height: 20),
                whyBlock(c.why),
              ]),
            ),
          ];
        }
        final pushAgain = widget.progress?.stillTough ?? false;
        return [
          _Screen(
            kind: ScreenKind.factRecall,
            minText: '',
            authorSeconds: recallThinkSeconds,
            footer: _Footer.reveal,
            speak: c.prompt,
            label: widget.mode == ReviewMode.check ? t.quickCheck : null,
            body: (_, _) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (pushAgain && (c.why?.isNotEmpty ?? false)) ...[
                _Panel(title: t.toughOne, child: Text(c.why!, style: body)),
                const SizedBox(height: 20),
              ],
              Text(c.prompt, style: key),
              const SizedBox(height: 16),
              Text(t.thinkFirst, style: muted),
            ]),
          ),
          _Screen(
            kind: ScreenKind.factRecall,
            minText: '${c.answer} ${c.why ?? ''}',
            footer: _Footer.rate,
            speak: '${c.answer}. ${c.why ?? ''}',
            body: (_, _) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.prompt, style: muted),
              const SizedBox(height: 14),
              Text(c.answer, style: key),
              const SizedBox(height: 20),
              whyBlock(c.why),
            ]),
          ),
        ];

      case CardKind.math:
      case CardKind.steps:
        final stepKind = c.kind == CardKind.math ? ScreenKind.mathStep : ScreenKind.step;
        final answerScreen = _Screen(
          kind: ScreenKind.factRecall,
          minText: c.answer,
          footer: _Footer.rate,
          speak: c.answer,
          body: (_, _) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(c.prompt, style: muted, maxLines: 4, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 16),
            _AnswerBox(label: t.answer, text: c.answer, style: key),
            const SizedBox(height: 16),
            whyBlock(c.why),
          ]),
        );
        if (_review) {
          return [
            _Screen(
              kind: ScreenKind.practice,
              minText: c.prompt,
              footer: _Footer.reveal,
              speak: c.prompt,
              body: (_, _) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(c.prompt, style: key.copyWith(fontSize: 20)),
                const SizedBox(height: 16),
                Text(t.solveOnPaper, style: muted),
              ]),
            ),
            _Screen(
              kind: ScreenKind.factRecall,
              minText: c.answer,
              footer: _Footer.rate,
              speak: c.answer,
              body: (_, _) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                for (final (i, s) in c.steps.indexed)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text('${i + 1}. ${s.text}${s.answer == null ? '' : '\n   ${s.answer}'}', style: body),
                  ),
                const SizedBox(height: 8),
                _AnswerBox(label: t.answer, text: c.answer, style: key),
              ]),
            ),
          ];
        }
        return [
          _Screen(
            kind: stepKind,
            minText: c.prompt,
            footer: _Footer.next,
            speak: c.prompt,
            body: (_, _) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.prompt, style: key.copyWith(fontSize: 20)),
              const SizedBox(height: 16),
              Text('${t.solveOnPaper} · ${t.steps(c.steps.length)}', style: muted),
            ]),
          ),
          for (final (i, s) in c.steps.indexed)
            _Screen(
              kind: stepKind,
              minText: '${s.text} ${s.answer ?? ''}',
              footer: _Footer.next,
              speak: '${s.text}. ${s.answer ?? ''}',
              explain: s.explain,
              label: t.stepOf(i + 1, c.steps.length),
              body: (_, showExplain) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(s.text, style: key.copyWith(fontSize: 20)),
                if (s.answer != null) ...[
                  const SizedBox(height: 16),
                  _AnswerBox(label: null, text: s.answer!, style: body.copyWith(fontWeight: FontWeight.w600)),
                ],
                if (showExplain && s.explain != null) ...[
                  const SizedBox(height: 16),
                  _Panel(title: t.explain, child: Text(s.explain!, style: body)),
                ],
              ]),
            ),
          answerScreen,
        ];
    }
  }

  void _advance(int elapsed) {
    setState(() {
      _spent += elapsed - _startElapsed;
      _screen++;
      _startElapsed = 0;
      _showExplain = false;
      _explainedOnce = false;
    });
    widget.onScreen(_screen, 0);
  }

  Future<void> _rate(StudyRating r, int elapsed) async {
    if (_busy) return;
    if (r == StudyRating.didntGet && !_simpleVersion) {
      // Show the simple explanation on the same card first.
      setState(() {
        _spent += elapsed - _startElapsed;
        _startElapsed = 0;
        _simpleVersion = true;
      });
      return;
    }
    _busy = true;
    _stopSpeech();
    widget.onRate(r, _spent + elapsed - _startElapsed);
  }

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final theme = Theme.of(context);
    final screens = _screens(t);
    final idx = _screen.clamp(0, screens.length - 1);
    final s = screens[idx];

    if (_simpleVersion) {
      final text = (c.why?.isNotEmpty ?? false) ? c.why! : c.answer;
      final need = minSeconds(ScreenKind.factRecall, text);
      return _Shell(
        topic: c.topic,
        section: widget.sectionName,
        label: t.simpler,
        onSpeak: () => _speak(text),
        body: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(c.answer, style: theme.textTheme.titleLarge!.copyWith(fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          if (text != c.answer) _Panel(title: t.why, child: Text(text, style: const TextStyle(fontSize: 18, height: 1.45))),
          const SizedBox(height: 12),
          Text(t.comesBack, style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
        ]),
        footer: MinTimeGate(
          key: const ValueKey('simple'),
          required: need,
          builder: (_, p, _, e) => SizedBox(
            width: double.infinity,
            child: GatedButton(label: t.continueLabel, progress: p, onPressed: () => _rate(StudyRating.didntGet, e)),
          ),
        ),
      );
    }

    var need = minSeconds(s.kind, s.minText, authorSeconds: s.authorSeconds);
    if (_explainedOnce && s.explain != null) need += minSeconds(ScreenKind.step, s.explain!);

    return MinTimeGate(
      key: ValueKey('${c.id}#$idx'),
      required: need,
      initial: _startElapsed,
      onTick: (e) {
        widget.onScreen(idx, e);
      },
      builder: (context, p, unlocked, elapsed) {
        final footer = switch (s.footer) {
          _Footer.rate => RatingBar(progress: p, onRate: (r) => _rate(r, elapsed)),
          _Footer.reveal => SizedBox(
              width: double.infinity,
              child: GatedButton(
                label: c.kind == CardKind.fact ? t.showAnswer : t.showWorking,
                progress: p,
                onPressed: () => _advance(elapsed),
              ),
            ),
          _Footer.next => Row(children: [
              if (s.explain != null) ...[
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(minimumSize: const Size(0, 52)),
                    onPressed: () => setState(() {
                      _showExplain = !_showExplain;
                      _explainedOnce = true;
                    }),
                    child: Text(_showExplain ? t.hideExplain : t.explain),
                  ),
                ),
                const SizedBox(width: 10),
              ],
              Expanded(child: GatedButton(label: t.nextStep, progress: p, onPressed: () => _advance(elapsed))),
            ]),
        };
        return _Shell(
          topic: c.topic,
          section: widget.sectionName,
          label: s.label,
          dots: screens.length > 2 ? (idx, screens.length) : null,
          onSpeak: () => _speak(s.speak),
          body: s.body(context, _showExplain),
          footer: footer,
        );
      },
    );
  }
}

class _Shell extends StatelessWidget {
  const _Shell({
    required this.topic,
    required this.section,
    required this.body,
    required this.footer,
    required this.onSpeak,
    this.label,
    this.dots,
  });

  final String topic;
  final String section;
  final String? label;
  final (int, int)? dots;
  final Widget body;
  final Widget footer;
  final VoidCallback onSpeak;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(children: [
          Expanded(
            child: Wrap(spacing: 8, runSpacing: 6, children: [
              _Chip(section, strong: true),
              if (topic.isNotEmpty) _Chip(topic),
              if (label != null) _Chip(label!),
            ]),
          ),
          IconButton(
            tooltip: 'Read aloud',
            onPressed: onSpeak,
            icon: const Icon(Icons.volume_up_outlined),
          ),
        ]),
        if (dots != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Row(children: [
              for (var i = 0; i < dots!.$2; i++)
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(right: 6),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i <= dots!.$1 ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                  ),
                ),
            ]),
          ),
        const SizedBox(height: 12),
        // Fits one screen; a very large system font may scroll inside the
        // card, but the card itself never moves away.
        Expanded(child: SingleChildScrollView(child: body)),
        const SizedBox(height: 12),
        footer,
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip(this.text, {this.strong = false});
  final String text;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: strong ? s.primaryContainer : s.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(fontSize: 12.5, color: strong ? s.onPrimaryContainer : s.onSurfaceVariant),
      ),
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: s.secondaryContainer.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: TextStyle(fontWeight: FontWeight.w700, color: s.onSecondaryContainer)),
        const SizedBox(height: 6),
        child,
      ]),
    );
  }
}

class _AnswerBox extends StatelessWidget {
  const _AnswerBox({required this.label, required this.text, required this.style});
  final String? label;
  final String text;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: s.primary, width: 1.5),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (label != null) Text(label!, style: TextStyle(color: s.primary, fontWeight: FontWeight.w700)),
        if (label != null) const SizedBox(height: 4),
        Text(text, style: style),
      ]),
    );
  }
}
