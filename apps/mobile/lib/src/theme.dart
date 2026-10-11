import 'package:flutter/material.dart';

/// The History Clock "caricature" palette, shared with the web pages
/// (apps/web/src/components/history-clock/sketch.module.css).
class Sketch {
  const Sketch._();

  static const Color paper = Color(0xFFFBF3E0);
  static const Color card = Color(0xFFFFFAF0);
  static const Color ink = Color(0xFF1F2433);
  static const Color inkSoft = Color(0xFF4A4F5E);
  static const Color terracotta = Color(0xFFD9653B);
  static const Color teal = Color(0xFF2F7F7A);
  static const Color mustard = Color(0xFFE8B64C);

  /// A slightly uneven pen outline, like the web cards.
  static const BorderRadius wobble = BorderRadius.only(
    topLeft: Radius.elliptical(18, 8),
    topRight: Radius.elliptical(6, 16),
    bottomRight: Radius.elliptical(16, 6),
    bottomLeft: Radius.elliptical(8, 18),
  );

  static BoxDecoration cardDecoration({Color color = card}) => BoxDecoration(
    color: color,
    borderRadius: wobble,
    border: Border.all(color: ink, width: 2.5),
    boxShadow: const [BoxShadow(color: ink, offset: Offset(5, 5))],
  );

  static ThemeData theme() => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: terracotta,
      primary: ink,
      secondary: terracotta,
      surface: paper,
    ),
    scaffoldBackgroundColor: paper,
  );
}
