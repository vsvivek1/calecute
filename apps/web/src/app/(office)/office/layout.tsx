import Shell from "@/office/components/Shell";
import { logoUrl } from "@/office/data";
import { requireOfficer } from "@/office/session";

export const dynamic = "force-dynamic";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const officer = await requireOfficer();
  const logo = await logoUrl(officer.settings.logo_path);
  return (
    <Shell officer={officer} logo={logo}>
      {children}
    </Shell>
  );
}
