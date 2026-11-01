import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import TokenCloud from '@/components/TokenCloud';
import {
  getSiteConfig,
  getVisibleSiteLinks,
  getStackConfig,
  getAboutContent,
  getVisibleItemsByKind,
  type WorkItem,
} from '@/lib/content';

function WorkCard({ item }: { item: WorkItem }) {
  return (
    <li className="work-card">
      <div>
        <h3 className="work-card-title">
          {item.level === 'full' ? (
            <Link href={`/work/${item.slug}`}>{item.title}</Link>
          ) : (
            item.title
          )}
        </h3>
        <p className="work-meta">
          <span>{item.status}</span>
          <span aria-hidden="true"> · </span>
          <span>{item.group}</span>
          <span aria-hidden="true"> · </span>
          <span>{item.date}</span>
          {item.team && (
            <>
              <span aria-hidden="true"> · </span>
              <span>Team project</span>
            </>
          )}
        </p>
      </div>

      <p className="work-summary">{item.summary}</p>

      <div>
        <p className="work-tags">{item.tags.join(' · ')}</p>
        {(item.level === 'full' || item.links.length > 0) && (
          <div className="work-card-footer">
            {item.level === 'full' && (
              <Link href={`/work/${item.slug}`}>Read case study</Link>
            )}
            {item.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

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
      <header className="site-header">
        <div className="site-shell site-header-inner">
          <Link href="/" className="brand-mark">
            {site.name}
          </Link>
          <nav className="site-nav" aria-label="Primary navigation">
            <a href="#about">About Me</a>
            <a href="#research">Research</a>
            <a href="#projects">Projects</a>
            <a href="#stack">Technology</a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main>
        {/* 1. Landing (Full-viewport screen) */}
        <section id="landing" className="landing-section" aria-labelledby="hero-heading">
          <TokenCloud />
          <div className="landing-content">
            <h1 id="hero-heading" className="hero-name">
              {site.name}
            </h1>
            <p className="hero-tagline">{site.tagline}</p>
          </div>
        </section>

        <div className="site-shell">
          {/* 2. About Me */}
        <section id="about" className="page-section" aria-labelledby="about-heading">
          <div className="section-header">
            <h2 id="about-heading" className="section-title">
              About Me
            </h2>
          </div>

          <div className="about-grid">
            <div className="case-study-prose">
              {about.aboutParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div>
              <div className="about-subsection">
                <h3 className="about-subsection-title">Experience</h3>
                <ul className="clean-list">
                  {about.experience.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>

              <div className="about-subsection">
                <h3 className="about-subsection-title">Achievements</h3>
                <ul className="clean-list">
                  {about.achievements.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>

              <div className="about-subsection">
                <h3 className="about-subsection-title">Education</h3>
                <ul className="clean-list">
                  {about.education.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Research */}
        <section
          id="research"
          className="page-section"
          aria-labelledby="research-heading"
        >
          <div className="section-header">
            <h2 id="research-heading" className="section-title">
              Research
            </h2>
          </div>

          <ul className="work-list">
            {researchItems.map((item) => (
              <WorkCard key={item.slug} item={item} />
            ))}
          </ul>
        </section>

        {/* 4. Projects */}
        <section
          id="projects"
          className="page-section"
          aria-labelledby="projects-heading"
        >
          <div className="section-header">
            <h2 id="projects-heading" className="section-title">
              Projects
            </h2>
          </div>

          <ul className="work-list">
            {projectItems.map((item) => (
              <WorkCard key={item.slug} item={item} />
            ))}
          </ul>
        </section>

        {/* 5. Technology list */}
        <section id="stack" className="page-section" aria-labelledby="stack-heading">
          <div className="section-header">
            <h2 id="stack-heading" className="section-title">
              Technology
            </h2>
          </div>

          <div className="stack-groups">
            <div className="stack-group">
              <h3 className="stack-group-title">Confident</h3>
              <p className="stack-items">{stack.confident.join(' · ')}</p>
            </div>

            <div className="stack-group">
              <h3 className="stack-group-title">Used</h3>
              <p className="stack-items">{stack.used.join(' · ')}</p>
            </div>

            <div className="stack-group">
              <h3 className="stack-group-title">Learning</h3>
              <p className="stack-items">{stack.learning.join(' · ')}</p>
            </div>
          </div>
        </section>
        </div>
      </main>

      {/* 6. Footer */}
      <footer className="site-footer">
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
