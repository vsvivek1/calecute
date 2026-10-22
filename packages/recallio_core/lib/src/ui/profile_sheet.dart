import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/auth.dart';
import '../study/study_controller.dart';
import 'settings_editors.dart';
import 'strings.dart';

/// The profile sheet: exam date, papers, study times, quiet hours,
/// language, account, privacy and data deletion. Nothing here picks what to
/// study — the app decides that.
Future<void> showProfileSheet(BuildContext context, StudyController c, AuthGateway? auth) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      builder: (context, scroll) => ListenableBuilder(
        listenable: Listenable.merge([c, ?auth]),
        builder: (context, _) => _Profile(controller: c, auth: auth, scroll: scroll),
      ),
    ),
  );
}

class _Profile extends StatelessWidget {
  const _Profile({required this.controller, required this.auth, required this.scroll});
  final StudyController controller;
  final AuthGateway? auth;
  final ScrollController scroll;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final c = controller;
    final s = c.settings;
    final h = Theme.of(context).textTheme.titleMedium!.copyWith(fontWeight: FontWeight.w700);
    Widget section(String title, Widget child) => Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: h),
            const SizedBox(height: 8),
            child,
          ]),
        );

    return ListView(
      controller: scroll,
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
      children: [
        Text(t.profile, style: Theme.of(context).textTheme.headlineSmall!.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        if (auth != null)
          section(
            auth!.signedIn ? t.signedInAs : t.signIn,
            auth!.signedIn
                ? Row(children: [
                    Expanded(child: Text(auth!.email ?? '')),
                    TextButton(onPressed: auth!.signOut, child: Text(t.signOut)),
                  ])
                : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(t.notSignedIn),
                    const SizedBox(height: 8),
                    FilledButton.icon(
                      onPressed: auth!.signIn,
                      icon: const Icon(Icons.login),
                      label: Text(t.signIn),
                    ),
                  ]),
          ),
        section(
          t.examDate,
          ExamDateField(
            config: c.config,
            value: s.examDate,
            onChanged: (d) => c.updateSettings((x) => x.examDate = d),
          ),
        ),
        section(
          t.papers,
          SectionPicker(
            config: c.config,
            value: s.sections,
            onChanged: (v) => c.updateSettings((x) => x.sections = v),
          ),
        ),
        section(
          t.studyTimes,
          StudyTimesEditor(value: s.studyTimes, onChanged: (v) => c.updateSettings((x) => x.studyTimes = v)),
        ),
        section(
          t.minutesPerDay,
          MinutesPicker(value: s.minutesPerDay, onChanged: (v) => c.updateSettings((x) => x.minutesPerDay = v)),
        ),
        section(
          t.quietHours,
          QuietHoursEditor(
            start: s.quietStart,
            end: s.quietEnd,
            onChanged: (a, b) => c.updateSettings((x) {
              x.quietStart = a;
              x.quietEnd = b;
            }),
          ),
        ),
        section(
          t.language,
          LanguagePicker(value: s.language, onChanged: (v) => c.updateSettings((x) => x.language = v)),
        ),
        const Divider(),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.card_giftcard_outlined),
          title: Text(t.inviteTitle),
          onTap: () => launchUrl(Uri.parse(c.config.inviteUrl), mode: LaunchMode.externalApplication),
        ),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.privacy_tip_outlined),
          title: Text(t.privacy),
          onTap: () => launchUrl(Uri.parse(c.config.privacyUrl), mode: LaunchMode.externalApplication),
        ),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.description_outlined),
          title: Text(t.terms),
          onTap: () => launchUrl(Uri.parse(c.config.termsUrl), mode: LaunchMode.externalApplication),
        ),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Icon(Icons.delete_outline, color: Theme.of(context).colorScheme.error),
          title: Text(t.deleteData, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          onTap: () async {
            final ok = await showDialog<bool>(
              context: context,
              builder: (d) => AlertDialog(
                title: Text(t.deleteData),
                content: Text(t.deleteConfirm),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(d, false), child: Text(t.cancel)),
                  FilledButton(onPressed: () => Navigator.pop(d, true), child: Text(t.delete)),
                ],
              ),
            );
            if (ok == true) {
              await c.deleteAllData();
              if (context.mounted) Navigator.of(context).pop();
            }
          },
        ),
      ],
    );
  }
}
