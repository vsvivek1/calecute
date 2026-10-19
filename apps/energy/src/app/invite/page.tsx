import { redirect } from 'next/navigation';
import { getUser } from '@/lib/data';
import { ensureMember } from '@/lib/referral';
import CopyLink from '@/components/CopyLink';

export const dynamic = 'force-dynamic';

const rupees = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** "Invite friends & get rewards": the shared Calecute referral scheme. */
export default async function Invite() {
  const user = await getUser();
  if (!user) redirect('/');
  const m = await ensureMember(user);

  if (!m) {
    return (
      <div className="card">
        <h1>Invite friends &amp; get rewards</h1>
        <p className="sub">Invites are not switched on yet. Please check back soon.</p>
      </div>
    );
  }

  const s = m.stats;
  return (
    <>
      <h1>Invite friends &amp; get rewards</h1>
      <p className="sub">
        {m.product.isFree
          ? 'Earn a diamond for every friend who joins with your link.'
          : `Earn ${m.product.userRateBps / 100}% of every fee your friends pay.`}
      </p>
      <div className="card invite">
        <div>
          <p className="label">Your code</p>
          <p className="code">{m.code}</p>
          <CopyLink link={m.link} />
          <p style={{ marginTop: 12 }}>
            <a className="btn btn-primary" href={m.whatsappShareUrl} target="_blank" rel="noreferrer">
              Share on WhatsApp
            </a>
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.qrUrl} alt="QR code for your invite link" width={160} height={160} />
      </div>
      <div className="stats">
        <div className="card mini"><p className="big">{s.friendsJoined}</p><p>friends joined</p></div>
        <div className="card mini"><p className="big">{s.payingFriends}</p><p>paying friends</p></div>
        <div className="card mini"><p className="big">💎 {s.diamonds}</p><p>diamonds</p></div>
        <div className="card mini"><p className="big">{rupees(s.earnings.lifetimePaise)}</p><p>earned so far</p></div>
      </div>
      <p className="note">
        See everyone&apos;s rewards on the <a href="https://calecutech.com/rewards">public leaderboard</a>.
        Terms and payouts are handled by Calecute Technologies.
      </p>
    </>
  );
}
