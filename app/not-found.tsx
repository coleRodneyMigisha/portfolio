import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { getSiteConfig } from '@/lib/content';

export default function NotFound() {
  const site = getSiteConfig();

  return (
    <>
      <header className="site-header">
        <div className="site-shell site-header-inner">
          <Link href="/" className="brand-mark">
            {site.name}
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="site-shell">
        <section className="page-section case-study-prose">
          <h1 className="section-title mb-tight">404: Page not found</h1>
          <p>The requested page does not exist.</p>
          <p>
            <Link href="/">← Return to Home</Link>
          </p>
        </section>
      </main>
    </>
  );
}
