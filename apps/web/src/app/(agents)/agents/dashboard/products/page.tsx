/**
 * /agents/dashboard/products — what an agent may sell.
 *
 * Two lists, and the distinction matters. "Assigned to you" is what an
 * administrator has actually given this agent, and only those carry sales
 * material. The rest of the catalogue is shown below it so a newly approved
 * agent can see the range while assignment is still pending — otherwise the
 * page reads as "we have nothing", which is not true.
 *
 * Sales material is linked, not embedded: these are brochures and price lists
 * an agent forwards on WhatsApp, and a link is what forwards.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { getAgentProducts, getCatalogue } from "@/lib/api/client";
import { AgentNav } from "@/components/agents/AgentNav";
import { company } from "@/lib/agents/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function ProductsPage() {
  const session = await requireRole("/agents/dashboard/products", ["AGENT"]);

  const [assigned, catalogue] = await Promise.all([
    getAgentProducts(session.token),
    getCatalogue(session.token),
  ]);

  const mine = assigned.data ?? [];
  const mineIds = new Set(mine.map((p) => p.id));
  const rest = (catalogue.data ?? []).filter(
    (p) => p.active && !mineIds.has(p.id),
  );

  return (
    <div className="app-shell">
      <AgentNav email={session.me.user?.email ?? ""} current="products" />

      <main className="wrap" style={{ paddingTop: "1.5rem" }}>
        <h1>Products</h1>

        <section>
          <h2>Assigned to you</h2>
          {mine.length === 0 ? (
            <p className="chips-note">
              Nothing assigned yet. An administrator assigns products once your
              application is approved, and the sales material appears here.
            </p>
          ) : (
            <ul className="stack-list">
              {mine.map((product) => (
                <li key={product.id} className="product-item">
                  <strong>{product.nameEn}</strong>
                  {product.summaryEn && <p>{product.summaryEn}</p>}
                  {(product.assets?.length ?? 0) > 0 && (
                    <p className="chips-note">
                      {product.assets?.map((asset) => (
                        <a
                          key={asset.id}
                          href={asset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginRight: "1rem" }}
                        >
                          {asset.title}
                        </a>
                      ))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {rest.length > 0 && (
          <section>
            <h2>Everything we make</h2>
            <p className="chips-note">
              The full range. Ask an administrator to assign any of these to you.
            </p>
            <ul className="stack-list">
              {rest.map((product) => (
                <li key={product.id} className="product-item">
                  <strong>{product.nameEn}</strong>
                  {product.summaryEn && <p>{product.summaryEn}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <p className="chips-note">
            New products and price changes are announced on the WhatsApp
            channel.{" "}
            <a
              href={company.whatsappChannel}
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow it here
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
