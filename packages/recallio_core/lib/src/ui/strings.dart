import 'package:flutter/widgets.dart';

/// UI labels in English and Malayalam. Course content keeps its own
/// language; only the app's own words switch here.
class T {
  const T(this.lang);
  final String lang;

  static T of(BuildContext context) => TScope.maybeOf(context) ?? const T('en');

  bool get ml => lang == 'ml';
  String _(String en, String ml) => this.ml ? ml : en;

  String get today => _('Today', 'ഇന്ന്');
  String get showAnswer => _('Show answer', 'ഉത്തരം കാണുക');
  String get thinkFirst => _('Think of the answer first…', 'ആദ്യം ഉത്തരം മനസ്സിൽ ആലോചിക്കൂ…');
  String get nextStep => _('Next step', 'അടുത്ത ഘട്ടം');
  String get explain => _('Explain', 'വിശദീകരണം');
  String get hideExplain => _('Hide explanation', 'വിശദീകരണം മറയ്ക്കുക');
  String get continueLabel => _('Continue', 'തുടരുക');
  String get why => _('Why', 'എന്തുകൊണ്ട്');
  String get answer => _('Answer', 'ഉത്തരം');
  String get simpler => _("Here's the simple version", 'ലളിതമായി പറഞ്ഞാൽ');
  String get comesBack => _('This card comes back soon.', 'ഈ കാർഡ് വൈകാതെ വീണ്ടും വരും.');
  String get solveOnPaper => _('Solve it on paper first.', 'ആദ്യം പേപ്പറിൽ ചെയ്തു നോക്കൂ.');
  String get showWorking => _('Show the working', 'ചെയ്യുന്ന വിധം കാണുക');
  String get quickCheck => _('Quick check', 'ചെറിയൊരു പരിശോധന');
  String get toughOne => _('Tough one — read the reason first', 'പ്രയാസമുള്ളത് — ആദ്യം കാരണം വായിക്കൂ');
  String get summary => _('Summary', 'ചുരുക്കം');
  String get keyPoints => _('Key points', 'പ്രധാന കാര്യങ്ങൾ');
  String get sittingSaved => _('Your sitting is saved — come back anytime.', 'നിങ്ങളുടെ പഠനം സേവ് ചെയ്തു — എപ്പോൾ വേണമെങ്കിലും തിരികെ വരാം.');
  String steps(int n) => _('$n steps', '$n ഘട്ടങ്ങൾ');
  String stepOf(int i, int n) => _('Step $i of $n', 'ഘട്ടം $i / $n');
  String cardOf(int i, int n) => _('$i of $n', '$i / $n');
  String quota(int done, int total) => _('Today $done/$total', 'ഇന്ന് $done/$total');
  String minLeft(int m) => _('about $m min left', 'ഏകദേശം $m മിനിറ്റ് ബാക്കി');
  String next(String t) => _('next $t', 'അടുത്തത് $t');
  String daysLeft(int d) => _('$d days to the exam', 'പരീക്ഷയ്ക്ക് $d ദിവസം');

  String get startSitting => _('Start', 'തുടങ്ങാം');
  String get startNow => _('Start now', 'ഇപ്പോൾ തുടങ്ങാം');
  String readyTitle(int n) => _('$n cards ready', '$n കാർഡുകൾ തയ്യാർ');
  String readyBody(int min) => _('About $min minutes. One card at a time.', 'ഏകദേശം $min മിനിറ്റ്. ഒരു സമയം ഒരു കാർഡ്.');
  String get welcomeBack => _("Welcome back! Let's start with 5 quick ones.", 'തിരികെ സ്വാഗതം! 5 എണ്ണം കൊണ്ട് തുടങ്ങാം.');
  String get sittingDone => _('Sitting done', 'ഈ സെറ്റ് കഴിഞ്ഞു');
  String nextSittingAt(String t) => _('Next sitting at $t.', 'അടുത്ത സെറ്റ് $t-ന്.');
  String get quotaComplete => _('Quota complete 🎉', 'ഇന്നത്തെ പഠനം പൂർത്തിയായി 🎉');
  String get quotaCompleteBody => _('Spacing is what makes it stick. See you tomorrow.', 'ഇടവേളകളാണ് ഓർമ്മ ഉറപ്പിക്കുന്നത്. നാളെ കാണാം.');
  String wantMore(String t) => _('Want more? Next set opens at $t.', 'കൂടുതൽ വേണോ? അടുത്ത സെറ്റ് $t-ന് തുറക്കും.');
  String get bonusOpen => _('A bonus set is open now.', 'ഒരു ബോണസ് സെറ്റ് ഇപ്പോൾ തുറന്നിട്ടുണ്ട്.');
  String get startBonus => _('Start bonus set', 'ബോണസ് സെറ്റ് തുടങ്ങാം');
  String get revisionMode => _('Revision weeks: mostly reviews, only key new cards.', 'റിവിഷൻ ആഴ്ചകൾ: കൂടുതലും ആവർത്തനം, പ്രധാന പുതിയ കാർഡുകൾ മാത്രം.');
  String get cramMode => _('Cram mode: tough cards, topic summaries and key facts. Sittings of 10 with short breaks.', 'ക്രാം മോഡ്: പ്രയാസമുള്ള കാർഡുകൾ, ചുരുക്കങ്ങൾ, പ്രധാന വസ്തുതകൾ. 10 വീതം, ചെറിയ ഇടവേളകളോടെ.');
  String get sleepNow => _('Sleep well tonight — sleep locks in today\'s learning.', 'ഇന്ന് നന്നായി ഉറങ്ങൂ — ഉറക്കമാണ് പഠിച്ചത് ഉറപ്പിക്കുന്നത്.');
  String get examMorning => _('Exam day. You are ready.', 'ഇന്ന് പരീക്ഷ. നിങ്ങൾ തയ്യാറാണ്.');
  String get afterExam => _('How did it go?', 'പരീക്ഷ എങ്ങനെയുണ്ടായിരുന്നു?');
  String get afterExamBody => _('Set the next exam date in your profile to keep going.', 'തുടരാൻ പ്രൊഫൈലിൽ അടുത്ത പരീക്ഷാ തീയതി നൽകൂ.');
  String get nothingEnrolled => _('Pick at least one paper in your profile.', 'പ്രൊഫൈലിൽ ഒരു പേപ്പറെങ്കിലും തിരഞ്ഞെടുക്കൂ.');
  String get behindPlan => _('Today needs more time than you set. Adding a study time helps.', 'ഇന്നത്തേക്ക് നിങ്ങൾ നൽകിയതിലും കൂടുതൽ സമയം വേണം. ഒരു പഠനസമയം കൂടി ചേർക്കാം.');

  String get weeklyReport => _('Your week', 'ഈ ആഴ്ച');
  String get seeReport => _('See report', 'റിപ്പോർട്ട് കാണുക');
  String get gotIt => _('Got it', 'ശരി');
  String daysStudied(int d) => _('Studied $d of 7 days', '7-ൽ $d ദിവസം പഠിച്ചു');
  String minutesCards(int m, int c) => _('$m minutes · $c cards', '$m മിനിറ്റ് · $c കാർഡുകൾ');
  String readiness(int band) => _('Readiness: about $band%', 'തയ്യാറെടുപ്പ്: ഏകദേശം $band%');
  String get becameEasy => _('Became easy ✅', 'എളുപ്പമായി ✅');
  String get stillTough => _('Still tough ⚠️ — we\'ll push these again', 'ഇപ്പോഴും പ്രയാസം ⚠️ — ഇവ വീണ്ടും വരും');
  String slipped(int n) => _('Slipped ↩️: $n cards forgotten again', 'മറന്നുപോയവ ↩️: $n കാർഡുകൾ');
  String simpleMissed(int n) => _('Marked simple but missed later: $n', '"എളുപ്പം" എന്ന് മാർക്ക് ചെയ്ത് പിന്നീട് തെറ്റിയത്: $n');
  String teachBack(String topic) => _('Try explaining "$topic" to someone — explaining is strong revision.', '"$topic" മറ്റൊരാൾക്ക് വിശദീകരിച്ചു നോക്കൂ — അതാണ് മികച്ച റിവിഷൻ.');
  String get noneYet => _('None yet', 'ഇതുവരെ ഇല്ല');

  String get profile => _('Profile', 'പ്രൊഫൈൽ');
  String get examDate => _('Exam date', 'പരീക്ഷാ തീയതി');
  String get estimated => _('estimated', 'ഏകദേശം');
  String get official => _('official', 'ഔദ്യോഗികം');
  String get studyTimes => _('Study times', 'പഠന സമയങ്ങൾ');
  String get minutesPerDay => _('Minutes a day', 'ദിവസം മിനിറ്റ്');
  String get papers => _('Papers', 'പേപ്പറുകൾ');
  String get quietHours => _('Quiet hours', 'നിശ്ശബ്ദ സമയം');
  String get language => _('Language', 'ഭാഷ');
  String get privacy => _('Privacy policy', 'സ്വകാര്യതാ നയം');
  String get terms => _('Terms', 'നിബന്ധനകൾ');
  String get deleteData => _('Delete my data', 'എന്റെ ഡാറ്റ ഇല്ലാതാക്കുക');
  String get deleteConfirm => _('This removes all your progress on this device and in your account. It cannot be undone.', 'ഈ ഉപകരണത്തിലെയും അക്കൗണ്ടിലെയും എല്ലാ പുരോഗതിയും നീക്കം ചെയ്യും. ഇത് തിരിച്ചെടുക്കാനാവില്ല.');
  String get cancel => _('Cancel', 'വേണ്ട');
  String get delete => _('Delete', 'ഇല്ലാതാക്കുക');
  String get signIn => _('Sign in with Google', 'Google ഉപയോഗിച്ച് സൈൻ ഇൻ');
  String get signOut => _('Sign out', 'സൈൻ ഔട്ട്');
  String get signedInAs => _('Signed in as', 'സൈൻ ഇൻ ചെയ്തത്');
  String get notSignedIn => _('Not signed in. Progress stays on this device.', 'സൈൻ ഇൻ ചെയ്തിട്ടില്ല. പുരോഗതി ഈ ഉപകരണത്തിൽ മാത്രം.');
  String get add => _('Add', 'ചേർക്കുക');
  String get save => _('Save', 'സേവ്');
  String get invite => _('Invite', 'ക്ഷണിക്കുക');
  String get inviteTitle => _('Invite friends & get rewards', 'സുഹൃത്തുക്കളെ ക്ഷണിക്കൂ, റിവാർഡുകൾ നേടൂ');

  // Onboarding
  String get chooseLanguage => _('Choose your language', 'ഭാഷ തിരഞ്ഞെടുക്കൂ');
  String get next1 => _('Next', 'അടുത്തത്');
  String get back => _('Back', 'പിന്നോട്ട്');
  String get skip => _('Skip for now', 'ഇപ്പോൾ വേണ്ട');
  String get signInWhy => _('Sign in to keep your progress safe and use it on phone and web.', 'പുരോഗതി സുരക്ഷിതമാക്കാനും ഫോണിലും വെബിലും ഉപയോഗിക്കാനും സൈൻ ഇൻ ചെയ്യൂ.');
  String get whenExam => _('When is your exam?', 'പരീക്ഷ എപ്പോഴാണ്?');
  String examSource(String s) => _('Source: $s', 'ഉറവിടം: $s');
  String get change => _('Change', 'മാറ്റുക');
  String get whichPapers => _('Which papers are you preparing for?', 'ഏതെല്ലാം പേപ്പറുകൾക്കാണ് തയ്യാറെടുക്കുന്നത്?');
  String get whenStudy => _('When can you study?', 'എപ്പോഴാണ് പഠിക്കാൻ കഴിയുക?');
  String get whenStudyHint => _('We will remind you at these times. Each sitting is about 6 minutes.', 'ഈ സമയങ്ങളിൽ ഓർമ്മിപ്പിക്കും. ഓരോ സെറ്റും ഏകദേശം 6 മിനിറ്റ്.');
  String get allowAlerts => _('Allow study alerts', 'പഠന അറിയിപ്പുകൾ അനുവദിക്കുക');
  String get allowAlertsHint => _('A heads-up at each study time and one key fact at noon. Nothing at night.', 'ഓരോ പഠനസമയത്തും ഒരു അറിയിപ്പ്, ഉച്ചയ്ക്ക് ഒരു പ്രധാന വസ്തുത. രാത്രി ഒന്നുമില്ല.');
  String get batteryHint => _('On Xiaomi, Vivo, Oppo and similar phones, set battery to "No restrictions" for this app so alerts arrive on time.', 'Xiaomi, Vivo, Oppo പോലുള്ള ഫോണുകളിൽ അറിയിപ്പുകൾ സമയത്ത് കിട്ടാൻ ഈ ആപ്പിന് ബാറ്ററി "No restrictions" ആക്കുക.');
  String get letsGo => _("Let's start", 'തുടങ്ങാം');
  String get howItWorks => _('The app plans every day for you: a few cards at a time, at your study times, until the exam.', 'ഓരോ ദിവസത്തെയും പഠനം ആപ്പ് തീരുമാനിക്കും: പഠനസമയങ്ങളിൽ കുറച്ച് കാർഡുകൾ വീതം, പരീക്ഷ വരെ.');

  // Paid papers
  String get papersTitle => _('Your papers', 'നിങ്ങളുടെ പേപ്പറുകൾ');
  String get owned => _('Unlocked', 'തുറന്നു');
  String freeCards(int n) => _('$n free cards', '$n സൗജന്യ കാർഡുകൾ');
  String freeLeftLine(int n) => n == 0
      ? _('Free cards done.', 'സൗജന്യ കാർഡുകൾ കഴിഞ്ഞു.')
      : _('$n free cards left.', 'ഇനി $n സൗജന്യ കാർഡുകൾ.');
  String unlockTitle(String paper) => _('Unlock $paper', '$paper തുറക്കാം');
  String unlockBody(int free) => _(
      'You can try the first $free cards of each paper free. Unlock a paper once to study all of it until your exam, with revision and cram mode.',
      'ഓരോ പേപ്പറിലെയും ആദ്യ $free കാർഡുകൾ സൗജന്യമാണ്. ഒരു തവണ പേപ്പർ തുറന്നാൽ പരീക്ഷ വരെ മുഴുവനും, റിവിഷനും ക്രാം മോഡും ഉൾപ്പെടെ പഠിക്കാം.');
  String buyFor(String price) => _('Unlock for $price', '$price-ന് തുറക്കുക');
  String get haveCoupon => _('I have a coupon code', 'എനിക്ക് കൂപ്പൺ കോഡ് ഉണ്ട്');
  String get couponCode => _('Coupon code', 'കൂപ്പൺ കോഡ്');
  String get apply => _('Apply', 'ഉപയോഗിക്കുക');
  String couponOff(int pct, String code) => _('$code: $pct% off', '$code: $pct% കിഴിവ്');
  String get removeCoupon => _('Remove', 'മാറ്റുക');
  String get couponDone => _('Coupon accepted. Papers unlocked.', 'കൂപ്പൺ സ്വീകരിച്ചു. പേപ്പറുകൾ തുറന്നു.');
  String get signInToUnlock => _('Sign in first, so the paper stays with your account on phone and web.', 'ആദ്യം സൈൻ ഇൻ ചെയ്യൂ, പേപ്പർ ഫോണിലും വെബിലും നിങ്ങളുടെ അക്കൗണ്ടിൽ ഉണ്ടാകും.');
  String get buyOnAndroid => _('Checkout works in the Android app through Google Play. Papers you buy there open here too.', 'Google Play വഴി Android ആപ്പിലാണ് പണമടയ്ക്കേണ്ടത്. അവിടെ വാങ്ങുന്ന പേപ്പറുകൾ ഇവിടെയും തുറക്കും.');
  String get cartTitle => _('Your cart', 'നിങ്ങളുടെ കാർട്ട്');
  String get addToCart => _('Add to cart', 'കാർട്ടിൽ ചേർക്കുക');
  String openCart(int n) => n == 0 ? _('Buy papers', 'പേപ്പറുകൾ വാങ്ങുക') : _('Cart ($n)', 'കാർട്ട് ($n)');
  String get cartEmpty => _('Tick the papers you want to unlock.', 'തുറക്കേണ്ട പേപ്പറുകൾ തിരഞ്ഞെടുക്കൂ.');
  String get total => _('Total', 'ആകെ');
  String checkoutFor(String total) => _('Checkout · $total', 'പണമടയ്ക്കുക · $total');
  String get checkoutNote => _('Each paper is paid through Google Play and opens as soon as its payment is confirmed.', 'ഓരോ പേപ്പറും Google Play വഴി പണമടച്ചാൽ ഉടൻ തുറക്കും.');
  String get working => _('Working…', 'ശ്രമിക്കുന്നു…');
}

class TScope extends InheritedWidget {
  const TScope({super.key, required this.t, required super.child});
  final T t;

  static T? maybeOf(BuildContext context) => context.dependOnInheritedWidgetOfExactType<TScope>()?.t;

  @override
  bool updateShouldNotify(TScope old) => old.t.lang != t.lang;
}
