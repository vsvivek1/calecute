import 'package:flutter/material.dart';

import '../format.dart';
import '../widgets.dart';

String grade(num p) => p >= 90
    ? 'A+'
    : p >= 80
    ? 'A'
    : p >= 70
    ? 'B+'
    : p >= 60
    ? 'B'
    : p >= 50
    ? 'C+'
    : p >= 40
    ? 'C'
    : p >= 30
    ? 'D+'
    : 'D';

class GradesScreen extends StatelessWidget {
  const GradesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final child = app.child!;
    return Loader<List<Map<String, dynamic>>>(
      load: () async => asList(
        await app.api.call('child_grades', {'p_student': child['id']}),
      ),
      builder: (context, exams, reload) => ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          Heading(
            app.t('Grades'),
            sub: '${child['name']} · published results only',
          ),
          if (exams.isEmpty)
            const Section(children: [Empty('No results published yet.')]),
          for (final e in exams)
            Section(
              title: '${e['name']}',
              trailing: Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Pill(
                      '${e['percent']}%',
                      color: percentColor(asNum(e['percent'])),
                    ),
                    const SizedBox(width: 6),
                    Pill('Grade ${grade(asNum(e['percent']))}'),
                  ],
                ),
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
                  child: Text(
                    '${dayYear(e['held_on'])}${e['class_average'] != null ? ' · class average ${e['class_average']}%' : ''}',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                  ),
                ),
                for (final s in asList(e['subjects']))
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
                    child: Row(
                      children: [
                        Expanded(flex: 3, child: Text('${s['subject']}')),
                        Expanded(
                          flex: 4,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: asNum(s['score']) / asNum(s['max_score']),
                              minHeight: 8,
                              color: percentColor(
                                100 * asNum(s['score']) / asNum(s['max_score']),
                              ),
                              backgroundColor: const Color(0xFFEEF1F6),
                            ),
                          ),
                        ),
                        SizedBox(
                          width: 72,
                          child: Text(
                            '${_n(s['score'])}/${_n(s['max_score'])}',
                            textAlign: TextAlign.right,
                            style: const TextStyle(
                              fontFeatures: [FontFeature.tabularFigures()],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 10),
              ],
            ),
        ],
      ),
    );
  }

  static String _n(Object? v) {
    final n = asNum(v);
    return n == n.roundToDouble() ? '${n.round()}' : '$n';
  }
}
