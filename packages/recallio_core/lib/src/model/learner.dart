/// The official exam date as the course knows it.
class ExamInfo {
  const ExamInfo({
    required this.name,
    required this.date,
    required this.official,
    required this.source,
    required this.checkedOn,
  });

  final String name;
  final DateTime date;

  /// false = estimated from last year's schedule.
  final bool official;
  final String source;
  final DateTime checkedOn;
}

/// A study time of day, in minutes after local midnight.
typedef StudyTime = int;

String formatStudyTime(StudyTime t) {
  final h = t ~/ 60, m = t % 60;
  final h12 = h % 12 == 0 ? 12 : h % 12;
  return '$h12:${m.toString().padLeft(2, '0')} ${h < 12 ? 'AM' : 'PM'}';
}

/// Everything the learner sets in onboarding and the profile sheet.
class LearnerSettings {
  LearnerSettings({
    this.onboarded = false,
    this.examDate,
    this.sections = const [],
    this.studyTimes = const [7 * 60, 13 * 60, 20 * 60],
    this.minutesPerDay = 30,
    this.language = 'en',
    this.quietStart = 21 * 60 + 30,
    this.quietEnd = 6 * 60 + 30,
    this.reportToSelf = true,
    this.name,
    this.planDays = defaultPlanDays,
    this.planFrom,
  });

  /// Every learner starts on a 100-day plan, whatever papers they take:
  /// more papers means more cards a day, not more days.
  static const defaultPlanDays = 100;

  /// Lengths offered when the learner reschedules. 0 = until the exam.
  static const planChoices = [100, 150, 200, 300, 0];

  bool onboarded;

  /// Days to finish every new card in the enrolled papers, counted from
  /// [planFrom]. 0 = spread them out until the exam.
  int planDays;

  /// The day the current plan length was chosen; null = the day the learner
  /// started studying.
  DateTime? planFrom;

  /// The learner's own exam date; null means use the official one.
  DateTime? examDate;

  /// Enrolled papers.
  List<int> sections;
  List<StudyTime> studyTimes;
  int minutesPerDay;
  String language;
  StudyTime quietStart;
  StudyTime quietEnd;
  bool reportToSelf;
  String? name;

  Map<String, dynamic> toJson() => {
        'onboarded': onboarded,
        if (examDate != null) 'examDate': _day(examDate!),
        'sections': sections,
        'studyTimes': studyTimes,
        'minutesPerDay': minutesPerDay,
        'language': language,
        'quietStart': quietStart,
        'quietEnd': quietEnd,
        'reportToSelf': reportToSelf,
        if (name != null) 'name': name,
        'planDays': planDays,
        if (planFrom != null) 'planFrom': _day(planFrom!),
      };

  factory LearnerSettings.fromJson(Map<String, dynamic> j) => LearnerSettings(
        onboarded: j['onboarded'] as bool? ?? false,
        examDate: j['examDate'] == null ? null : DateTime.parse(j['examDate'] as String),
        sections: [for (final s in (j['sections'] as List? ?? const [])) s as int],
        studyTimes: [for (final s in (j['studyTimes'] as List? ?? const [420, 780, 1200])) s as int],
        minutesPerDay: j['minutesPerDay'] as int? ?? 30,
        language: j['language'] as String? ?? 'en',
        quietStart: j['quietStart'] as int? ?? 1290,
        quietEnd: j['quietEnd'] as int? ?? 390,
        reportToSelf: j['reportToSelf'] as bool? ?? true,
        name: j['name'] as String?,
        planDays: j['planDays'] as int? ?? defaultPlanDays,
        planFrom: j['planFrom'] == null ? null : DateTime.parse(j['planFrom'] as String),
      );

  static String _day(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
