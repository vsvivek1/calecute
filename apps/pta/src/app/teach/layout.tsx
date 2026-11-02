import Shell from '@/components/Shell';
import { lang, requireTeacher } from '@/lib/session';

export default async function TeachLayout({ children }: { children: React.ReactNode }) {
  const me = await requireTeacher();
  return <Shell me={me} mode="teach" lang={await lang()}>{children}</Shell>;
}
