import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import TopNav from '@/components/TopNav';
import TokenCloud from '@/components/TokenCloud';
import WorkBand from '@/components/WorkBand';
import ScrollReveal from '@/components/ScrollReveal';
import {
  getSiteConfig,
  getVisibleSiteLinks,
  getStackConfig,
  getAboutContent,
  getVisibleItemsByKind,
} from '@/lib/content';

export default function HomePage() {
  const site = getSiteConfig();
  const visibleSiteLinks = getVisibleSiteLinks(site);
  const about = getAboutContent();
  const researchItems = getVisibleItemsByKind('research');
  const projectItems = getVisibleItemsByKind('project');
  const stack = getStackConfig();

  const cvHref = site.cv.trim();

  return (
    <>
      <ScrollReveal />
      <header className="site-header">
        <div className="site-shell site-header-inner">
          <Link href="/" className="brand-mark">
            {site.name}
          </Link>
          <TopNav />
          <ThemeToggle />
        </div>
      </header>

      <main>
        {/* 1. Landing (Full-viewport screen — no scroll reveal applied) */}
        <section id="landing" className="landing-section" aria-labelledby="hero-heading">
          <TokenCloud />
          <div className="landing-content">
            <h1 id="hero-heading" className="hero-name">
              {site.name}
            </h1>
            <p className="hero-tagline">{site.tagline}</p>
          </div>
        </section>

        {/* 2. About Me */}
        <div className="site-shell">
          <section id="about" className="page-section" aria-labelledby="about-heading">
            <div className="section-header" data-reveal>
              <h2 id="about-heading" className="section-title">
                About Me
              </h2>
            </div>

            <div className="about-grid">
              <div className="case-study-prose">
                {about.aboutParagraphs.map((paragraph, index) => (
                  <p key={index} data-reveal data-reveal-index={index}>
                    {paragraph}
                  </p>
                ))}
              </div>

              <div>
                <div className="about-subsection">
                  <h3 className="about-subsection-title" data-reveal>
                    Experience
                  </h3>
                  <ul className="clean-list">
                    {about.experience.map((entry, index) => (
                      <li key={entry} data-reveal data-reveal-index={index}>
                        {entry}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="about-subsection">
                  <h3 className="about-subsection-title" data-reveal>
                    Achievements
                  </h3>
                  <ul className="clean-list">
                    {about.achievements.map((entry, index) => (
                      <li key={entry} data-reveal data-reveal-index={index}>
                        {entry}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="about-subsection">
                  <h3 className="about-subsection-title" data-reveal>
                    Education
                  </h3>
                  <ul className="clean-list">
                    {about.education.map((entry, index) => (
                      <li key={entry} data-reveal data-reveal-index={index}>
                        {entry}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 3. Research band (Full-width outside content container, drifts right to left) */}
        <WorkBand
          id="research"
          title="Research"
          direction="rtl"
          items={researchItems}
        />

        {/* 4. Projects band (Full-width outside content container, drifts left to right) */}
        <WorkBand
          id="projects"
          title="Projects"
          direction="ltr"
          items={projectItems}
        />

        {/* 5. Technology list */}
        <div className="site-shell">
          <section id="stack" className="page-section" aria-labelledby="stack-heading">
            <div className="section-header" data-reveal>
              <h2 id="stack-heading" className="section-title">
                Technology
              </h2>
            </div>

            <div className="stack-groups">
              <div className="stack-group" data-reveal data-reveal-index={0}>
                <h3 className="stack-group-title">Confident</h3>
                <p className="stack-items">{stack.confident.join(' · ')}</p>
              </div>

              <div className="stack-group" data-reveal data-reveal-index={1}>
                <h3 className="stack-group-title">Used</h3>
                <p className="stack-items">{stack.used.join(' · ')}</p>
              </div>

              <div className="stack-group" data-reveal data-reveal-index={2}>
                <h3 className="stack-group-title">Learning</h3>
                <p className="stack-items">{stack.learning.join(' · ')}</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 6. Footer */}
      <footer className="site-footer" data-reveal>
        <div className="site-shell site-footer-inner">
          <p className="footer-brand">{site.name}</p>
          <ul className="inline-link-list" aria-label="Footer links">
            {cvHref.length > 0 && (
              <li>
                <a href={cvHref} target="_blank" rel="noopener noreferrer">
                  CV (PDF)
                </a>
              </li>
            )}
            {visibleSiteLinks
              .filter((link) => link.key !== 'cv')
              .map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    target={link.key === 'email' ? undefined : '_blank'}
                    rel={link.key === 'email' ? undefined : 'noopener noreferrer'}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      </footer>
    </>
  );
}
