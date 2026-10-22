import 'package:supabase_flutter/supabase_flutter.dart';

import '../model/learner.dart';
import '../model/progress.dart';
import 'local_store.dart';

/// Copies progress between the device and Supabase (`public.<prefix>_sync`).
///
/// Last write wins per card, by `updatedAt`. The review log is append-only.
/// Any failure leaves the local data as it is; the next sync retries.
class SyncService {
  SyncService(this.client, {required this.rpc});

  final SupabaseClient client;

  /// The course's sync function, e.g. `em_sync`.
  final String rpc;

  bool get signedIn => client.auth.currentSession != null;
  bool _running = false;

  /// Returns true when remote data changed something on this device.
  Future<bool> sync(LocalStore store) async {
    if (!signedIn || _running) return false;
    _running = true;
    try {
      final states = [
        for (final id in store.dirty)
          if (store.progress[id] != null) store.progress[id]!.toJson(),
      ];
      final logs = [for (final e in store.log.skip(store.unsentLogFrom)) e.toJson()];
      final sentDirty = {...store.dirty};
      final sentLogTo = store.log.length;
      final sentSettings = store.settingsDirty;

      var changed = false;
      // Big first syncs go in chunks the server accepts.
      const chunk = 2000;
      Map<String, dynamic>? result;
      var i = 0, j = 0;
      do {
        final s = states.skip(i).take(chunk).toList();
        final l = logs.skip(j).take(chunk).toList();
        final last = i + chunk >= states.length && j + chunk >= logs.length;
        result = (await client.rpc(rpc, params: {
          'p_states': s,
          'p_logs': l,
          'p_settings': sentSettings && last ? store.settings.toJson() : null,
          'p_settings_at': store.settingsUpdatedAt.toIso8601String(),
          // Only the last call pulls; earlier ones are pushes.
          'p_since': last ? store.lastServerSync?.toIso8601String() : DateTime.now().toUtc().toIso8601String(),
        }) as Map)
            .cast<String, dynamic>();
        i += chunk;
        j += chunk;
      } while (i < states.length || j < logs.length);

      for (final raw in (result['states'] as List? ?? const [])) {
        final remote = CardProgress.fromJson((raw as Map).cast<String, dynamic>());
        final local = store.progress[remote.cardId];
        if (local == null || remote.updatedAt.isAfter(local.updatedAt)) {
          store.progress[remote.cardId] = remote;
          changed = true;
        }
      }
      final settings = result['settings'] as Map?;
      if (settings != null) {
        final at = DateTime.parse(settings['updatedAt'] as String);
        if (at.isAfter(store.settingsUpdatedAt) && !store.settingsDirty) {
          store.settings = LearnerSettings.fromJson((settings['data'] as Map).cast<String, dynamic>());
          store.settingsUpdatedAt = at;
          changed = true;
          await store.saveSettings(touched: false);
        }
      }

      // Only clear what was sent; ratings made during the call stay dirty.
      final sentAt = {for (final s in states) s['c'] as String: s['u'] as String};
      for (final id in sentDirty) {
        final p = store.progress[id];
        if (p != null && p.updatedAt.toUtc().toIso8601String() == sentAt[id]) store.dirty.remove(id);
      }
      store.unsentLogFrom = sentLogTo;
      if (sentSettings) store.settingsDirty = false;
      store.lastServerSync = DateTime.parse(result['serverTime'] as String);
      if (changed) await store.saveProgress();
      await store.saveMeta();
      return changed;
    } catch (_) {
      return false;
    } finally {
      _running = false;
    }
  }

  /// Deletes this learner's course data on the server.
  Future<void> deleteMyData(String rpcName) async {
    if (!signedIn) return;
    await client.rpc(rpcName);
  }
}
