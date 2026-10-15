import 'package:flutter/material.dart';

import '../format.dart';
import '../widgets.dart';

/// Taking the roll on a phone. Everyone starts present, so a normal day is
/// one tap on Save; approved leave starts as leave.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final Map<String, String> _status = {};
  int _v = 0;

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final k = app.classes.first;
    return Loader<Map<String, dynamic>>(
      key: ValueKey(_v),
      load: () async {
        final r = (await app.api.call('class_register', {
          'p_class': k['id'],
          'p_day': todayIso(),
        })) as Map<String, dynamic>;
        _status
          ..clear()
          ..addAll({
            for (final s in asList(r['students']))
              '${s['id']}':
                  '${s['status'] ?? (s['on_leave'] == true ? 'leave' : 'present')}',
          });
        return r;
      },
      builder: (context, r, reload) {
        final students = asList(r['students']);
        final marked = students.any((s) => s['status'] != null);
        return ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            Heading(
              '${r['class']} register',
              sub:
                  '${dayYear(todayIso())} · ${marked ? 'Already marked; saving overwrites it.' : 'Everyone starts as present.'}',
            ),
            for (final l in asList(r['leave_pending']))
              Section(
                title: 'Leave: ${l['student']}',
                accent: amber,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${day(l['from_day'])}${l['to_day'] != l['from_day'] ? ' – ${day(l['to_day'])}' : ''} · ${l['reason']}',
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            for (final (yes, label) in [
                              (true, 'Approve'),
                              (false, 'Decline'),
                            ])
                              Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: OutlinedButton(
                                  onPressed: () async {
                                    if (await context.act(
                                      () => app.api.call('decide_leave', {
                                        'p_id': l['id'],
                                        'p_approve': yes,
                                      }),
                                      yes ? 'Leave approved' : 'Leave declined',
                                    )) {
                                      setState(() => _v++);
                                    }
                                  },
                                  child: Text(label),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            Section(
              children: [
                if (students.isEmpty)
                  const Empty('No students in this class yet.'),
                for (final s in students)
                  ListTile(
                    leading: Text(
                      '${s['roll_no'] ?? ''}',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                    title: Text('${s['name']}'),
                    trailing: SegmentedButton<String>(
                      showSelectedIcon: false,
                      style: const ButtonStyle(
                        visualDensity: VisualDensity.compact,
                      ),
                      segments: const [
                        ButtonSegment(value: 'present', label: Text('P')),
                        ButtonSegment(value: 'absent', label: Text('A')),
                        ButtonSegment(value: 'late', label: Text('L')),
                        ButtonSegment(value: 'leave', label: Text('Lv')),
                      ],
                      selected: {_status['${s['id']}'] ?? 'present'},
                      onSelectionChanged: (v) =>
                          setState(() => _status['${s['id']}'] = v.first),
                    ),
                  ),
              ],
            ),
            if (students.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: FilledButton(
                  onPressed: () async {
                    final entries = [
                      for (final e in _status.entries)
                        {'student_id': e.key, 'status': e.value},
                    ];
                    final absent = entries
                        .where((e) => e['status'] == 'absent')
                        .length;
                    if (await context.act(
                      () => app.api.call('save_register', {
                        'p_class': k['id'],
                        'p_day': todayIso(),
                        'p_entries': entries,
                      }),
                      'Saved: ${entries.length - absent} present, $absent absent',
                    )) {
                      setState(() => _v++);
                    }
                  },
                  child: const Text('Save register'),
                ),
              ),
          ],
        );
      },
    );
  }
}

/// Post homework and see who has opened it and who has finished.
class TeachHomeworkScreen extends StatefulWidget {
  const TeachHomeworkScreen({super.key});
  @override
  State<TeachHomeworkScreen> createState() => _TeachHomeworkScreenState();
}

class _TeachHomeworkScreenState extends State<TeachHomeworkScreen> {
  int _v = 0;

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final k = app.classes.first;
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('Post homework'),
        onPressed: () async {
          final posted = await showModalBottomSheet<bool>(
            context: context,
            isScrollControlled: true,
            showDragHandle: true,
            builder: (_) => _PostHomework(classId: '${k['id']}'),
          );
          if (posted == true) setState(() => _v++);
        },
      ),
      body: Loader<List<Map<String, dynamic>>>(
        key: ValueKey(_v),
        load: () async =>
            asList(await app.api.call('class_homework', {'p_class': k['id']})),
        builder: (context, list, reload) => ListView(
          padding: const EdgeInsets.only(bottom: 96),
          children: [
            Heading(
              '${k['name']} homework',
              sub: 'Seen = the family opened it. Done = marked finished.',
            ),
            Section(
              children: [
                if (list.isEmpty)
                  const Empty('Nothing posted in the last 30 days.'),
                for (final h in list)
                  ListTile(
                    leading: Pill('${h['subject']}', color: brandBlue),
                    title: Text('${h['title']}'),
                    subtitle: Text(
                      'Due ${day(h['due_date'])} · seen ${h['seen']}/${h['students']}',
                    ),
                    trailing: Text(
                      '${h['done']}/${h['students']} done',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PostHomework extends StatefulWidget {
  const _PostHomework({required this.classId});
  final String classId;
  @override
  State<_PostHomework> createState() => _PostHomeworkState();
}

class _PostHomeworkState extends State<_PostHomework> {
  final _subject = TextEditingController();
  final _title = TextEditingController();
  final _details = TextEditingController();
  DateTime _due = istNow().add(const Duration(days: 1));

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        0,
        16,
        16 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _subject,
            decoration: const InputDecoration(labelText: 'Subject'),
          ),
          TextField(
            controller: _title,
            decoration: const InputDecoration(labelText: 'Title'),
          ),
          TextField(
            controller: _details,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Details (optional)'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            icon: const Icon(Icons.event),
            label: Text('Due ${day(isoDay(_due))}'),
            onPressed: () async {
              final d = await showDatePicker(
                context: context,
                initialDate: _due,
                firstDate: istNow(),
                lastDate: istNow().add(const Duration(days: 90)),
              );
              if (d != null) setState(() => _due = d);
            },
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: () async {
              if (_subject.text.trim().isEmpty || _title.text.trim().isEmpty) {
                context.toast('Subject and title are needed.', error: true);
                return;
              }
              final ok = await context.act(
                () => context.api.call('post_homework', {
                  'p_class': widget.classId,
                  'p_subject': _subject.text.trim(),
                  'p_title': _title.text.trim(),
                  'p_details': _details.text.trim(),
                  'p_due': isoDay(_due),
                }),
                'Homework posted',
              );
              if (ok && context.mounted) Navigator.of(context).pop(true);
            },
            child: const Text('Post'),
          ),
        ],
      ),
    );
  }
}
