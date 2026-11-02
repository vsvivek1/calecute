import 'package:flutter/material.dart';

import 'models.dart';
import 'theme.dart';

/// The five-layer strip used across the site and app.
class StrataBar extends StatelessWidget {
  const StrataBar({super.key, this.height = 8});

  final double height;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: height,
    child: const Row(
      children: [
        Expanded(flex: 22, child: ColoredBox(color: Strata.s1)),
        Expanded(flex: 19, child: ColoredBox(color: Strata.s2)),
        Expanded(flex: 22, child: ColoredBox(color: Strata.s3)),
        Expanded(flex: 19, child: ColoredBox(color: Strata.s4)),
        Expanded(flex: 18, child: ColoredBox(color: Strata.s5)),
      ],
    ),
  );
}

/// App logo: wavy rock layers on a dark tile (same as the website's).
class StrataLogo extends StatelessWidget {
  const StrataLogo({super.key, this.size = 72});

  final double size;

  @override
  Widget build(BuildContext context) => Image.asset(
    'assets/branding/icon_512.png',
    width: size,
    height: size,
    semanticLabel: 'Geological Assistant',
  );
}

class Tag extends StatelessWidget {
  const Tag(this.label, {super.key, required this.color, this.icon});

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.12),
      border: Border.all(color: color.withValues(alpha: 0.5)),
      borderRadius: BorderRadius.circular(99),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
        ],
        Flexible(
          child: Text(
            label,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ),
      ],
    ),
  );
}

/// Tags for a fact card: past paper, verify before exam, high priority.
class CardTags extends StatelessWidget {
  const CardTags(this.card, {super.key});

  final FactCard card;

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final accent = Theme.of(context).colorScheme.primary;
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        if (card.isHighPriority)
          Tag('High priority', color: accent, icon: Icons.priority_high),
        if (card.isPastPaper)
          Tag(card.sourceRef!, color: p.ok, icon: Icons.history_edu),
        if (!card.verified)
          Tag(
            'Verify before exam',
            color: p.warn,
            icon: Icons.warning_amber_rounded,
          ),
      ],
    );
  }
}

/// A unit label with its strata colour.
class UnitLabel extends StatelessWidget {
  const UnitLabel(this.unit, {super.key, this.subtitle});

  final Unit unit;
  final String? subtitle;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Container(
        width: 6,
        height: subtitle == null ? 18 : 34,
        decoration: BoxDecoration(
          color: Strata.unit(unit.number),
          borderRadius: BorderRadius.circular(3),
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Unit ${unit.number} · ${unit.name}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            if (subtitle != null)
              Text(
                subtitle!,
                style: TextStyle(
                  color: Palette.of(context).muted,
                  fontSize: 13,
                ),
              ),
          ],
        ),
      ),
    ],
  );
}

/// The body of a fact card: statement, then the reason.
class FactView extends StatelessWidget {
  const FactView(this.card, {super.key, this.unit, this.showReason = true});

  final FactCard card;
  final Unit? unit;
  final bool showReason;

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final text = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (unit != null) ...[UnitLabel(unit!), const SizedBox(height: 6)],
        if (card.subtopic.isNotEmpty)
          Text(card.subtopic, style: TextStyle(color: p.muted, fontSize: 13)),
        const SizedBox(height: 10),
        Text(card.statement, style: text.bodyLarge),
        if (showReason && (card.reasoning ?? '').isNotEmpty) ...[
          const SizedBox(height: 14),
          Text(
            'WHY',
            style: TextStyle(
              color: p.muted,
              fontSize: 12,
              letterSpacing: 1.2,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(card.reasoning!, style: TextStyle(color: p.muted, fontSize: 15)),
        ],
        const SizedBox(height: 14),
        CardTags(card),
      ],
    );
  }
}

/// An answer option for a multiple-choice question.
class OptionTile extends StatelessWidget {
  const OptionTile({
    super.key,
    required this.letter,
    required this.text,
    required this.onTap,
    this.selected = false,
    this.correct,
  });

  final String letter;
  final String text;
  final VoidCallback? onTap;
  final bool selected;

  /// After answering: true for the right option, false for a wrong pick.
  final bool? correct;

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final scheme = Theme.of(context).colorScheme;
    Color border = p.line;
    Color? fill;
    IconData? icon;
    if (correct == true) {
      border = p.ok;
      fill = p.ok.withValues(alpha: 0.14);
      icon = Icons.check_circle;
    } else if (correct == false) {
      border = p.bad;
      fill = p.bad.withValues(alpha: 0.12);
      icon = Icons.cancel;
    } else if (selected) {
      border = scheme.primary;
      fill = scheme.primary.withValues(alpha: 0.12);
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Material(
        color: fill ?? scheme.surfaceContainerLowest,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: BorderSide(
            color: border,
            width: selected || correct != null ? 1.6 : 1,
          ),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${letter.toUpperCase()}.',
                  style: TextStyle(fontWeight: FontWeight.w700, color: p.muted),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(text, style: const TextStyle(fontSize: 16)),
                ),
                if (icon != null) ...[
                  const SizedBox(width: 8),
                  Icon(icon, size: 20, color: border),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(4, 20, 4, 8),
    child: Text(
      text,
      style: Theme.of(context).textTheme.titleMedium
          ?.copyWith(fontWeight: FontWeight.w700),
    ),
  );
}

/// Big number with a caption.
class Stat extends StatelessWidget {
  const Stat(this.value, this.label, {super.key});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                fontFeatures: [FontFeature.tabularFigures()],
              ),
            ),
            Text(
              label,
              style: TextStyle(color: Palette.of(context).muted, fontSize: 13),
            ),
          ],
        ),
      ),
    ),
  );
}
