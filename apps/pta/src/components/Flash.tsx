/** The one-line result of the last action, carried in the URL. */
export default async function Flash({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const ok = one(sp.ok);
  const err = one(sp.error);
  if (err) return <div className="flash err" role="alert">{err.slice(0, 300)}</div>;
  if (ok) return <div className="flash ok" role="status">{ok.slice(0, 300)}</div>;
  return null;
}
