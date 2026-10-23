import { redirect } from 'next/navigation';
import { getCatalog, getMe, getUser } from '@/lib/data';
import Enrol from '@/components/Enrol';

export const dynamic = 'force-dynamic';

/** Change which papers you are preparing for. Progress on a dropped paper is kept. */
export default async function Papers() {
  const user = await getUser();
  if (!user) redirect('/');
  const [me, catalog] = await Promise.all([getMe(), getCatalog()]);
  return <Enrol catalog={catalog} initial={me.signedIn ? me.enrolled : []} name={user.name} />;
}
