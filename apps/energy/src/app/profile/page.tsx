import { redirect } from 'next/navigation';
import { getCatalog, getFeed, getMe, getUser } from '@/lib/data';
import Profile from '@/components/Profile';

export const dynamic = 'force-dynamic';

/** The profile: the only place for settings. Studying itself happens in the feed. */
export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect('/');
  const [me, catalog] = await Promise.all([getMe(), getCatalog()]);
  const enrolled = me.signedIn ? me.enrolled : [];
  if (enrolled.length === 0) redirect('/');
  const feed = await getFeed();
  return (
    <Profile
      user={user}
      exam={feed.exam}
      settings={feed.settings}
      papers={catalog.filter((p) => enrolled.includes(p.id))}
    />
  );
}
