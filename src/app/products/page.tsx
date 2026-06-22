const products = [
  { title: "Product One", desc: "Short description of product one." },
  { title: "Product Two", desc: "Short description of product two." },
  { title: "Product Three", desc: "Short description of product three." },
];

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Products</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        What we sell.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {products.map((p) => (
          <div key={p.title} className="rounded-xl border border-black/10 p-6 dark:border-white/15">
            <h2 className="text-lg font-medium">{p.title}</h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
