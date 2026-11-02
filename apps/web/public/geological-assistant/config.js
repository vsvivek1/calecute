// Sales switch. Open since 15 Oct 2026: Razorpay keys are set in Supabase,
// ga-razorpay-create-order and ga-razorpay-webhook are deployed, and a test payment
// unlocked the course on 13 Oct. Set false to show "Notify me at launch" again.
window.GEO_CONFIG = {
  salesOpen: true,
  courseId: "geological-assistant",
  consoleUrl: "/geological-assistant/study",
  pricePaise: 300000
};
