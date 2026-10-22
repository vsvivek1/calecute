import 'package:energy_manager/config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('course has four papers and an exam date', () {
    expect(energyCourse.sections.length, 4);
    expect(energyCourse.exam.date.year, greaterThanOrEqualTo(2027));
  });
}
