import 'package:flutter/material.dart';

import '../format.dart';
import '../widgets.dart';

class NoticesScreen extends StatelessWidget {
  const NoticesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    return Scaffold(
      appBar: AppBar(title: Text(app.t('Notices'))),
      body: Loader<List<Map<String, dynamic>>>(
        load: () async => asList(await app.api.call('my_notices')),
        builder: (context, list, reload) => ListView(
          padding: const EdgeInsets.only(top: 12, bottom: 24),
          children: [
            if (list.isEmpty) const Section(children: [Empty('No notices.')]),
            for (final n in list)
              Opacity(
                opacity: n['read'] == true ? 0.7 : 1,
                child: Section(
                  title: '${n['title']}',
                  accent: n['priority'] == 'urgent' && n['read'] != true
                      ? red
                      : null,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${n['class'] ?? 'Whole school'} · ${dayTime(n['created_at'])}',
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text('${n['body']}'),
                          if (n['read'] != true)
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () async {
                                  if (await context.act(
                                    () => app.api.call('read_notice', {
                                      'p_notice': n['id'],
                                    }),
                                    'Marked read',
                                  )) {
                                    reload();
                                  }
                                },
                                child: const Text('Got it'),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
