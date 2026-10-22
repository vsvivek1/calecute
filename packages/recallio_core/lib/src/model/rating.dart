/// The four rating buttons. Always the same four, in this order.
enum StudyRating {
  didntGet(1, "Didn't get it", 'മനസ്സിലായില്ല'),
  tough(2, 'Tough', 'പ്രയാസം'),
  understood(3, 'Understood', 'മനസ്സിലായി'),
  simple(4, 'So simple', 'വളരെ എളുപ്പം');

  const StudyRating(this.value, this.en, this.ml);

  /// FSRS rating: Again 1, Hard 2, Good 3, Easy 4.
  final int value;
  final String en;
  final String ml;

  bool get isTough => value <= 2;

  static StudyRating fromValue(int v) =>
      StudyRating.values.firstWhere((r) => r.value == v);
}

/// How the card was shown when it was rated.
enum ReviewMode { learn, recall, check, cram }
