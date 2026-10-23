import 'package:flutter/material.dart';

import '../data/auth.dart';
import '../model/learner.dart';
import '../study/study_controller.dart';
import 'settings_editors.dart';
import 'strings.dart';

/// First run: language, sign-in (skippable), exam date, papers, study
/// times, alerts. After this the app plans every day on its own.
class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key, required this.controller, this.auth, required this.onLanguage});

  final StudyController controller;
  final AuthGateway? auth;
  final ValueChanged<String> onLanguage;

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  late final LearnerSettings _s = LearnerSettings.fromJson(widget.controller.settings.toJson());
  int _step = 0;

  StudyController get c => widget.controller;
  bool get _alertsSupported => c.alerts?.supported ?? false;
  int get _steps => _alertsSupported ? 6 : 5;

  bool get _canNext => switch (_step) {
        4 => _s.sections.isNotEmpty,
        _ => true,
      };

  Future<void> _next() async {
    if (_step < _steps - 1) {
      setState(() => _step++);
      return;
    }
    await c.finishOnboarding(_s);
  }

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final theme = Theme.of(context);
    final title = theme.textTheme.headlineSmall!.copyWith(fontWeight: FontWeight.w700);
    final body = theme.textTheme.bodyLarge!.copyWith(height: 1.45);

    final (String heading, Widget content) = switch (_step) {
      0 => (
          c.config.appName,
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(c.config.tagline, style: body),
            const SizedBox(height: 12),
            Text(t.howItWorks, style: body),
            const SizedBox(height: 24),
            Text(t.chooseLanguage, style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            LanguagePicker(
              value: _s.language,
              onChanged: (v) {
                setState(() => _s.language = v);
                widget.onLanguage(v);
              },
            ),
          ]),
        ),
      1 => (
          t.signIn,
          widget.auth == null
              ? Text(t.notSignedIn, style: body)
              : ListenableBuilder(
                  listenable: widget.auth!,
                  builder: (context, _) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(t.signInWhy, style: body),
                    const SizedBox(height: 20),
                    if (widget.auth!.signedIn)
                      Text('${t.signedInAs} ${widget.auth!.email ?? ''}', style: body)
                    else
                      FilledButton.icon(
                        onPressed: widget.auth!.signIn,
                        icon: const Icon(Icons.login),
                        label: Text(t.signIn),
                        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                      ),
                  ]),
                ),
        ),
      2 => (
          t.whenExam,
          ExamDateField(config: c.config, value: _s.examDate, onChanged: (d) => setState(() => _s.examDate = d)),
        ),
      3 => (
          t.whenStudy,
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(t.whenStudyHint, style: body),
            const SizedBox(height: 16),
            StudyTimesEditor(value: _s.studyTimes, onChanged: (v) => setState(() => _s.studyTimes = v)),
            const SizedBox(height: 24),
            Text(t.minutesPerDay, style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            MinutesPicker(value: _s.minutesPerDay, onChanged: (v) => setState(() => _s.minutesPerDay = v)),
          ]),
        ),
      4 => (
          t.whichPapers,
          SectionPicker(config: c.config, value: _s.sections, onChanged: (v) => setState(() => _s.sections = v)),
        ),
      _ => (
          t.allowAlerts,
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(t.allowAlertsHint, style: body),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => c.requestAlertPermission(),
              icon: const Icon(Icons.notifications_active_outlined),
              label: Text(t.allowAlerts),
            ),
            const SizedBox(height: 20),
            Text(t.batteryHint, style: body.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          ]),
        ),
    };

    final last = _step == _steps - 1;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                LinearProgressIndicator(value: (_step + 1) / _steps, minHeight: 4, borderRadius: BorderRadius.circular(2)),
                const SizedBox(height: 28),
                Text(heading, style: title),
                const SizedBox(height: 16),
                Expanded(child: SingleChildScrollView(child: content)),
                Row(children: [
                  if (_step > 0) TextButton(onPressed: () => setState(() => _step--), child: Text(t.back)),
                  const Spacer(),
                  if (_step == 1 && !(widget.auth?.signedIn ?? false))
                    TextButton(onPressed: _next, child: Text(t.skip)),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: _canNext ? _next : null,
                    style: FilledButton.styleFrom(minimumSize: const Size(120, 52)),
                    child: Text(last ? t.letsGo : t.next1),
                  ),
                ]),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
