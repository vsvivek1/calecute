import 'package:flutter/material.dart';

import '../widgets.dart';
import 'fees.dart';
import 'grades.dart';
import 'homework.dart';
import 'more.dart';
import 'teach.dart';
import 'today.dart';

/// The tab bar. Parents get the four things they check daily plus More;
/// teachers get the register and homework.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final teacher = app.teacherMode;
    final child = app.child;

    final tabs = teacher
        ? <(IconData, String, Widget)>[
            (
              Icons.fact_check_outlined,
              app.t('Register'),
              const RegisterScreen(),
            ),
            (Icons.edit_note, app.t('Homework'), const TeachHomeworkScreen()),
            (Icons.menu, app.t('More'), const MoreScreen()),
          ]
        : <(IconData, String, Widget)>[
            (
              Icons.wb_sunny_outlined,
              app.t('Today'),
              TodayScreen(
                key: ValueKey('today${child?['id']}'),
                onOpenTab: (i) => setState(() => _tab = i),
              ),
            ),
            (
              Icons.edit_note,
              app.t('Homework'),
              HomeworkScreen(key: ValueKey('hw${child?['id']}')),
            ),
            (
              Icons.currency_rupee,
              app.t('Fees'),
              FeesScreen(key: ValueKey('fees${child?['id']}')),
            ),
            (
              Icons.grid_view,
              app.t('Grades'),
              GradesScreen(key: ValueKey('gr${child?['id']}')),
            ),
            (Icons.menu, app.t('More'), const MoreScreen()),
          ];
    if (_tab >= tabs.length) _tab = 0;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        titleSpacing: 16,
        title: Text(
          teacher
              ? '${app.classes.first['name']}'
              : '${child?['school'] ?? 'Calecutech PTA'}',
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
        ),
        actions: [
          TextButton(
            onPressed: app.toggleLanguage,
            child: Text(app.malayalam ? 'English' : 'മലയാളം'),
          ),
        ],
        bottom: !teacher && app.children.length > 1
            ? PreferredSize(
                preferredSize: const Size.fromHeight(48),
                child: SizedBox(
                  height: 48,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    children: [
                      for (final c in app.children)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(
                              '${(c['name'] as String).split(' ').first} · ${c['class']}',
                            ),
                            selected: c['id'] == child?['id'],
                            onSelected: (_) =>
                                app.chooseChild(c['id'] as String),
                          ),
                        ),
                    ],
                  ),
                ),
              )
            : null,
      ),
      body: tabs[_tab].$3,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          for (final t in tabs)
            NavigationDestination(icon: Icon(t.$1), label: t.$2),
        ],
      ),
    );
  }
}
