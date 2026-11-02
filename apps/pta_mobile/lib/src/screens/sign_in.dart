import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../api.dart';
import '../widgets.dart';

/// Parents sign in with the email address the school has on file: a six-digit
/// code arrives by email, so there is no password to forget. Google works too.
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key, required this.onSignedIn});
  final VoidCallback onSignedIn;

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _email = TextEditingController();
  final _code = TextEditingController();
  bool _sent = false;
  bool _busy = false;
  String? _error;

  Future<void> _run(Future<void> Function() f) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await f();
    } on AuthException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = '$e';
    }
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final api = context.api;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 24),
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: brandBlue,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: const Text(
                    'P',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Calecutech PTA',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 28),
            Text(
              'Your child’s school day, in one place',
              style: Theme.of(context).textTheme.headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Attendance, homework, fees, marks, activities and complaints.',
              style: TextStyle(color: Colors.grey.shade700),
            ),
            const SizedBox(height: 24),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: red)),
              const SizedBox(height: 12),
            ],
            if (api is DemoApi) ..._demo(api) else ..._real(api as SupabaseApi),
          ],
        ),
      ),
    );
  }

  List<Widget> _demo(DemoApi api) => [
    Card(
      color: green.withValues(alpha: 0.1),
      elevation: 0,
      child: const Padding(
        padding: EdgeInsets.all(12),
        child: Text(
          'Demo school with sample data. Pick who to look around as.',
        ),
      ),
    ),
    const SizedBox(height: 8),
    for (final (email, label, who) in DemoApi.people)
      Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFFE2E7EF)),
        ),
        child: ListTile(
          title: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          subtitle: Text(who),
          trailing: const Icon(Icons.arrow_forward),
          onTap: () {
            api.signInAs(email);
            widget.onSignedIn();
          },
        ),
      ),
  ];

  List<Widget> _real(SupabaseApi api) {
    final auth = api.client.auth;
    return [
      TextField(
        controller: _email,
        enabled: !_sent,
        keyboardType: TextInputType.emailAddress,
        autofillHints: const [AutofillHints.email],
        decoration: const InputDecoration(
          labelText: 'Email you gave the school',
          border: OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 12),
      if (!_sent)
        FilledButton(
          onPressed: _busy
              ? null
              : () => _run(() async {
                  await auth.signInWithOtp(
                    email: _email.text.trim().toLowerCase(),
                    shouldCreateUser: true,
                  );
                  setState(() => _sent = true);
                }),
          child: const Text('Email me a code'),
        )
      else ...[
        TextField(
          controller: _code,
          keyboardType: TextInputType.number,
          autofillHints: const [AutofillHints.oneTimeCode],
          decoration: const InputDecoration(
            labelText: '6-digit code',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: _busy
              ? null
              : () => _run(() async {
                  await auth.verifyOTP(
                    email: _email.text.trim().toLowerCase(),
                    token: _code.text.trim(),
                    type: OtpType.email,
                  );
                  widget.onSignedIn();
                }),
          child: const Text('Sign in'),
        ),
        TextButton(
          onPressed: () => setState(() => _sent = false),
          child: const Text('Use a different email'),
        ),
      ],
      const SizedBox(height: 20),
      const Row(
        children: [
          Expanded(child: Divider()),
          Text('  or  '),
          Expanded(child: Divider()),
        ],
      ),
      const SizedBox(height: 20),
      OutlinedButton(
        onPressed: _busy
            ? null
            : () => _run(
                () => auth.signInWithOAuth(
                  OAuthProvider.google,
                  redirectTo: 'com.calecutech.pta://login-callback',
                ),
              ),
        child: const Text('Continue with Google'),
      ),
    ];
  }
}

/// Signed in, but no school has this email yet.
class NotLinkedScreen extends StatelessWidget {
  const NotLinkedScreen({super.key, required this.onSignOut});
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final office = app.isOfficeOnly;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                office
                    ? 'Office tools are on the web'
                    : 'No school has this email yet',
                style: Theme.of(context).textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              Text(
                office
                    ? 'Fees, complaints and student records are managed at pta.calecutech.com on a computer.'
                    : 'You signed in as ${app.api.email}. Ask the school office to add this exact address to your child’s record; it shows up here next time you open the app.',
              ),
              const SizedBox(height: 20),
              OutlinedButton(
                onPressed: () async {
                  await app.signOut();
                  onSignOut();
                },
                child: const Text('Sign in with a different account'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
