const locations = [
  { city: "Calicut (Kozhikode)", address: "Add address here", phone: "Add phone here" },
];

export default function LocationsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Locations</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        Where to find us.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {locations.map((l) => (
          <div key={l.city} className="rounded-xl border border-black/10 p-6 dark:border-white/15">
            <h2 className="text-lg font-medium">{l.city}</h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">{l.address}</p>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">{l.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
