import 'package:intl/intl.dart';

// Indian formats, matching the web app: ₹1,14,600 and "15 Oct".

final _inr = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 0,
);
final _inrPaise = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 2,
);

String rupees(Object? paise) {
  final p = num.tryParse('$paise') ?? 0;
  return p % 100 == 0 ? _inr.format(p / 100) : _inrPaise.format(p / 100);
}

/// Kerala is UTC+5:30 all year; school days are counted there.
DateTime istNow() =>
    DateTime.now().toUtc().add(const Duration(hours: 5, minutes: 30));

String isoDay(DateTime d) => DateFormat('yyyy-MM-dd').format(d);

String todayIso() => isoDay(istNow());

/// A bare date is a calendar day; a timestamp is shown in Indian time.
DateTime parse(String s) {
  if (s.length == 10) return DateTime.parse(s);
  return DateTime.parse(s).toUtc().add(const Duration(hours: 5, minutes: 30));
}

String day(String? s) => s == null ? '' : DateFormat('d MMM').format(parse(s));
String dayYear(String? s) =>
    s == null ? '' : DateFormat('d MMM y').format(parse(s));
String dayTime(String s) => DateFormat('EEE, d MMM, h:mm a').format(parse(s));

String relative(String s) {
  final today = DateTime.parse(todayIso());
  final d = DateTime.parse(s.substring(0, 10));
  final n = d.difference(today).inDays;
  if (n == 0) return 'today';
  if (n == 1) return 'tomorrow';
  if (n == -1) return 'yesterday';
  return n > 0 ? 'in $n days' : '${-n} days ago';
}

int asInt(Object? v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
num asNum(Object? v) => v is num ? v : num.tryParse('$v') ?? 0;
List<Map<String, dynamic>> asList(Object? v) =>
    (v as List? ?? const []).cast<Map<String, dynamic>>();
