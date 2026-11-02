import '../access/paper_access.dart';
import '../model/learner.dart';

class CourseSection {
  const CourseSection({required this.id, required this.name, required this.short});
  final int id;
  final String name;
  final String short;
}

/// What a course app tells the shared engine about itself.
class CourseConfig {
  const CourseConfig({
    required this.id,
    required this.appName,
    required this.tagline,
    required this.sections,
    required this.exam,
    required this.syncRpc,
    required this.deleteRpc,
    required this.androidRedirect,
    required this.privacyUrl,
    required this.termsUrl,
    required this.deleteAccountUrl,
    required this.inviteUrl,
    this.languages = const ['en', 'ml'],
    this.examChecklist = const [],
    this.pricing,
  });

  /// Storage key and alert channel id, e.g. `energy_manager`.
  final String id;
  final String appName;
  final String tagline;
  final List<CourseSection> sections;
  final ExamInfo exam;
  final String syncRpc;
  final String deleteRpc;

  /// OAuth deep link on Android, e.g. `com.calecutech.x://login-callback`.
  final String androidRedirect;
  final String privacyUrl;
  final String termsUrl;
  final String deleteAccountUrl;
  final String inviteUrl;
  final List<String> languages;

  /// Exam-morning checklist lines (English).
  final List<String> examChecklist;

  /// Paid papers; null means everything is free.
  final CoursePricing? pricing;

  CourseSection section(int id) => sections.firstWhere((s) => s.id == id, orElse: () => sections.first);
}
