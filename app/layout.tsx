import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Next.js Static Export Starter',
  description: 'Minimal Next.js TypeScript project configured for static export.',
  openGraph: {
    title: 'Next.js Static Export Starter',
    description: 'Minimal Next.js TypeScript project configured for static export.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next.js Static Export Starter',
    description: 'Minimal Next.js TypeScript project configured for static export.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
