import 'package:flutter/material.dart';

import '../format.dart';
import '../widgets.dart';

const categories = {
  'academic': 'Teaching or homework',
  'transport': 'School bus',
  'fees': 'Fees',
  'facilities': 'Classrooms, toilets, water',
  'safety': 'Safety',
  'bullying': 'Bullying',
  'staff': 'Staff conduct',
  'other': 'Something else',
};

(String, Color?) statusLabel(String s) => switch (s) {
  'open' => ('Open', amber),
  'in_progress' => ('In progress', brandBlue),
  'resolved' => ('Resolved: please confirm', green),
  _ => ('Closed', null),
};

/// Complaints are tickets with an owner at school. Only the parent who
/// raised one can close it, so "resolved" means the parent agrees.
class ComplaintsScreen extends StatefulWidget {
  const ComplaintsScreen({super.key});
  @override
  State<ComplaintsScreen> createState() => _ComplaintsScreenState();
}

class _ComplaintsScreenState extends State<ComplaintsScreen> {
  int _v = 0;

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    return Scaffold(
      appBar: AppBar(title: Text(app.t('Complaints'))),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: Text(app.t('Raise a complaint')),
        onPressed: () async {
          await Navigator.of(
            context,
          ).push(MaterialPageRoute(builder: (_) => const NewComplaintScreen()));
          setState(() => _v++);
        },
      ),
      body: Loader<List<Map<String, dynamic>>>(
        key: ValueKey(_v),
        load: () async => asList(await app.api.call('my_complaints')),
        builder: (context, list, reload) => ListView(
          padding: const EdgeInsets.only(bottom: 96),
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Each complaint stays open until you confirm it is sorted. If you are not satisfied, reopen it.',
              ),
            ),
            Section(
              children: [
                if (list.isEmpty) const Empty('No complaints raised.'),
                for (final c in list)
                  ListTile(
                    title: Text(
                      '${c['subject']}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      '${categories[c['category']] ?? c['category']} · ${c['student'] ?? ''} · ${day(c['created_at'])}'
                      '${c['first_reply_at'] == null ? ' · awaiting reply' : ''}',
                    ),
                    trailing: Pill(
                      statusLabel('${c['status']}').$1,
                      color: statusLabel('${c['status']}').$2,
                    ),
                    onTap: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => ComplaintScreen(id: '${c['id']}'),
                        ),
                      );
                      reload();
                    },
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class NewComplaintScreen extends StatefulWidget {
  const NewComplaintScreen({super.key});
  @override
  State<NewComplaintScreen> createState() => _NewComplaintScreenState();
}

class _NewComplaintScreenState extends State<NewComplaintScreen> {
  String _category = 'academic';
  String? _student;
  final _subject = TextEditingController();
  final _body = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    _student ??= '${app.child!['id']}';
    return Scaffold(
      appBar: AppBar(title: Text(app.t('Raise a complaint'))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Goes straight to the school office. Only you and school staff can read it.',
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _student,
            decoration: const InputDecoration(
              labelText: 'About',
              border: OutlineInputBorder(),
            ),
            items: [
              for (final c in app.children)
                DropdownMenuItem(
                  value: '${c['id']}',
                  child: Text('${c['name']} (${c['class']})'),
                ),
            ],
            onChanged: (v) => setState(() => _student = v),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _category,
            decoration: const InputDecoration(
              labelText: 'Category',
              border: OutlineInputBorder(),
            ),
            items: [
              for (final e in categories.entries)
                DropdownMenuItem(value: e.key, child: Text(e.value)),
            ],
            onChanged: (v) => setState(() => _category = v!),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _subject,
            maxLength: 120,
            decoration: const InputDecoration(
              labelText: 'Subject',
              border: OutlineInputBorder(),
            ),
          ),
          TextField(
            controller: _body,
            maxLines: 6,
            maxLength: 4000,
            decoration: const InputDecoration(
              labelText:
                  'What happened, and what would you like the school to do?',
              border: OutlineInputBorder(),
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () async {
              if (_subject.text.trim().isEmpty || _body.text.trim().isEmpty) {
                context.toast(
                  'Please fill in the subject and details.',
                  error: true,
                );
                return;
              }
              final ok = await context.act(
                () => app.api.call('raise_complaint', {
                  'p_student': _student,
                  'p_category': _category,
                  'p_subject': _subject.text.trim(),
                  'p_body': _body.text.trim(),
                }),
                'Complaint registered. The school has been told.',
              );
              if (ok && context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Send to school'),
          ),
        ],
      ),
    );
  }
}

class ComplaintScreen extends StatefulWidget {
  const ComplaintScreen({super.key, required this.id});
  final String id;
  @override
  State<ComplaintScreen> createState() => _ComplaintScreenState();
}

class _ComplaintScreenState extends State<ComplaintScreen> {
  final _reply = TextEditingController();
  int _v = 0;

  Future<void> _status(String s, String ok) async {
    if (await context.act(
      () => context.api.call('set_complaint_status', {
        'p_id': widget.id,
        'p_status': s,
      }),
      ok,
    )) {
      setState(() => _v++);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    return Scaffold(
      appBar: AppBar(title: Text(app.t('Complaints'))),
      body: Loader<Map<String, dynamic>>(
        key: ValueKey(_v),
        load: () async =>
            (await app.api.call('complaint', {'p_id': widget.id}))
                as Map<String, dynamic>,
        builder: (context, c, reload) {
          final (label, color) = statusLabel('${c['status']}');
          final live = c['status'] != 'closed';
          Widget bubble(
            String who,
            String when,
            String body,
            bool school,
          ) => Align(
            alignment: school ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              padding: const EdgeInsets.all(12),
              constraints: const BoxConstraints(maxWidth: 520),
              decoration: BoxDecoration(
                color: school
                    ? brandBlue.withValues(alpha: 0.08)
                    : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E7EF)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$who · $when',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 4),
                  Text(body),
                ],
              ),
            ),
          );
          return ListView(
            padding: const EdgeInsets.only(bottom: 32),
            children: [
              Heading(
                '${c['subject']}',
                sub:
                    '${categories[c['category']] ?? c['category']} · ${c['student'] ?? 'General'}',
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Pill(label, color: color),
                ),
              ),
              bubble(
                '${c['created_by']}',
                dayTime(c['created_at']),
                '${c['body']}',
                false,
              ),
              for (final m in asList(c['messages']))
                bubble(
                  m['from_school'] == true
                      ? 'School · ${m['author']}'
                      : '${m['author']}',
                  dayTime(m['created_at']),
                  '${m['body']}',
                  m['from_school'] == true,
                ),
              if (c['mine'] == true && c['status'] == 'resolved')
                Section(
                  title: 'The school says this is resolved. Is it?',
                  accent: amber,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                      child: Row(
                        children: [
                          FilledButton(
                            onPressed: () =>
                                _status('closed', 'Closed. Thank you.'),
                            child: const Text('Yes, close it'),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton(
                            onPressed: () => _status('open', 'Reopened'),
                            child: const Text('No, reopen'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              if (live)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _reply,
                          minLines: 1,
                          maxLines: 5,
                          decoration: const InputDecoration(
                            hintText: 'Reply',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        icon: const Icon(Icons.send),
                        onPressed: () async {
                          if (_reply.text.trim().isEmpty) return;
                          if (await context.act(
                            () => app.api.call('reply_complaint', {
                              'p_id': widget.id,
                              'p_body': _reply.text.trim(),
                            }),
                            'Reply sent',
                          )) {
                            _reply.clear();
                            setState(() => _v++);
                          }
                        },
                      ),
                    ],
                  ),
                ),
              if (c['mine'] == true && !live)
                Center(
                  child: TextButton(
                    onPressed: () => _status('open', 'Reopened'),
                    child: const Text('Reopen'),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
