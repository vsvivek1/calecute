import 'package:flutter/material.dart';

/// Earth and strata colours, matched to calecutech.com/geological-assistant.
class Strata {
  static const s1 = Color(0xFFD9A066);
  static const s2 = Color(0xFFC4793D);
  static const s3 = Color(0xFF8A5A3B);
  static const s4 = Color(0xFF5C4033);
  static const s5 = Color(0xFF3A2E27);
  static const layers = [s1, s2, s3, s4, s5];

  static const ink = Color(0xFF1F2A33);
  static const accent = Color(0xFFB4531F);
  static const accentDark = Color(0xFFE08A4C);
  static const ok = Color(0xFF2F6B4F);
  static const okDark = Color(0xFF6FC09A);
  static const bad = Color(0xFFB3261E);

  /// Colour for unit 1..5.
  static Color unit(int number) => layers[(number - 1).clamp(0, 4)];
}

/// Colours that change between light and dark.
class Palette extends ThemeExtension<Palette> {
  const Palette({
    required this.muted,
    required this.line,
    required this.ok,
    required this.bad,
    required this.warn,
  });

  final Color muted;
  final Color line;
  final Color ok;
  final Color bad;
  final Color warn;

  static Palette of(BuildContext context) =>
      Theme.of(context).extension<Palette>()!;

  @override
  Palette copyWith({
    Color? muted,
    Color? line,
    Color? ok,
    Color? bad,
    Color? warn,
  }) => Palette(
    muted: muted ?? this.muted,
    line: line ?? this.line,
    ok: ok ?? this.ok,
    bad: bad ?? this.bad,
    warn: warn ?? this.warn,
  );

  @override
  Palette lerp(Palette? other, double t) => other == null
      ? this
      : Palette(
          muted: Color.lerp(muted, other.muted, t)!,
          line: Color.lerp(line, other.line, t)!,
          ok: Color.lerp(ok, other.ok, t)!,
          bad: Color.lerp(bad, other.bad, t)!,
          warn: Color.lerp(warn, other.warn, t)!,
        );
}

ThemeData buildTheme(Brightness brightness) {
  final dark = brightness == Brightness.dark;
  final bg = dark ? const Color(0xFF16110D) : const Color(0xFFF6F1E7);
  final fg = dark ? const Color(0xFFF0E6D6) : const Color(0xFF2A2118);
  final card = dark ? const Color(0xFF201913) : const Color(0xFFFFFDF8);
  final line = dark ? const Color(0xFF3A2E23) : const Color(0xFFE0D5C0);
  final accent = dark ? Strata.accentDark : Strata.accent;

  final scheme =
      ColorScheme.fromSeed(
        seedColor: Strata.accent,
        brightness: brightness,
      ).copyWith(
        primary: accent,
        onPrimary: dark ? const Color(0xFF1A120B) : Colors.white,
        secondary: Strata.s3,
        surface: bg,
        onSurface: fg,
        surfaceContainerLowest: card,
        surfaceContainerLow: card,
        surfaceContainer: card,
        outline: line,
        outlineVariant: line,
        error: Strata.bad,
      );

  final base = ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: bg,
  );

  return base.copyWith(
    textTheme: base.textTheme.copyWith(
      // Serif body text like the website; UI chrome stays sans.
      bodyLarge: base.textTheme.bodyLarge?.copyWith(
        fontFamily: 'serif',
        fontSize: 18,
        height: 1.5,
      ),
      bodyMedium: base.textTheme.bodyMedium?.copyWith(height: 1.45),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Strata.ink,
      foregroundColor: const Color(0xFFF0E6D6),
      elevation: 0,
      titleTextStyle: base.textTheme.titleLarge?.copyWith(
        color: const Color(0xFFF0E6D6),
        fontWeight: FontWeight.w700,
      ),
    ),
    cardTheme: CardThemeData(
      color: card,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: line),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(48, 50),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 50),
        foregroundColor: fg,
        side: BorderSide(color: line),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: card,
      indicatorColor: accent.withValues(alpha: 0.18),
    ),
    dividerTheme: DividerThemeData(color: line),
    extensions: [
      Palette(
        muted: dark ? const Color(0xFFB5A58F) : const Color(0xFF6B5D4D),
        line: line,
        ok: dark ? Strata.okDark : Strata.ok,
        bad: dark ? const Color(0xFFF2867E) : Strata.bad,
        warn: dark ? const Color(0xFFF0B060) : const Color(0xFF9A5B00),
      ),
    ],
  );
}
