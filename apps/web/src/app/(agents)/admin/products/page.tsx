/**
 * /admin/products — API keys per product.
 *
 * SUPER_ADMIN only. Each Calecute app talks to this API with a product key:
 * a `client` key ships inside the app, a `server` key stays on the app's
 * backend. Keys are minted here; the plaintext is shown once in the result
 * message and never again, because only its hash is stored.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { api, getPublicProducts, getReportCatalogue } from "@/lib/api/client";
import { AdminNav } from "@/components/agents/AdminNav";
import { ActionForm } from "@/components/agents/ActionForm";
import { mintProductApiKey, revokeProductApiKey } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Product API keys",
  robots: { index: false, follow: false },
};

interface ProductApiKey {
  id: number;
  productId: number;
  kind: "client" | "server";
  label: string;
  createdAt: string;
  revokedAt: string | null;
}

export default async function AdminProductsPage() {
  const session = await requireRole("/admin/products", ["SUPER_ADMIN"]);

  const [catalogue, products] = await Promise.all([
    getReportCatalogue(session.token),
    getPublicProducts(),
  ]);

  const list = products.data ?? [];
  const keysByProduct = new Map<number, ProductApiKey[]>();
  await Promise.all(
    list.map(async (product) => {
      const keys = await api.get<{ data: ProductApiKey[] }>(
        `/admin/products/${product.id}/api-keys`,
        { token: session.token },
      );
      keysByProduct.set(product.id, keys.data ?? []);
    }),
  );

  return (
    <div className="app-shell">
      <AdminNav
        email={session.me.user?.email ?? ""}
        role={session.me.user?.role ?? ""}
        scope="all districts"
        tabs={(catalogue.data ?? [])
          .filter((r): r is { slug: string; title: string } => Boolean(r.slug && r.title))
          .map((r) => ({ slug: r.slug, title: r.title }))}
      />

      <main className="admin-wrap">
        <h1>Product API keys</h1>
        <p className="chips-note">
          A <strong>client</strong> key ships inside the app. A{" "}
          <strong>server</strong> key stays on the app&apos;s backend and may
          also record payments. A new key is shown once, in the message under
          the form; copy it straight away.
        </p>

        {list.map((product) => {
          const keys = keysByProduct.get(product.id) ?? [];
          const active = keys.filter((k) => !k.revokedAt);
          return (
            <section key={product.id}>
              <h2>
                {product.nameEn} <small>({product.slug})</small>
              </h2>

              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Label</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.length === 0 && (
                      <tr>
                        <td colSpan={4}>No active keys.</td>
                      </tr>
                    )}
                    {active.map((key) => (
                      <tr key={key.id}>
                        <td>{key.kind}</td>
                        <td>{key.label}</td>
                        <td>{new Date(key.createdAt).toLocaleDateString("en-IN")}</td>
                        <td>
                          <ActionForm
                            action={revokeProductApiKey}
                            label="Revoke"
                            hidden={{ productId: product.id, keyId: key.id }}
                            variant="secondary"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel">
                <ActionForm
                  action={mintProductApiKey}
                  label="Mint key"
                  hidden={{ productId: product.id }}
                >
                  <div className="field">
                    <label htmlFor={`kind-${product.id}`}>Type</label>
                    <select id={`kind-${product.id}`} name="kind" defaultValue="server">
                      <option value="server">server (backend)</option>
                      <option value="client">client (inside the app)</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`label-${product.id}`}>Label</label>
                    <input
                      id={`label-${product.id}`}
                      name="label"
                      required
                      placeholder="e.g. Vercel production"
                    />
                  </div>
                </ActionForm>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
