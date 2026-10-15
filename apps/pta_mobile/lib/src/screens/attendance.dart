import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../format.dart';
import '../widgets.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});
  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  late DateTime _month = DateTime(istNow().year, istNow().month);

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final child = app.child!;
    return Scaffold(
      appBar: AppBar(title: Text(app.t('Attendance'))),
      body: Loader<Map<String, dynamic>>(
        key: ValueKey(_month),
        load: () async => (await app.api.call('child_attendance', {
          'p_student': child['id'],
          'p_month': isoDay(_month),
        })) as Map<String, dynamic>,
        builder: (context, a, reload) {
          final byDay = {
            for (final d in asList(a['days']))
              d['day'] as String: d['status'] as String,
          };
          final days = DateTime(_month.year, _month.month + 1, 0).day;
          final lead = _month.weekday - 1;
          final year = a['year'] as Map<String, dynamic>;
          final yp = asInt(year['marked']) > 0
              ? (100 * asInt(year['present']) / asInt(year['marked'])).round()
              : null;
          final today = todayIso();
          int count(String s) => byDay.values.where((v) => v == s).length;

          return ListView(
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              Heading(
                '${child['name']}',
                sub: 'Last 12 months: ${yp == null ? '—' : '$yp%'}',
              ),
              Section(
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.chevron_left),
                        onPressed: () => setState(
                          () =>
                              _month = DateTime(_month.year, _month.month - 1),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          DateFormat('MMMM y').format(_month),
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.chevron_right),
                        onPressed: () => setState(
                          () =>
                              _month = DateTime(_month.year, _month.month + 1),
                        ),
                      ),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                    child: GridView.count(
                      crossAxisCount: 7,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 4,
                      crossAxisSpacing: 4,
                      children: [
                        for (final h in ['M', 'T', 'W', 'T', 'F', 'S', 'S'])
                          Center(
                            child: Text(
                              h,
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey.shade600,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        for (var i = 0; i < lead; i++) const SizedBox(),
                        for (var d = 1; d <= days; d++)
                          Builder(
                            builder: (_) {
                              final iso = isoDay(
                                DateTime(_month.year, _month.month, d),
                              );
                              final s = byDay[iso];
                              final c = s == null
                                  ? Colors.grey.shade500
                                  : statusColor(s);
                              return Container(
                                decoration: BoxDecoration(
                                  color: s == null
                                      ? const Color(0xFFF1F3F7)
                                      : c.withValues(alpha: 0.13),
                                  borderRadius: BorderRadius.circular(8),
                                  border: iso == today
                                      ? Border.all(color: brandBlue, width: 2)
                                      : null,
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  '$d',
                                  style: TextStyle(
                                    color: c,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        for (final s in ['present', 'absent', 'late', 'leave'])
                          Pill(
                            '${app.t(s)} ${count(s)}',
                            color: statusColor(s),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              Section(
                title: app.t('Request leave'),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: _LeaveForm(
                      studentId: '${child['id']}',
                      onSent: reload,
                    ),
                  ),
                  for (final l in asList(a['leave_requests']))
                    ListTile(
                      dense: true,
                      title: Text(
                        '${day(l['from_day'])}${l['to_day'] != l['from_day'] ? ' – ${day(l['to_day'])}' : ''} · ${l['reason']}',
                      ),
                      trailing: Pill(
                        '${l['status']}',
                        color: l['status'] == 'approved'
                            ? green
                            : l['status'] == 'declined'
                            ? red
                            : amber,
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

class _LeaveForm extends StatefulWidget {
  const _LeaveForm({required this.studentId, required this.onSent});
  final String studentId;
  final Future<void> Function() onSent;
  @override
  State<_LeaveForm> createState() => _LeaveFormState();
}

class _LeaveFormState extends State<_LeaveForm> {
  DateTimeRange? _range;
  final _reason = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Tell the class teacher before the day. Approved days show as leave, not absent.',
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          icon: const Icon(Icons.date_range),
          label: Text(
            _range == null
                ? 'Choose days'
                : '${day(isoDay(_range!.start))} – ${day(isoDay(_range!.end))}',
          ),
          onPressed: () async {
            final now = istNow();
            final r = await showDateRangePicker(
              context: context,
              firstDate: DateTime(now.year, now.month, now.day),
              lastDate: now.add(const Duration(days: 120)),
            );
            if (r != null) setState(() => _range = r);
          },
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _reason,
          decoration: const InputDecoration(
            labelText: 'Reason',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: () async {
            if (_range == null || _reason.text.trim().isEmpty) {
              context.toast('Choose the days and give a reason.', error: true);
              return;
            }
            final ok = await context.act(
              () => context.api.call('request_leave', {
                'p_student': widget.studentId,
                'p_from': isoDay(_range!.start),
                'p_to': isoDay(_range!.end),
                'p_reason': _reason.text.trim(),
              }),
              'Sent to the class teacher',
            );
            if (ok) {
              setState(() {
                _range = null;
                _reason.clear();
              });
              widget.onSent();
            }
          },
          child: const Text('Send to teacher'),
        ),
      ],
    );
  }
}
