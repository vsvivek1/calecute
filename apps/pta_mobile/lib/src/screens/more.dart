import 'package:flutter/material.dart';

import '../widgets.dart';
import 'activities.dart';
import 'attendance.dart';
import 'complaints.dart';
import 'notices.dart';
import 'quizzes.dart';
import 'tests.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    void open(Widget w) =>
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => w));
    return ListView(
      padding: const EdgeInsets.only(top: 12, bottom: 24),
      children: [
        if (!app.teacherMode)
          Section(
            children: [
              for (final (icon, label, screen) in <(IconData, String, Widget)>[
                (
                  Icons.fact_check_outlined,
                  'Attendance',
                  const AttendanceScreen(),
                ),
                (
                  Icons.celebration_outlined,
                  'Activities',
                  const ActivitiesScreen(),
                ),
                (Icons.quiz_outlined, 'Quizzes', const QuizzesScreen()),
                (
                  Icons.description_outlined,
                  'Sample tests',
                  const SampleTestsScreen(),
                ),
                (Icons.campaign_outlined, 'Notices', const NoticesScreen()),
                (Icons.report_outlined, 'Complaints', const ComplaintsScreen()),
              ])
                ListTile(
                  leading: Icon(icon),
                  title: Text(app.t(label)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => open(screen),
                ),
            ],
          ),
        Section(
          children: [
            if (app.isParent && app.isTeacher)
              SwitchListTile(
                title: const Text('Teacher view'),
                subtitle: const Text('Take the register and post homework'),
                value: app.teacherMode,
                onChanged: app.setTeacherMode,
              ),
            if (app.teacherMode)
              ListTile(
                leading: const Icon(Icons.campaign_outlined),
                title: Text(app.t('Notices')),
                onTap: () => open(const NoticesScreen()),
              ),
            ListTile(
              leading: const Icon(Icons.translate),
              title: Text(app.malayalam ? 'English' : 'മലയാളം'),
              onTap: app.toggleLanguage,
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: Text(app.t('Sign out')),
              subtitle: Text(app.api.email ?? ''),
              onTap: () async {
                await app.signOut();
                if (context.mounted) {
                  Navigator.of(context).popUntil((r) => r.isFirst);
                }
              },
            ),
          ],
        ),
        const Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'Marks entry, quizzes and the school office tools are on the web at pta.calecutech.com.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
        ),
      ],
    );
  }
}
