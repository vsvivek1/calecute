import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/noto-sans-malayalam';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Calecutech PTA', template: '%s · Calecutech PTA' },
  description: 'Attendance, fees, homework, grades, activities and complaints: one place for parents and teachers.',
  // Every page is behind a sign-in and about a real child. None should be indexed.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f1a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
