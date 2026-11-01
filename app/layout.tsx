import type { Metadata } from 'next';
import { Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { SITE_URL, getSiteConfig } from '@/lib/content';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  variable: '--font-instrument-serif',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '600'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  variable: '--font-jetbrains-mono',
});

const site = getSiteConfig();
const ogImageUrl = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: site.name,
  description: site.tagline,
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  openGraph: {
    title: site.name,
    description: site.tagline,
    url: `${SITE_URL}/`,
    siteName: site.name,
    type: 'website',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: site.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.name,
    description: site.tagline,
    images: [ogImageUrl],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

const sameAsLinks = [
  site.linkedin,
  site.github,
  site.leetcode,
  site.zindi,
].filter((url) => url.trim().length > 0);

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  description: site.tagline,
  url: SITE_URL,
  ...(site.email ? { email: site.email } : {}),
  ...(sameAsLinks.length > 0 ? { sameAs: sameAsLinks } : {}),
};

const themeInitScript = `
(function() {
  var theme = 'dark';
  try {
    var stored = window.localStorage.getItem('cole-portfolio-theme');
    if (stored === 'dark' || stored === 'light') {
      theme = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      theme = 'light';
    }
  } catch (e) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      theme = 'light';
    }
  }
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.classList.toggle('light', theme === 'light');
  var iconHref = theme === 'light' ? '/favicon-light.svg' : '/favicon-dark.svg';
  var icons = document.querySelectorAll('link[rel*="icon"]');
  for (var i = 0; i < icons.length; i++) {
    icons[i].setAttribute('href', iconHref);
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link id="site-favicon" rel="icon" type="image/svg+xml" href="/favicon-dark.svg" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
