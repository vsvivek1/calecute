import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getUser } from '@/lib/data';
import { referralEnabled } from '@/lib/referral';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
  title: 'Recallio Energy Manager',
  description:
    'A daily study plan for the BEE Certified Energy Manager and Energy Auditor exam. Enrol in your papers; Recallio decides what to study and when to revise.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = { themeColor: '#0b3d2e', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="en">
      <body>
        <TopBar user={user} invite={referralEnabled()} />
        <main className="wrap">{children}</main>
        <footer className="foot">
          Recallio by <a href="https://calecutech.com">Calecute Technologies</a>
        </footer>
      </body>
    </html>
  );
}
