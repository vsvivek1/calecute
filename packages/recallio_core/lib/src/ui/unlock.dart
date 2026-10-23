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
          UnlockButtons(controller: c, section: section, auth: auth),
        ]),
      ),
    );
  }
}

/// "Add to cart" for one paper, with sign-in first.
class UnlockButtons extends StatelessWidget {
  const UnlockButtons({super.key, required this.controller, required this.section, this.auth});
  final StudyController controller;
  final int section;
  final AuthGateway? auth;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final a = controller.access!;
    if (!a.signedIn) {
      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(t.signInToUnlock),
        const SizedBox(height: 8),
        if (auth != null)
          FilledButton.icon(onPressed: auth!.signIn, icon: const Icon(Icons.login), label: Text(t.signIn)),
      ]);
    }
    return FilledButton.icon(
      onPressed: () {
        a.addToCart(section);
        showCartSheet(context, controller);
      },
      icon: const Icon(Icons.shopping_cart_outlined),
      label: Text('${t.addToCart} · ${a.priceOf(section)}'),
    );
  }
}

/// The cart: pick papers, apply a coupon, check out through Google Play.
Future<void> showCartSheet(BuildContext context, StudyController controller) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: CartView(controller: controller),
    ),
  );
}

class CartView extends StatefulWidget {
  const CartView({super.key, required this.controller});
  final StudyController controller;

  @override
  State<CartView> createState() => _CartViewState();
}

class _CartViewState extends State<CartView> {
  final _code = TextEditingController();
  String? _codeError;
  bool _applying = false;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _apply(PaperAccess a) async {
    final t = T.of(context);
    setState(() {
      _applying = true;
      _codeError = null;
    });
    final r = await a.applyCoupon(_code.text);
    if (!mounted) return;
    setState(() {
      _applying = false;
      _codeError = r.error;
    });
    if (r.unlocked) {
      _snack(t.couponDone);
      Navigator.of(context).maybePop();
    } else if (r.error == null) {
      _code.clear();
    }
  }

  Future<void> _checkout(PaperAccess a) async {
    final msg = await a.checkout();
    if (!mounted) return;
    if (msg == null) {
      _snack(a.takeMessage() ?? 'Done');
      Navigator.of(context).maybePop();
    } else {
      _snack(msg);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final c = widget.controller;
    final a = c.access!;
    return ListenableBuilder(
      listenable: a,
      builder: (context, _) {
        final locked = [for (final s in c.config.sections) if (!a.owns(s.id)) s];
        final busy = a.checkingOut || _applying;
        return SafeArea(
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            children: [
              Text(t.cartTitle,
                  style: Theme.of(context).textTheme.headlineSmall!.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              if (locked.isEmpty) Text(t.owned),
              for (final s in locked)
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: a.inCart(s.id),
                  onChanged: busy ? null : (_) => a.toggleCart(s.id),
                  title: Text(s.name),
                  subtitle: a.buying == s.id ? Text(t.working) : null,
                  secondary: a.discountPct > 0
                      ? Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                          Text(a.priceOf(s.id),
                              style: const TextStyle(decoration: TextDecoration.lineThrough, fontSize: 12)),
                          Text(a.cartPriceOf(s.id), style: const TextStyle(fontWeight: FontWeight.w700)),
                        ])
                      : Text(a.priceOf(s.id), style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              if (locked.isNotEmpty && a.cart.isEmpty)
                Padding(padding: const EdgeInsets.only(top: 4), child: Text(t.cartEmpty)),
              const Divider(height: 28),
              if (a.coupon != null)
                Row(children: [
                  const Icon(Icons.local_offer_outlined, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text(t.couponOff(a.discountPct, a.coupon!))),
                  TextButton(onPressed: busy ? null : a.removeCoupon, child: Text(t.removeCoupon)),
                ])
              else
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(
                    child: TextField(
                      controller: _code,
                      enabled: !busy,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(
                        labelText: t.couponCode,
                        errorText: _codeError,
                        isDense: true,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton.tonal(
                    onPressed: busy ? null : () => _apply(a),
                    child: Text(_applying ? t.working : t.apply),
                  ),
                ]),
              const SizedBox(height: 16),
              Row(children: [
                Text(t.total, style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                if (a.discountPct > 0 && a.cart.isNotEmpty) ...[
                  Text(a.cartFullTotal, style: const TextStyle(decoration: TextDecoration.lineThrough)),
                  const SizedBox(width: 8),
                ],
                Text(a.cartTotal,
                    style: Theme.of(context).textTheme.titleLarge!.copyWith(fontWeight: FontWeight.w700)),
              ]),
              const SizedBox(height: 12),
              if (a.canBuy) ...[
                FilledButton(
                  onPressed: busy || a.cart.isEmpty ? null : () => _checkout(a),
                  child: Text(a.checkingOut ? t.working : t.checkoutFor(a.cartTotal)),
                ),
                const SizedBox(height: 8),
                Text(t.checkoutNote, style: Theme.of(context).textTheme.bodySmall),
              ] else
                Text(t.buyOnAndroid),
            ],
          ),
        );
      },
    );
  }
}

/// Profile-sheet section: each enrolled paper, owned or free, plus the cart.
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
            else
              Text(t.freeCards(c.config.pricing!.freeCardsPerSection)),
          ]),
        ),
      if (a.owned.length < c.config.sections.length)
        a.signedIn
            ? FilledButton.tonalIcon(
                onPressed: () => showCartSheet(context, c),
                icon: const Icon(Icons.shopping_cart_outlined),
                label: Text(t.openCart(a.cart.length)),
              )
            : Text(t.signInToUnlock),
    ]);
  }
}
