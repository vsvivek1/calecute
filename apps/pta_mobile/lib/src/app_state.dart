import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api.dart';
import 'format.dart';
import 'i18n.dart';

/// Who is signed in and what they are looking at.
class AppState extends ChangeNotifier {
  AppState(this.api);

  final Api api;
  Map<String, dynamic>? me;
  String? childId;
  bool malayalam = false;
  bool teacherMode = false;

  List<Map<String, dynamic>> get children => asList(me?['children']);
  List<Map<String, dynamic>> get classes => asList(me?['classes']);
  bool get isParent => children.isNotEmpty;
  bool get isTeacher => classes.isNotEmpty;
  bool get isOfficeOnly =>
      !isParent && !isTeacher && asList(me?['staff']).isNotEmpty;

  Map<String, dynamic>? get child {
    if (children.isEmpty) return null;
    return children.firstWhere(
      (c) => c['id'] == childId,
      orElse: () => children.first,
    );
  }

  String t(String s) => tr(s, malayalam);

  Future<void> restorePrefs() async {
    final p = await SharedPreferences.getInstance();
    malayalam = p.getBool('ml') ?? false;
    childId = p.getString('child');
  }

  /// Loads the signed-in user's children, classes and roles.
  Future<void> load() async {
    me = (await api.call('whoami')) as Map<String, dynamic>;
    teacherMode = !isParent && isTeacher;
    notifyListeners();
  }

  Future<void> chooseChild(String id) async {
    childId = id;
    notifyListeners();
    (await SharedPreferences.getInstance()).setString('child', id);
  }

  Future<void> toggleLanguage() async {
    malayalam = !malayalam;
    notifyListeners();
    (await SharedPreferences.getInstance()).setBool('ml', malayalam);
  }

  void setTeacherMode(bool v) {
    teacherMode = v;
    notifyListeners();
  }

  Future<void> signOut() async {
    await api.signOut();
    me = null;
    notifyListeners();
  }
}
