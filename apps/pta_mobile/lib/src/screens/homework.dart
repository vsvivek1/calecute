import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../format.dart';
import '../widgets.dart';

class HomeworkScreen extends StatefulWidget {
  const HomeworkScreen({super.key});
  @override
  State<HomeworkScreen> createState() => _HomeworkScreenState();
}

class _HomeworkScreenState extends State<HomeworkScreen> {
  bool _seenSent = false;

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final child = app.child!;
    return Loader<List<Map<String, dynamic>>>(
      load: () async {
        // Opening the list tells the teacher this family has seen it.
        if (!_seenSent) {
          _seenSent = true;
          app.api.call('mark_homework_seen', {
            'p_student': child['id'],
          }).ignore();
        }
        return asList(
          await app.api.call('child_homework', {'p_student': child['id']}),
        );
      },
      builder: (context, list, reload) {
        final today = todayIso();
        final due = list
            .where((h) => (h['due_date'] as String).compareTo(today) >= 0)
            .toList()
            .reversed
            .toList();
        final past = list
            .where((h) => (h['due_date'] as String).compareTo(today) < 0)
            .toList();

        Widget tile(Map<String, dynamic> h) {
          final done = h['done'] == true;
          return ListTile(
            isThreeLine: h['details'] != null,
            leading: Pill('${h['subject']}', color: brandBlue),
            title: Text(
              '${h['title']}',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                decoration: done ? TextDecoration.lineThrough : null,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (h['details'] != null) Text('${h['details']}'),
                Text(
                  'Due ${day(h['due_date'])} (${relative(h['due_date'])})',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
                if (h['link'] != null)
                  InkWell(
                    onTap: () => launchUrl(
                      Uri.parse(h['link']),
                      mode: LaunchMode.externalApplication,
                    ),
                    child: const Text(
                      'Open attachment',
                      style: TextStyle(color: brandBlue),
                    ),
                  ),
              ],
            ),
            trailing: IconButton(
              tooltip: done ? 'Mark not done' : app.t('Mark done'),
              icon: Icon(
                done ? Icons.check_circle : Icons.radio_button_unchecked,
                color: done ? green : null,
              ),
              onPressed: () async {
                if (await context.act(
                  () => app.api.call('set_homework_done', {
                    'p_homework': h['id'],
                    'p_student': child['id'],
                    'p_done': !done,
                  }),
                  done ? 'Marked not done' : 'Marked done',
                )) {
                  reload();
                }
              },
            ),
          );
        }

        return ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            Heading(
              app.t('Homework'),
              sub: '${child['name']} · ${child['class']}',
            ),
            Section(
              title: 'Due',
              children: [
                if (due.isEmpty) const Empty('Nothing due.'),
                ...due.map(tile),
              ],
            ),
            if (past.isNotEmpty)
              Section(title: 'Last 30 days', children: past.map(tile).toList()),
          ],
        );
      },
    );
  }
}
