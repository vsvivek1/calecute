import 'package:flutter/material.dart';

import '../format.dart';
import '../widgets.dart';
import 'activities.dart';
import 'complaints.dart';
import 'notices.dart';
import 'quizzes.dart';
import 'attendance.dart';

/// The daily digest: what needs the parent first, then today's facts.
class TodayScreen extends StatelessWidget {
  const TodayScreen({super.key, required this.onOpenTab});
  final void Function(int tab) onOpenTab;

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final child = app.child!;
    return Loader<Map<String, dynamic>>(
      load: () async =>
          (await app.api.call('child_today', {'p_student': child['id']}))
              as Map<String, dynamic>,
      builder: (context, d, reload) {
        final first = (child['name'] as String).split(' ').first;
        final fees = d['fees'] as Map<String, dynamic>;
        final month = d['attendance_month'] as Map<String, dynamic>;
        final events = asList(d['events']);
        final notices = asList(d['notices_unread']);
        final homework = asList(d['homework_due']);
        final exam = d['latest_exam'] as Map<String, dynamic>?;
        final today = d['attendance_today'] as String?;
        final marked = asInt(month['marked']) - asInt(month['leave']);
        final pct = marked > 0
            ? (100 * asInt(month['present']) / marked).round()
            : null;

        void push(Widget w) =>
            Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => w))
                .then((_) => reload());

        final needs = <(String, Color, VoidCallback)>[
          for (final n in notices.where((n) => n['priority'] == 'urgent'))
            ('Urgent: ${n['title']}', red, () => push(const NoticesScreen())),
          if (asInt(fees['overdue_paise']) > 0)
            (
              '${rupees(fees['overdue_paise'])} in fees is overdue',
              red,
              () => onOpenTab(2),
            ),
          for (final e in events.where(
            (e) => e['needs_consent'] == true && e['response'] == null,
          ))
            (
              'Permission needed: ${e['title']}',
              amber,
              () => push(const ActivitiesScreen()),
            ),
          if (asInt(d['quizzes_open']) > 0)
            (
              '${d['quizzes_open']} quiz to take',
              amber,
              () => push(const QuizzesScreen()),
            ),
        ];

        return ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            Heading('$first’s day', sub: '${d['student']['class']}'),
            Section(
              title: app.t('Needs your reply'),
              children: [
                if (needs.isEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                    child: Text(
                      '✓ ${app.t('Nothing needs you today')}',
                      style: TextStyle(color: Colors.grey.shade700),
                    ),
                  ),
                for (final (text, color, go) in needs)
                  ListTile(
                    leading: Container(width: 4, height: 32, color: color),
                    title: Text(
                      text,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: go,
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Row(
                children: [
                  Expanded(
                    child: _Stat(
                      label: '${app.t('Attendance')} today',
                      value: Pill(
                        app.t(today ?? 'Not marked yet'),
                        color: statusColor(today),
                      ),
                      hint: 'Month: ${pct == null ? '—' : '$pct%'}',
                      onTap: () => push(const AttendanceScreen()),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _Stat(
                      label: app.t('Fees'),
                      value: Text(
                        rupees(fees['due_paise']),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      hint: fees['next_due_date'] == null
                          ? 'All paid'
                          : asInt(fees['overdue_paise']) > 0
                          ? '${rupees(fees['overdue_paise'])} overdue'
                          : 'due ${relative(fees['next_due_date'])}',
                      onTap: () => onOpenTab(2),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _Stat(
                      label: 'Last exam',
                      value: exam == null
                          ? const Text('—')
                          : Pill(
                              '${exam['percent']}%',
                              color: percentColor(asNum(exam['percent'])),
                            ),
                      hint: exam?['name'] as String? ?? 'None yet',
                      onTap: () => onOpenTab(3),
                    ),
                  ),
                ],
              ),
            ),
            Section(
              title: '${app.t('Homework')} this week',
              children: [
                if (homework.isEmpty) const Empty('No homework pending.'),
                for (final h in homework)
                  ListTile(
                    dense: true,
                    leading: Pill('${h['subject']}', color: brandBlue),
                    title: Text('${h['title']}'),
                    trailing: Text(
                      relative(h['due_date']),
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                    onTap: () => onOpenTab(1),
                  ),
              ],
            ),
            Section(
              title: app.t('Upcoming'),
              children: [
                if (events.isEmpty)
                  const Empty('Nothing in the next two weeks.'),
                for (final e in events)
                  ListTile(
                    title: Text(
                      '${e['title']}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(dayTime(e['starts_at'])),
                    trailing: e['needs_consent'] == true
                        ? (e['response'] == null
                              ? const Pill('Reply needed', color: amber)
                              : Pill(
                                  e['response'] == 'yes'
                                      ? 'Attending'
                                      : 'Not attending',
                                  color: e['response'] == 'yes' ? green : null,
                                ))
                        : null,
                    onTap: () => push(const ActivitiesScreen()),
                  ),
              ],
            ),
            if (asInt(d['complaints_open']) > 0)
              Center(
                child: TextButton(
                  onPressed: () => push(const ComplaintsScreen()),
                  child: Text(
                    '${d['complaints_open']} complaint open · follow up',
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({
    required this.label,
    required this.value,
    required this.hint,
    required this.onTap,
  });
  final String label;
  final Widget value;
  final String hint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFE2E7EF)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: value,
              ),
              const SizedBox(height: 4),
              Text(
                hint,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
