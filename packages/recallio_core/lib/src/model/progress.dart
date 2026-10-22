import 'rating.dart';

/// One learner's state for one card: the FSRS fields plus the tough/easy
/// history the report and the "push again" rule need.
class CardProgress {
  CardProgress({
    required this.cardId,
    this.fsrsState = 1,
    this.fsrsStep,
    this.stability,
    this.difficulty,
    required this.due,
    this.lastReview,
    this.reps = 0,
    this.lapses = 0,
    List<int>? lastRatings,
    this.everTough = false,
    this.toughStreak = 0,
    this.honestyMisses = 0,
    this.honestyCheckAt,
    this.firstSeen,
    required this.updatedAt,
  }) : lastRatings = lastRatings ?? <int>[];

  final String cardId;

  /// FSRS state: 1 learning, 2 review, 3 relearning.
  int fsrsState;
  int? fsrsStep;
  double? stability;
  double? difficulty;
  DateTime due;
  DateTime? lastReview;
  int reps;
  int lapses;

  /// The last three ratings, oldest first.
  List<int> lastRatings;
  bool everTough;
  int toughStreak;
  int honestyMisses;

  /// When set, the card comes back once as a quick question to check an
  /// earlier "So simple".
  DateTime? honestyCheckAt;
  DateTime? firstSeen;
  DateTime updatedAt;

  int? get lastRating => lastRatings.isEmpty ? null : lastRatings.last;

  /// Tough or Didn't get it in 2 of the last 3 reviews.
  bool get stillTough =>
      lastRatings.length >= 2 &&
      lastRatings.where((r) => r <= 2).length >= 2;

  /// Was tough once; the last two ratings are Understood or So simple.
  bool get becameEasy =>
      everTough &&
      lastRatings.length >= 2 &&
      lastRatings.reversed.take(2).every((r) => r >= 3);

  Map<String, dynamic> toJson() => {
        'c': cardId,
        's': fsrsState,
        if (fsrsStep != null) 'st': fsrsStep,
        if (stability != null) 'sb': stability,
        if (difficulty != null) 'df': difficulty,
        'd': due.toUtc().toIso8601String(),
        if (lastReview != null) 'lr': lastReview!.toUtc().toIso8601String(),
        'r': reps,
        'l': lapses,
        'h': lastRatings,
        'et': everTough,
        'ts': toughStreak,
        'hm': honestyMisses,
        if (honestyCheckAt != null)
          'hc': honestyCheckAt!.toUtc().toIso8601String(),
        if (firstSeen != null) 'fs': firstSeen!.toUtc().toIso8601String(),
        'u': updatedAt.toUtc().toIso8601String(),
      };

  factory CardProgress.fromJson(Map<String, dynamic> j) => CardProgress(
        cardId: j['c'] as String,
        fsrsState: j['s'] as int? ?? 1,
        fsrsStep: j['st'] as int?,
        stability: (j['sb'] as num?)?.toDouble(),
        difficulty: (j['df'] as num?)?.toDouble(),
        due: DateTime.parse(j['d'] as String),
        lastReview: _date(j['lr']),
        reps: j['r'] as int? ?? 0,
        lapses: j['l'] as int? ?? 0,
        lastRatings: [for (final r in (j['h'] as List? ?? const [])) r as int],
        everTough: j['et'] as bool? ?? false,
        toughStreak: j['ts'] as int? ?? 0,
        honestyMisses: j['hm'] as int? ?? 0,
        honestyCheckAt: _date(j['hc']),
        firstSeen: _date(j['fs']),
        updatedAt: DateTime.parse(j['u'] as String),
      );

  static DateTime? _date(Object? v) => v == null ? null : DateTime.parse(v as String);
}

/// One rating, append-only.
class ReviewEntry {
  const ReviewEntry({
    required this.cardId,
    required this.rating,
    required this.mode,
    required this.seconds,
    required this.at,
  });

  final String cardId;
  final StudyRating rating;
  final ReviewMode mode;

  /// Seconds the card was on screen with the app in the foreground.
  final int seconds;
  final DateTime at;

  Map<String, dynamic> toJson() => {
        'c': cardId,
        'r': rating.value,
        'm': mode.name,
        's': seconds,
        'a': at.toUtc().toIso8601String(),
      };

  factory ReviewEntry.fromJson(Map<String, dynamic> j) => ReviewEntry(
        cardId: j['c'] as String,
        rating: StudyRating.fromValue(j['r'] as int),
        mode: ReviewMode.values.byName(j['m'] as String),
        seconds: j['s'] as int,
        at: DateTime.parse(j['a'] as String),
      );
}
