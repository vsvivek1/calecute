const services = [
  { title: "Consulting", desc: "Strategy and technical advisory for your business." },
  { title: "Implementation", desc: "End-to-end build and deployment of solutions." },
  { title: "Support", desc: "Ongoing maintenance and customer support." },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Services</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        What we offer.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {services.map((s) => (
          <div key={s.title} className="rounded-xl border border-black/10 p-6 dark:border-white/15">
            <h2 className="text-lg font-medium">{s.title}</h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
