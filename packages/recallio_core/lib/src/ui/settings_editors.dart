import 'package:flutter/material.dart';

import '../model/learner.dart';
import '../study/course_config.dart';
import 'strings.dart';

String formatDay(DateTime d) {
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${d.day} ${m[d.month - 1]} ${d.year}';
}

class LanguagePicker extends StatelessWidget {
  const LanguagePicker({super.key, required this.value, required this.onChanged});
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) => SegmentedButton<String>(
        segments: const [
          ButtonSegment(value: 'en', label: Text('English')),
          ButtonSegment(value: 'ml', label: Text('മലയാളം')),
        ],
        selected: {value},
        onSelectionChanged: (s) => onChanged(s.first),
      );
}

class ExamDateField extends StatelessWidget {
  const ExamDateField({super.key, required this.config, required this.value, required this.onChanged});
  final CourseConfig config;

  /// The learner's own date; null = the course's date.
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final date = value ?? config.exam.date;
    final own = value != null;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(
          child: Text(formatDay(date), style: Theme.of(context).textTheme.titleLarge!.copyWith(fontWeight: FontWeight.w700)),
        ),
        TextButton(
          onPressed: () async {
            final now = DateTime.now();
            final picked = await showDatePicker(
              context: context,
              initialDate: date.isBefore(now) ? now : date,
              firstDate: now,
              lastDate: DateTime(now.year + 3),
            );
            if (picked != null) onChanged(picked);
          },
          child: Text(t.change),
        ),
      ]),
      if (!own) ...[
        Text('${config.exam.name} · ${config.exam.official ? t.official : t.estimated}',
            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
        Text(t.examSource(config.exam.source),
            style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
      ] else
        TextButton(
          style: TextButton.styleFrom(padding: EdgeInsets.zero),
          onPressed: () => onChanged(null),
          child: Text('${formatDay(config.exam.date)} (${config.exam.official ? t.official : t.estimated})'),
        ),
    ]);
  }
}

class SectionPicker extends StatelessWidget {
  const SectionPicker({super.key, required this.config, required this.value, required this.onChanged});
  final CourseConfig config;
  final List<int> value;
  final ValueChanged<List<int>> onChanged;

  @override
  Widget build(BuildContext context) => Column(children: [
        for (final s in config.sections)
          CheckboxListTile(
            value: value.contains(s.id),
            contentPadding: EdgeInsets.zero,
            title: Text(s.name),
            onChanged: (on) {
              final next = [...value]..remove(s.id);
              if (on == true) next.add(s.id);
              next.sort();
              onChanged(next);
            },
          ),
      ]);
}

Future<int?> pickTime(BuildContext context, StudyTime initial) async {
  final picked = await showTimePicker(
    context: context,
    initialTime: TimeOfDay(hour: initial ~/ 60, minute: initial % 60),
  );
  return picked == null ? null : picked.hour * 60 + picked.minute;
}

class StudyTimesEditor extends StatelessWidget {
  const StudyTimesEditor({super.key, required this.value, required this.onChanged});
  final List<StudyTime> value;
  final ValueChanged<List<StudyTime>> onChanged;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final times = [...value]..sort();
    return Wrap(spacing: 8, runSpacing: 8, children: [
      for (final time in times)
        InputChip(
          label: Text(formatStudyTime(time)),
          onPressed: () async {
            final v = await pickTime(context, time);
            if (v != null) onChanged([...times]..remove(time)..add(v));
          },
          onDeleted: times.length > 1 ? () => onChanged([...times]..remove(time)) : null,
        ),
      if (times.length < 5)
        ActionChip(
          avatar: const Icon(Icons.add, size: 18),
          label: Text(t.add),
          onPressed: () async {
            final v = await pickTime(context, 18 * 60);
            if (v != null && !times.contains(v)) onChanged([...times, v]);
          },
        ),
    ]);
  }
}

class MinutesPicker extends StatelessWidget {
  const MinutesPicker({super.key, required this.value, required this.onChanged});
  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) => Wrap(spacing: 8, children: [
        for (final m in const [15, 30, 45, 60, 90])
          ChoiceChip(label: Text('$m'), selected: value == m, onSelected: (_) => onChanged(m)),
      ]);
}

class QuietHoursEditor extends StatelessWidget {
  const QuietHoursEditor({super.key, required this.start, required this.end, required this.onChanged});
  final StudyTime start;
  final StudyTime end;
  final void Function(StudyTime start, StudyTime end) onChanged;

  @override
  Widget build(BuildContext context) => Row(children: [
        OutlinedButton(
          onPressed: () async {
            final v = await pickTime(context, start);
            if (v != null) onChanged(v, end);
          },
          child: Text(formatStudyTime(start)),
        ),
        const Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text('–')),
        OutlinedButton(
          onPressed: () async {
            final v = await pickTime(context, end);
            if (v != null) onChanged(start, v);
          },
          child: Text(formatStudyTime(end)),
        ),
      ]);
}
