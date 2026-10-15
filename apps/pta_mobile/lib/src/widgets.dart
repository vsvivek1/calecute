import 'package:flutter/material.dart';

import 'api.dart';
import 'app_state.dart';

/// Makes [AppState] reachable from any screen, rebuilding on change.
class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child})
    : super(notifier: state);

  static AppState of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;
}

extension AppContext on BuildContext {
  AppState get app => AppScope.of(this);
  Api get api => AppScope.of(this).api;
  String t(String s) => AppScope.of(this).t(s);

  void toast(String message, {bool error = false}) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: error ? const Color(0xFFC62F2F) : null,
      ),
    );
  }

  /// Runs an action, shows its result, and reports whether it worked.
  Future<bool> act(Future<void> Function() run, String ok) async {
    try {
      await run();
      if (mounted) toast(ok);
      return true;
    } on ApiException catch (e) {
      if (mounted) toast(e.message, error: true);
      return false;
    }
  }
}

/// Loads one screen's data with a spinner, an error with retry, and
/// pull-to-refresh. [load] is called again on refresh.
class Loader<T> extends StatefulWidget {
  const Loader({super.key, required this.load, required this.builder});

  final Future<T> Function() load;
  final Widget Function(
    BuildContext context,
    T data,
    Future<void> Function() reload,
  )
  builder;

  @override
  State<Loader<T>> createState() => _LoaderState<T>();
}

class _LoaderState<T> extends State<Loader<T>> {
  late Future<T> _future = widget.load();

  Future<void> reload() async {
    final f = widget.load();
    setState(() => _future = f);
    await f.catchError((_) => null as T);
  }

  @override
  void didUpdateWidget(covariant Loader<T> old) {
    super.didUpdateWidget(old);
    // A new child or class means new data.
    if (old.key != widget.key) _future = widget.load();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('${snap.error}', textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: reload,
                    child: const Text('Try again'),
                  ),
                ],
              ),
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: reload,
          child: widget.builder(context, snap.data as T, reload),
        );
      },
    );
  }
}

const brandBlue = Color(0xFF0163BB);
const green = Color(0xFF1F9D5C);
const amber = Color(0xFFB97A00);
const red = Color(0xFFC62F2F);

class Pill extends StatelessWidget {
  const Pill(this.text, {super.key, this.color});
  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? Colors.grey.shade700;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 2),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(color: c, fontSize: 12, fontWeight: FontWeight.w700),
      ),
    );
  }
}

Color statusColor(String? s) => switch (s) {
  'present' => green,
  'absent' => red,
  'late' => amber,
  'leave' => brandBlue,
  _ => Colors.grey.shade600,
};

Color percentColor(num p) => p >= 75
    ? green
    : p >= 50
    ? amber
    : red;

/// A titled white card, the basic block of every screen.
class Section extends StatelessWidget {
  const Section({
    super.key,
    this.title,
    this.trailing,
    required this.children,
    this.accent,
  });
  final String? title;
  final Widget? trailing;
  final List<Widget> children;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: accent ?? const Color(0xFFE2E7EF),
          width: accent == null ? 1 : 2,
        ),
      ),
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (title != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 8, 4),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      title!,
                      style: Theme.of(context).textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                  ?trailing,
                ],
              ),
            ),
          ...children,
        ],
      ),
    );
  }
}

class Empty extends StatelessWidget {
  const Empty(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(24),
    child: Text(
      text,
      textAlign: TextAlign.center,
      style: TextStyle(color: Colors.grey.shade600),
    ),
  );
}

/// Page heading inside a scrolling list.
class Heading extends StatelessWidget {
  const Heading(this.title, {super.key, this.sub});
  final String title;
  final String? sub;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.headlineSmall
              ?.copyWith(fontWeight: FontWeight.w700),
        ),
        if (sub != null) ...[
          const SizedBox(height: 2),
          Text(sub!, style: TextStyle(color: Colors.grey.shade600)),
        ],
      ],
    ),
  );
}
