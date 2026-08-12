/** Shared service and pricing definitions, rendered on the home and services pages. */

export const services = [
  {
    title: "Custom Web Development",
    desc: "Marketing sites, customer portals, and e-commerce storefronts built, deployed, and maintained end to end.",
    emoji: "🌐",
    color: "bg-blue-100 dark:bg-blue-900/30",
    details: [
      "Responsive marketing and product sites",
      "Customer portals and internal dashboards",
      "E-commerce storefronts with payment gateway integration",
      "Ongoing maintenance, hosting, and support",
    ],
  },
  {
    title: "Mobile App Development",
    desc: "Cross-platform iOS and Android apps, from first release through store submission and ongoing updates.",
    emoji: "📱",
    color: "bg-pink-100 dark:bg-pink-900/30",
    details: [
      "Cross-platform iOS and Android applications",
      "Seller and marketplace apps for vertical businesses",
      "App Store and Play Store submission",
      "Release management and version updates",
    ],
  },
  {
    title: "SaaS Product Development",
    desc: "Multi-tenant subscription products with billing, user management, and analytics — the way we built DailyDo.",
    emoji: "🚀",
    color: "bg-purple-100 dark:bg-purple-900/30",
    details: [
      "Multi-tenant architecture and organisation management",
      "Subscription billing and plan management",
      "Authentication, roles, and permissions",
      "Usage analytics and reporting",
    ],
  },
  {
    title: "Backend & API Systems",
    desc: "APIs, integrations, payment gateways, and cloud infrastructure designed to scale with your traffic.",
    emoji: "⚙️",
    color: "bg-teal-100 dark:bg-teal-900/30",
    details: [
      "REST and real-time APIs",
      "Third-party and payment gateway integrations",
      "Database design and migrations",
      "Cloud deployment, monitoring, and scaling",
    ],
  },
];

export const pricingModels = [
  {
    title: "Fixed-price projects",
    desc: "A defined scope, a written quote, and milestone-based invoices. Best for launches with clear requirements.",
    detail:
      "We agree the deliverables and total price in writing before starting. Invoices are raised at agreed milestones — typically on kickoff, on delivery of a working build, and on final handover.",
  },
  {
    title: "Monthly SaaS subscriptions",
    desc: "Recurring per-user or per-organisation plans for our own products, billed monthly and cancellable at any time.",
    detail:
      "Products such as DailyDo are sold on recurring monthly plans. Subscriptions renew automatically until cancelled, and customers can cancel from their account at any time before the next renewal.",
  },
  {
    title: "Hourly development contracts",
    desc: "An agreed hourly rate with tracked time, invoiced monthly. Best for ongoing work and evolving scope.",
    detail:
      "We agree an hourly rate and an approximate monthly ceiling. Time is tracked and reported, and invoices are raised monthly in arrears against the hours actually worked.",
  },
];
