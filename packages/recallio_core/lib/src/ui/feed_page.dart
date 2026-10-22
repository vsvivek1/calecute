import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/auth.dart';
import '../engine/planner.dart';
import '../engine/report.dart';
import '../model/learner.dart';
import '../study/study_controller.dart';
import 'profile_sheet.dart';
import 'strings.dart';
import 'study_card_view.dart';

/// The Daily Feed: the app's only menu. One card at a time; the app bar
/// holds just the referral gift icon and the profile button.
class FeedPage extends StatefulWidget {
  const FeedPage({super.key, required this.controller, this.auth});

  final StudyController controller;
  final AuthGateway? auth;

  @override
  State<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends State<FeedPage> with WidgetsBindingObserver {
  DateTime? _lastBack;

  StudyController get c => widget.controller;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      c.resume();
      c.syncNow();
    }
  }

  void _onBack() {
    final t = T.of(context);
    final now = DateTime.now();
    if (_lastBack != null && now.difference(_lastBack!) < const Duration(seconds: 2)) {
      // Second press: leave the app; the sitting is saved and resumes here.
      SystemNavigator.pop();
      return;
    }
    _lastBack = now;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(t.sittingSaved), duration: const Duration(seconds: 2)));
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: c,
      builder: (context, _) {
        final t = T.of(context);
        final sitting = c.sitting;
        final card = c.currentCard;
        return PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, _) {
            if (!didPop) _onBack();
          },
          child: Scaffold(
            appBar: AppBar(
              title: Text(c.config.appName, style: const TextStyle(fontWeight: FontWeight.w700)),
              automaticallyImplyLeading: false,
              actions: [
                // Referral gift icon; the invite card never appears inside a sitting.
                TextButton.icon(
                  onPressed: () => launchUrl(Uri.parse(c.config.inviteUrl), mode: LaunchMode.externalApplication),
                  icon: const Icon(Icons.card_giftcard_outlined),
                  label: Text(t.invite),
                ),
                IconButton(
                  tooltip: t.profile,
                  icon: const Icon(Icons.account_circle_outlined),
                  onPressed: () => showProfileSheet(context, c, widget.auth),
                ),
              ],
            ),
            body: SafeArea(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 640),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _QuotaHeader(controller: c),
                        if (sitting != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: LinearProgressIndicator(
                              value: (sitting.index) / sitting.items.length,
                              minHeight: 4,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        const SizedBox(height: 12),
                        Expanded(
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 250),
                            child: sitting != null && card != null
                                ? StudyCardView(
                                    key: ValueKey('${sitting.index}:${card.id}'),
                                    card: card,
                                    mode: sitting.current!.mode,
                                    progress: c.progressOf(card.id),
                                    sectionName: c.config.section(card.section).short,
                                    initialScreen: sitting.screen,
                                    initialElapsed: sitting.elapsed,
                                    onScreen: c.saveScreen,
                                    onRate: c.rate,
                                  )
                                : _HomeView(key: ValueKey(c.home), controller: c),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _QuotaHeader extends StatelessWidget {
  const _QuotaHeader({required this.controller});
  final StudyController controller;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final c = controller;
    final plan = c.plan;
    final next = c.nextStudyTime;
    final parts = [
      t.quota(plan.doneToday, plan.quota),
      if (!plan.complete) t.minLeft(c.minutesLeft),
      if (next != null && !plan.complete) t.next(formatStudyTime(next.hour * 60 + next.minute)),
    ];
    final s = Theme.of(context).colorScheme;
    return Row(children: [
      Expanded(
        child: Text(parts.join(' · '),
            style: TextStyle(fontWeight: FontWeight.w600, color: s.onSurface)),
      ),
      if (plan.daysLeft >= 0)
        Text(t.daysLeft(plan.daysLeft), style: TextStyle(fontSize: 12.5, color: s.onSurfaceVariant)),
    ]);
  }
}

class _HomeView extends StatelessWidget {
  const _HomeView({super.key, required this.controller});
  final StudyController controller;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final c = controller;
    final plan = c.plan;
    final theme = Theme.of(context);
    final title = theme.textTheme.headlineSmall!.copyWith(fontWeight: FontWeight.w700);
    final body = theme.textTheme.bodyLarge!.copyWith(fontSize: 17, height: 1.45);

    final banners = <Widget>[
      if (c.reportDue) _ReportCard(controller: c),
      if (plan.mode == DayMode.revision) _Banner(icon: Icons.replay, text: t.revisionMode),
      if (plan.mode == DayMode.cram) _Banner(icon: Icons.bolt, text: t.cramMode),
      if (plan.mode == DayMode.cram && DateTime.now().hour >= 20) _Banner(icon: Icons.bedtime_outlined, text: t.sleepNow),
      if (plan.behindPlan && !plan.complete) _Banner(icon: Icons.schedule, text: t.behindPlan),
    ];

    Widget main;
    switch (c.home) {
      case HomeKind.empty:
        main = _Big(title: t.nothingEnrolled, style: title);
      case HomeKind.afterExam:
        main = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(t.afterExam, style: title),
          const SizedBox(height: 8),
          Text(t.afterExamBody, style: body),
        ]);
      case HomeKind.examMorning:
        main = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(t.examMorning, style: title),
          const SizedBox(height: 12),
          for (final line in c.config.examChecklist)
            Padding(padding: const EdgeInsets.only(bottom: 8), child: Text('☐  $line', style: body)),
        ]);
      case HomeKind.quotaComplete:
        final at = c.bonusOpensAt;
        main = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(t.quotaComplete, style: title),
          const SizedBox(height: 8),
          Text(t.quotaCompleteBody, style: body),
          const SizedBox(height: 20),
          if (c.bonusOpenNow) ...[
            Text(t.bonusOpen, style: body),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () => c.startSitting(bonus: true),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
              child: Text(t.startBonus),
            ),
          ] else if (at != null)
            Text(t.wantMore(formatStudyTime(at.hour * 60 + at.minute)), style: body),
        ]);
      case HomeKind.ready:
      case HomeKind.sittingDone:
        final n = plan.left.clamp(0, 10);
        final next = c.nextStudyTime;
        main = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (c.home == HomeKind.sittingDone) ...[
            Text(t.sittingDone, style: title),
            const SizedBox(height: 6),
            Text(t.quota(plan.doneToday, plan.quota), style: body),
            if (next != null) Text(t.nextSittingAt(formatStudyTime(next.hour * 60 + next.minute)), style: body),
            const SizedBox(height: 20),
          ] else ...[
            Text(c.welcomeBack ? t.welcomeBack : t.readyTitle(n), style: title),
            const SizedBox(height: 6),
            Text(t.readyBody((c.minutesLeft * n / plan.left.clamp(1, 1 << 30)).ceil().clamp(1, 60)), style: body),
            const SizedBox(height: 20),
          ],
          FilledButton(
            onPressed: () => c.startSitting(),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(56)),
            child: Text(c.home == HomeKind.sittingDone ? t.startNow : t.startSitting, style: const TextStyle(fontSize: 17)),
          ),
        ]);
    }

    return SingleChildScrollView(
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        for (final b in banners) Padding(padding: const EdgeInsets.only(bottom: 12), child: b),
        Card(
          elevation: 0,
          color: theme.colorScheme.surfaceContainerLow,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(padding: const EdgeInsets.all(20), child: main),
        ),
      ]),
    );
  }
}

class _Big extends StatelessWidget {
  const _Big({required this.title, required this.style});
  final String title;
  final TextStyle style;
  @override
  Widget build(BuildContext context) => Text(title, style: style);
}

class _Banner extends StatelessWidget {
  const _Banner({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: s.tertiaryContainer, borderRadius: BorderRadius.circular(16)),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: s.onTertiaryContainer),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: TextStyle(color: s.onTertiaryContainer, height: 1.35))),
      ]),
    );
  }
}

class _ReportCard extends StatelessWidget {
  const _ReportCard({required this.controller});
  final StudyController controller;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final r = controller.buildReport();
    final s = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      color: s.primaryContainer,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(t.weeklyReport, style: Theme.of(context).textTheme.titleLarge!.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text('${t.daysStudied(r.daysStudied)} · ${t.readiness(r.readinessBand)}'),
          const SizedBox(height: 12),
          Row(children: [
            FilledButton(onPressed: () => showReport(context, r), child: Text(t.seeReport)),
            const SizedBox(width: 10),
            TextButton(onPressed: controller.markReportSeen, child: Text(t.gotIt)),
          ]),
        ]),
      ),
    );
  }
}

Future<void> showReport(BuildContext context, WeeklyReport r) {
  final t = T.of(context);
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (context) {
      final h = Theme.of(context).textTheme.titleMedium!.copyWith(fontWeight: FontWeight.w700);
      Widget list(List<TopicCount> items) => items.isEmpty
          ? Text(t.noneYet)
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [for (final i in items.take(6)) Text('• ${i.topic}: ${i.count}')],
            );
      return DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.75,
        builder: (context, scroll) => ListView(
          controller: scroll,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          children: [
            Text(t.weeklyReport, style: Theme.of(context).textTheme.headlineSmall!.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Text(t.daysStudied(r.daysStudied)),
            Text(t.minutesCards(r.minutes, r.cards)),
            Text('${t.readiness(r.readinessBand)} · ${t.daysLeft(r.daysLeft)}'),
            const SizedBox(height: 16),
            Text(t.becameEasy, style: h),
            list(r.becameEasy),
            const SizedBox(height: 16),
            Text(t.stillTough, style: h),
            list(r.stillTough),
            const SizedBox(height: 16),
            Text(t.slipped(r.slipped)),
            Text(t.simpleMissed(r.markedSimpleMissed)),
            if (r.teachBackTopic != null) ...[
              const SizedBox(height: 16),
              Text(t.teachBack(r.teachBackTopic!)),
            ],
          ],
        ),
      );
    },
  );
}
