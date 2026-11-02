import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../format.dart';
import '../widgets.dart';

const _kind = {
  'sample_test': 'Sample test',
  'model_paper': 'Model paper',
  'notes': 'Notes',
};

class SampleTestsScreen extends StatelessWidget {
  const SampleTestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final child = app.child!;
    return Scaffold(
      appBar: AppBar(title: Text(app.t('Sample tests'))),
      body: Loader<List<Map<String, dynamic>>>(
        load: () async => asList(
          await app.api.call('child_resources', {'p_student': child['id']}),
        ),
        builder: (context, list, reload) {
          final subjects = <String, List<Map<String, dynamic>>>{};
          for (final r in list) {
            subjects.putIfAbsent('${r['subject']}', () => []).add(r);
          }
          return ListView(
            padding: const EdgeInsets.only(top: 12, bottom: 24),
            children: [
              if (list.isEmpty)
                const Section(children: [Empty('Nothing shared yet.')]),
              for (final MapEntry(key: subject, value: items)
                  in subjects.entries)
                Section(
                  title: subject,
                  children: [
                    for (final r in items)
                      ListTile(
                        leading: Pill(
                          _kind[r['kind']] ?? '${r['kind']}',
                          color: r['kind'] == 'notes' ? null : brandBlue,
                        ),
                        title: Text('${r['title']}'),
                        trailing: const Icon(Icons.open_in_new, size: 18),
                        onTap: () => launchUrl(
                          Uri.parse('${r['url']}'),
                          mode: LaunchMode.externalApplication,
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
