import 'package:flutter/material.dart';

/// Energy Manager look: deep teal with amber accents (own look, not USS).
ThemeData energyTheme(Brightness b) {
  final scheme = ColorScheme.fromSeed(
    seedColor: const Color(0xFF0F6B5C),
    brightness: b,
    secondary: b == Brightness.light ? const Color(0xFF2E7D32) : const Color(0xFF81C784),
    tertiary: b == Brightness.light ? const Color(0xFFB26A00) : const Color(0xFFFFB74D),
  );
  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    scaffoldBackgroundColor: scheme.surface,
    appBarTheme: AppBarTheme(backgroundColor: scheme.surface, scrolledUnderElevation: 0),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
    ),
  );
}
