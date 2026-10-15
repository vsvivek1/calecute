import Shell from '@/components/Shell';
import { childToday } from '@/lib/data';
import { lang, requireChild } from '@/lib/session';

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { me, child } = await requireChild();
  const today = await childToday(child.id);
  return (
    <Shell me={me} mode="parent" lang={await lang()} child={child}
      counts={{ notices: today?.notices_unread.length, quizzes: today?.quizzes_open }}>
      {children}
    </Shell>
  );
}
