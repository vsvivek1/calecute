import 'package:flutter/material.dart';

import '../format.dart';
import '../widgets.dart';

class ActivitiesScreen extends StatelessWidget {
  const ActivitiesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final child = app.child!;
    final first = (child['name'] as String).split(' ').first;
    return Scaffold(
      appBar: AppBar(title: Text(app.t('Activities'))),
      body: Loader<List<Map<String, dynamic>>>(
        load: () async => asList(
          await app.api.call('child_events', {'p_student': child['id']}),
        ),
        builder: (context, events, reload) {
          final now = DateTime.now().toUtc().toIso8601String();
          final upcoming = events
              .where((e) => (e['starts_at'] as String).compareTo(now) >= 0)
              .toList();
          return ListView(
            padding: const EdgeInsets.only(top: 12, bottom: 24),
            children: [
              if (upcoming.isEmpty)
                const Section(children: [Empty('Nothing planned yet.')]),
              for (final e in upcoming)
                Section(
                  title: '${e['title']}',
                  accent: e['needs_consent'] == true && e['response'] == null
                      ? amber
                      : null,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            [
                              dayTime(e['starts_at']),
                              if (e['location'] != null) '${e['location']}',
                              if (asNum(e['fee_paise']) > 0)
                                rupees(e['fee_paise']),
                              e['whole_school'] == true
                                  ? 'Whole school'
                                  : '${child['class']}',
                            ].join(' · '),
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 13,
                            ),
                          ),
                          if (e['details'] != null) ...[
                            const SizedBox(height: 6),
                            Text('${e['details']}'),
                          ],
                          if (e['needs_consent'] == true) ...[
                            const SizedBox(height: 10),
                            Text(
                              e['response'] == null
                                  ? 'May $first attend?'
                                  : 'You said ${e['response']}.',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                for (final (v, label, color) in [
                                  ('yes', app.t('Yes'), green),
                                  ('no', app.t('No'), red),
                                ])
                                  Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: e['response'] == v
                                        ? FilledButton(
                                            style: FilledButton.styleFrom(
                                              backgroundColor: color,
                                            ),
                                            onPressed: null,
                                            child: Text(label),
                                          )
                                        : OutlinedButton(
                                            onPressed: () async {
                                              if (await context.act(
                                                () => app.api.call(
                                                  'respond_event',
                                                  {
                                                    'p_event': e['id'],
                                                    'p_student': child['id'],
                                                    'p_response': v,
                                                  },
                                                ),
                                                'Response saved',
                                              )) {
                                                reload();
                                              }
                                            },
                                            child: Text(label),
                                          ),
                                  ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
            ],
          );
        },
      ),
    );
  }
}
