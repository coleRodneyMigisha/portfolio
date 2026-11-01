import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { getSiteConfig } from '@/lib/content';

export default function NotFound() {
  const site = getSiteConfig();

  return (
    <>
      <a href="#main-content" className="skip-link glass-control">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="site-shell site-header-inner">
          <Link href="/" className="brand-mark">
            {site.name}
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="site-shell">
        <section
          className="page-section case-study-prose"
          aria-labelledby="not-found-heading"
        >
          <h1 id="not-found-heading" className="section-title mb-tight">
            404: Page not found
          </h1>
          <p>The requested page does not exist.</p>
          <p>
            <Link href="/">← Return to Home</Link>
          </p>
        </section>
      </main>
    </>
  );
}
