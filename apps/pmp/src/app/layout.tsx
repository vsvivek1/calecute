import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'PMP Exam Prep by Calecutech: mock exams, spaced review, weak-area drills',
  description:
    'Pass the PMP with original, PMP-certified-reviewed practice questions, full-length timed mock exams, spaced repetition and drills that target your weakest areas. One-time $39.',
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
        <Header />
        {children}
      </body>
    </html>
  );
}
