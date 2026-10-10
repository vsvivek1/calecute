// Sales switch. Keep salesOpen=false until: Razorpay keys are set in Supabase,
// razorpay-create-order and razorpay-webhook are deployed, the course row is seeded,
// and one test payment has unlocked the course. Then set true and redeploy.
window.GEO_CONFIG = {
  salesOpen: false,
  courseId: "geological-assistant",
  consoleUrl: "https://user.recallio.calecutech.com/",
  pricePaise: 300000
};
