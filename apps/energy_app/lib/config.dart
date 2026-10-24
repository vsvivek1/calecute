import 'package:recallio_core/recallio_core.dart';

/// Supabase project (USS). The URL and publishable key are public by design;
/// every table is behind RLS and the em_* functions check the signed-in user.
/// Override with --dart-define for another project.
const supabaseUrl = String.fromEnvironment(
  'SUPABASE_URL',
  defaultValue: 'https://vspbbwpehvenmxddgbhm.supabase.co',
);
const supabaseKey = String.fromEnvironment(
  'SUPABASE_ANON_KEY',
  defaultValue: 'sb_publishable_8yQLCPZV55NwBKI5ybeRAg__UggFFK_',
);

final energyCourse = CourseConfig(
  id: 'energy_manager',
  appName: 'Energy Auditor',
  tagline: 'BEE National Certification Exam for Energy Managers and Energy Auditors — '
      'all four papers, taught from the BEE guide books.',
  sections: const [
    CourseSection(id: 1, name: 'Paper 1 · General aspects of energy management and energy audit', short: 'Paper 1'),
    CourseSection(id: 2, name: 'Paper 2 · Energy efficiency in thermal utilities', short: 'Paper 2'),
    CourseSection(id: 3, name: 'Paper 3 · Energy efficiency in electrical utilities', short: 'Paper 3'),
    CourseSection(id: 4, name: 'Paper 4 · Energy performance assessment for equipment and utility systems', short: 'Paper 4'),
  ],
  // Not yet announced: estimated from the 26th NCE schedule (Sept). Update
  // when BEE publishes the 27th exam dates on nceexam.in.
  exam: ExamInfo(
    name: 'BEE National Certification Exam',
    date: DateTime(2027, 9, 24),
    official: false,
    source: 'estimated from the 26th NCE prospectus (nceexam.in)',
    checkedOn: DateTime(2026, 10, 22),
  ),
  syncRpc: 'em_sync',
  deleteRpc: 'em_delete_my_data',
  androidRedirect: 'com.calecutech.energyauditor://login-callback',
  privacyUrl: 'https://calecutech.com/apps/recallio-energy-manager/privacy',
  termsUrl: 'https://calecutech.com/apps/recallio-energy-manager/terms',
  deleteAccountUrl: 'https://calecutech.com/apps/recallio-energy-manager/delete-account',
  inviteUrl: 'https://calecutech.com/rewards?app=recallio-energy-manager',
  // Each paper is a one-time Play product at Rs 1,000, paid at checkout. A
  // coupon picks the paper_N_offPP product (PP% off). The first 20 cards of
  // every paper are free.
  pricing: const CoursePricing(
    freeCardsPerSection: 20,
    productIds: {1: 'paper_1', 2: 'paper_2', 3: 'paper_3', 4: 'paper_4'},
    priceLabel: '₹1,000',
    myPapersRpc: 'em_my_papers',
    redeemRpc: 'em_redeem_coupon',
    verifyFunction: 'em-play-verify',
    applyCouponRpc: 'em_apply_coupon',
  ),
  examChecklist: const [
    'Admit card and photo ID',
    'Calculator (non-programmable), pens, pencil, eraser',
    'Water bottle',
    'Reach the centre 45 minutes early',
  ],
);
