import 'package:flutter/material.dart';

import '../format.dart';
import '../widgets.dart';

class FeesScreen extends StatelessWidget {
  const FeesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final child = app.child!;
    return Loader<List<Map<String, dynamic>>>(
      load: () async =>
          asList(await app.api.call('child_fees', {'p_student': child['id']})),
      builder: (context, items, reload) {
        final due = items.fold<num>(
          0,
          (s, f) => s + (asNum(f['due_paise']) > 0 ? asNum(f['due_paise']) : 0),
        );
        final overdue = items
            .where((f) => f['overdue'] == true)
            .fold<num>(0, (s, f) => s + asNum(f['due_paise']));
        final payments =
            [
              for (final f in items)
                for (final p in asList(f['payments']))
                  {...p, 'fee': f['title']},
            ]..sort(
              (a, b) =>
                  (b['paid_at'] as String).compareTo(a['paid_at'] as String),
            );

        return ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            Heading(app.t('Fees'), sub: '${child['name']}'),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Row(
                children: [
                  Expanded(child: _Big(app.t('Due'), rupees(due), null)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _Big(
                      app.t('Overdue'),
                      rupees(overdue),
                      overdue > 0 ? red : null,
                    ),
                  ),
                ],
              ),
            ),
            Section(
              children: [
                if (items.isEmpty) const Empty('No fees billed.'),
                for (final f in items)
                  ListTile(
                    title: Text(
                      '${f['title']}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      '${rupees(f['amount_paise'])} · due ${day(f['due_date'])}'
                      '${asNum(f['late_fee_paise']) > 0 ? ' · late fee ${rupees(f['late_fee_paise'])}' : ''}',
                    ),
                    trailing: asNum(f['due_paise']) <= 0
                        ? Pill(app.t('Paid'), color: green)
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                rupees(f['due_paise']),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              Pill(
                                f['overdue'] == true
                                    ? app.t('Overdue')
                                    : 'due ${relative(f['due_date'])}',
                                color: f['overdue'] == true ? red : amber,
                              ),
                            ],
                          ),
                  ),
              ],
            ),
            const Section(
              title: 'How to pay',
              children: [
                Padding(
                  padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Text(
                    'Pay at the school office by cash, UPI or card. Every payment gets a numbered receipt that appears below straight away.',
                  ),
                ),
              ],
            ),
            Section(
              title: 'Receipts',
              children: [
                if (payments.isEmpty) const Empty('No payments yet.'),
                for (final p in payments)
                  ListTile(
                    title: Text('${p['fee']}'),
                    subtitle: Text(
                      '${dayYear(p['paid_at'])} · ${'${p['method']}'.toUpperCase()} · ${p['receipt_no']}',
                    ),
                    trailing: Text(
                      rupees(p['amount_paise']),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    onTap: () => _receipt(context, '${p['id']}'),
                  ),
              ],
            ),
          ],
        );
      },
    );
  }

  Future<void> _receipt(BuildContext context, String id) async {
    final r = (await context.api.call('receipt', {
      'p_payment': id,
    })) as Map<String, dynamic>;
    if (!context.mounted) return;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${r['school']}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const Pill('PAID', color: green),
              ],
            ),
            const Divider(height: 24),
            for (final (k, v) in [
              ('Receipt no.', '${r['receipt_no']}'),
              (
                'Student',
                '${r['student']}${r['class'] != null ? ', ${r['class']}' : ''}',
              ),
              ('For', '${r['fee']}'),
              ('Amount', rupees(r['amount_paise'])),
              (
                'Paid by',
                '${'${r['method']}'.toUpperCase()}${r['reference'] != null ? ' · ${r['reference']}' : ''}',
              ),
              ('Date', dayTime(r['paid_at'])),
            ])
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    SizedBox(
                      width: 110,
                      child: Text(
                        k,
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        v,
                        style: const TextStyle(fontWeight: FontWeight.w600),
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

class _Big extends StatelessWidget {
  const _Big(this.label, this.value, this.color);
  final String label;
  final String value;
  final Color? color;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFFE2E7EF)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade700,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        FittedBox(
          child: Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ),
      ],
    ),
  );
}
