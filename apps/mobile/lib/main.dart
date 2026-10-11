import 'package:flutter/material.dart';

import 'src/home_page.dart';
import 'src/theme.dart';

void main() => runApp(const HistoryClockApp());

class HistoryClockApp extends StatelessWidget {
  const HistoryClockApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'History Clock',
      debugShowCheckedModeBanner: false,
      theme: Sketch.theme(),
      home: const HomePage(),
    );
  }
}
