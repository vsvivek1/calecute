import type { Metadata } from 'next';
import './globals.css';
import { requestedView } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
  title: 'Recallio',
  description: 'Revise. Recall. Rank.',
  // Neither view should ever be indexed: one is an account page, the other an
  // admin console.
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const view = await requestedView();
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <TopBar view={view} session={session} />
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}
