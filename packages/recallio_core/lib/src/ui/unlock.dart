import 'package:flutter/material.dart';

import '../access/paper_access.dart';
import '../data/auth.dart';
import '../study/study_controller.dart';
import 'strings.dart';

/// Home-feed card offering to unlock a paper whose free cards are running
/// out. Shown only between sittings, never inside one.
class UnlockCard extends StatelessWidget {
  const UnlockCard({super.key, required this.controller, required this.section, this.auth});
  final StudyController controller;
  final int section;
  final AuthGateway? auth;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final c = controller;
    final a = c.access!;
    final s = Theme.of(context).colorScheme;
    final name = c.config.section(section).name;
    final left = c.freeLeft(section);
    return Card(
      elevation: 0,
      color: s.secondaryContainer,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(t.unlockTitle(name),
              style: Theme.of(context).textTheme.titleLarge!.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(t.freeLeftLine(left), style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(t.unlockBody(c.config.pricing!.freeCardsPerSection), style: const TextStyle(height: 1.4)),
          const SizedBox(height: 12),
          UnlockButtons(access: a, section: section, auth: auth),
        ]),
      ),
    );
  }
}

/// Buy (Android) and coupon buttons for one paper, with sign-in first.
class UnlockButtons extends StatelessWidget {
  const UnlockButtons({super.key, required this.access, required this.section, this.auth});
  final PaperAccess access;
  final int section;
  final AuthGateway? auth;

  void _show(BuildContext context, String? msg) {
    if (msg == null || !context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final a = access;
    if (!a.signedIn) {
      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(t.signInToUnlock),
        const SizedBox(height: 8),
        if (auth != null)
          FilledButton.icon(onPressed: auth!.signIn, icon: const Icon(Icons.login), label: Text(t.signIn)),
      ]);
    }
    final busy = a.buying != null;
    return Wrap(spacing: 10, runSpacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: [
      if (a.canBuy)
        FilledButton(
          onPressed: busy
              ? null
              : () async {
                  final msg = await a.buy(section);
                  if (context.mounted) _show(context, msg);
                },
          child: Text(a.buying == section ? t.working : t.buyFor(a.priceOf(section))),
        )
      else
        Text(t.buyOnAndroid),
      TextButton(
        onPressed: () => showCouponDialog(context, a),
        child: Text(t.haveCoupon),
      ),
    ]);
  }
}

Future<void> showCouponDialog(BuildContext context, PaperAccess access) async {
  final t = T.of(context);
  final field = TextEditingController();
  String? error;
  var busy = false;
  final ok = await showDialog<bool>(
    context: context,
    builder: (d) => StatefulBuilder(
      builder: (d, setState) => AlertDialog(
        title: Text(t.couponCode),
        content: TextField(
          controller: field,
          autofocus: true,
          textCapitalization: TextCapitalization.characters,
          decoration: InputDecoration(errorText: error, hintText: 'ABCD-1234'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(d, false), child: Text(t.cancel)),
          FilledButton(
            onPressed: busy
                ? null
                : () async {
                    setState(() => busy = true);
                    final msg = await access.redeem(field.text);
                    if (!d.mounted) return;
                    if (msg == null) {
                      Navigator.pop(d, true);
                    } else {
                      setState(() {
                        busy = false;
                        error = msg;
                      });
                    }
                  },
            child: Text(busy ? t.working : t.redeem),
          ),
        ],
      ),
    ),
  );
  if (ok == true && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t.couponDone)));
  }
}

/// Profile-sheet section: each enrolled paper, owned or with unlock buttons.
class PapersSection extends StatelessWidget {
  const PapersSection({super.key, required this.controller, this.auth});
  final StudyController controller;
  final AuthGateway? auth;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final c = controller;
    final a = c.access!;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      for (final sec in c.config.sections)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(children: [
            Expanded(child: Text(sec.name)),
            if (a.owns(sec.id))
              Chip(avatar: const Icon(Icons.lock_open, size: 18), label: Text(t.owned))
            else if (a.canBuy && a.signedIn)
              FilledButton.tonal(
                onPressed: a.buying != null
                    ? null
                    : () async {
                        final msg = await a.buy(sec.id);
                        if (msg != null && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
                        }
                      },
                child: Text(a.buying == sec.id ? t.working : a.priceOf(sec.id)),
              )
            else
              Text(t.freeCards(c.config.pricing!.freeCardsPerSection)),
          ]),
        ),
      if (a.owned.length < c.config.sections.length)
        a.signedIn
            ? Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                if (!a.canBuy) Text(t.buyOnAndroid),
                TextButton(onPressed: () => showCouponDialog(context, a), child: Text(t.haveCoupon)),
              ])
            : Text(t.signInToUnlock),
    ]);
  }
}
