import Shell from '@/components/Shell';
import { officeToday } from '@/lib/data';
import { lang, requireAdmin } from '@/lib/session';

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const { me, school } = await requireAdmin();
  const t = await officeToday(school.school_id);
  return (
    <Shell me={me} mode="office" lang={await lang()} counts={{ complaints: t?.complaints.open }}>
      {children}
    </Shell>
  );
}
