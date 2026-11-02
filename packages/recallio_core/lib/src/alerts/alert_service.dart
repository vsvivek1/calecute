import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import '../engine/bonus.dart';
import '../model/learner.dart';

/// One short fact for the noon flash alert.
class FlashFact {
  const FlashFact(this.title, this.body);
  final String title;
  final String body;
}

/// Study-time alerts (Android). On the web every call is a no-op: browsers
/// cannot wake a closed page, so the web app shows the quota in the feed only.
class AlertService {
  AlertService({required this.channelId, required this.appName});

  final String channelId;
  final String appName;
  final _plugin = FlutterLocalNotificationsPlugin();
  bool _ready = false;

  static const _studyBase = 100;
  static const _flashBase = 200;
  static const _quotaId = 300;

  bool get supported => !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  Future<void> init() async {
    if (!supported || _ready) return;
    tzdata.initializeTimeZones();
    try {
      final info = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(info.identifier));
    } catch (_) {
      tz.setLocalLocation(tz.getLocation('Asia/Kolkata'));
    }
    await _plugin.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      ),
    );
    _ready = true;
  }

  Future<bool> requestPermission() async {
    if (!supported) return false;
    await init();
    final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    return await android?.requestNotificationsPermission() ?? false;
  }

  NotificationDetails get _study => NotificationDetails(
        android: AndroidNotificationDetails(
          '$channelId.study',
          'Study times',
          channelDescription: 'A heads-up at each of your study times',
          importance: Importance.max,
          priority: Priority.high,
          category: AndroidNotificationCategory.reminder,
        ),
      );

  NotificationDetails get _flash => NotificationDetails(
        android: AndroidNotificationDetails(
          '$channelId.flash',
          'Noon flash facts',
          channelDescription: 'One or two key facts at noon',
          importance: Importance.defaultImportance,
          priority: Priority.defaultPriority,
          styleInformation: const BigTextStyleInformation(''),
        ),
      );

  /// Re-plans every alert. Called on launch, after each sitting and when the
  /// learner changes study times. Alerts for today's quota stop once it is
  /// complete; quiet hours are respected.
  Future<void> schedule({
    required LearnerSettings settings,
    required DateTime now,
    required int quotaLeft,
    required int minutesLeft,
    required List<FlashFact> flash,
  }) async {
    if (!supported) return;
    await init();
    await _plugin.cancelAll();
    final local = tz.TZDateTime.from(now, tz.local);

    // Study times for the next two days. Today's are skipped once the quota
    // is done; tomorrow's always fire (the count is an estimate).
    var n = 0;
    for (var day = 0; day < 2; day++) {
      for (final t in settings.studyTimes) {
        final at = tz.TZDateTime(tz.local, local.year, local.month, local.day + day, t ~/ 60, t % 60);
        if (!at.isAfter(local)) continue;
        if (inQuietHours(at, settings.quietStart, settings.quietEnd)) continue;
        if (day == 0 && quotaLeft <= 0) continue;
        final body = day == 0
            ? '$quotaLeft cards left today, about $minutesLeft min. Ten at a time.'
            : 'Your next set is ready. About 6 minutes.';
        await _plugin.zonedSchedule(
          id: _studyBase + n++,
          scheduledDate: at,
          notificationDetails: _study,
          androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
          title: 'Time to study: $appName',
          body: body,
          payload: 'study',
        );
      }
    }

    // Noon flash: one or two facts, today (if still ahead) and tomorrow.
    for (var day = 0; day < 2 && day < flash.length; day++) {
      final at = tz.TZDateTime(tz.local, local.year, local.month, local.day + day, 12);
      if (!at.isAfter(local)) continue;
      final f = flash[day];
      await _plugin.zonedSchedule(
        id: _flashBase + day,
        scheduledDate: at,
        notificationDetails: _flash,
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        title: f.title,
        body: f.body,
        payload: 'flash',
      );
    }
  }

  /// Shown once when today's quota is done.
  Future<void> quotaComplete(String body) async {
    if (!supported) return;
    await init();
    await _plugin.show(
      id: _quotaId,
      title: 'Quota complete',
      body: body,
      notificationDetails: _flash,
    );
  }
}
