import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'PMP Exam Prep by Calecutech: 10 questions at a time, planned to your exam date',
  description:
    'PMP prep that decides what you study: short 10-question sittings at the times you choose, spaced repetition that works back from your exam date, a weekly report and timed mocks. Original questions reviewed by a PMP. One-time $39.',
  metadataBase: new URL(process.env.PUBLIC_SITE_ORIGIN ?? 'https://pmp.calecutech.com'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#13315c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body>
        <AppShell />
        <Header />
        {children}
      </body>
    </html>
  );
}
