'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { File, Github, Linkedin, Mail } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import TopNav from '@/components/TopNav';
import TokenCloud from '@/components/TokenCloud';
import WorkBand from '@/components/WorkBand';
import ScrollReveal from '@/components/ScrollReveal';
import HeartbeatStatus from '@/components/HeartbeatStatus';
import HeavenSnippet from '@/components/HeavenSnippet';
import { SITE_URL } from '@/lib/site-url';
import type {
  AboutContent,
  SiteConfig,
  StackConfig,
  WorkItem,
} from '@/lib/content';

export interface VisibleSiteLink {
  key: string;
  label: string;
  value: string;
  href: string;
}

interface PortfolioViewProps {
  site: SiteConfig;
  visibleSiteLinks: VisibleSiteLink[];
  about: AboutContent;
  researchItems: WorkItem[];
  projectItems: WorkItem[];
  stack: StackConfig;
  renderedBodies: Record<string, ReactNode>;
  initialBubbleSlug?: string | null;
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'window'; slug: string }
  | { mode: 'bubble'; slug: string; growFromWindow: boolean };

function isPlainLeftClick(e: React.MouseEvent<HTMLAnchorElement>): boolean {
  return (
    e.button === 0 &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.altKey &&
    !e.defaultPrevented
  );
}

function parseWorkSlugFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/work\/([^/?#]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function updateCanonicalLink(href: string): void {
  if (typeof document === 'undefined') return;
  const canonical = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  if (canonical) {
    canonical.href = href;
  }
}

function renderFooterLinkIcon(key: string, label: string): ReactNode {
  switch (key) {
    case 'email':
      return (
        <Mail className="footer-icon" strokeWidth={1.75} aria-hidden="true" />
      );
    case 'linkedin':
      return (
        <Linkedin
          className="footer-icon"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      );
    case 'github':
      return (
        <Github className="footer-icon" strokeWidth={1.75} aria-hidden="true" />
      );
    case 'cv':
      return (
        <span className="footer-cv-icon-wrap" aria-hidden="true">
          <File className="footer-icon footer-cv-file-icon" strokeWidth={1.65} />
          <span className="footer-cv-letters">CV</span>
        </span>
      );
    default:
      return <span>{label}</span>;
  }
}

export default function PortfolioView({
  site,
  visibleSiteLinks,
  about,
  researchItems,
  projectItems,
  stack,
  renderedBodies,
  initialBubbleSlug = null,
}: PortfolioViewProps) {
  const allItems = useMemo(
    () => [...researchItems, ...projectItems],
    [researchItems, projectItems]
  );

  const [modalState, setModalState] = useState<ModalState>(() =>
    initialBubbleSlug
      ? { mode: 'bubble', slug: initialBubbleSlug, growFromWindow: false }
      : { mode: 'closed' }
  );

  const triggerElementRef = useRef<HTMLElement | null>(null);
  const pushedBubbleHistoryRef = useRef<boolean>(false);
  const dialogPanelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastOpenedSlugRef = useRef<string | null>(initialBubbleSlug);

  const activeItem = useMemo(() => {
    if (modalState.mode === 'closed') return null;
    return allItems.find((item) => item.slug === modalState.slug) ?? null;
  }, [allItems, modalState]);

  const restoreFocusToTrigger = useCallback(() => {
    const slug = lastOpenedSlugRef.current;
    window.requestAnimationFrame(() => {
      const savedTrigger = triggerElementRef.current;
      const nonHiddenTrigger =
        savedTrigger && !savedTrigger.closest('[aria-hidden="true"]')
          ? savedTrigger
          : null;

      const triggerEl =
        nonHiddenTrigger ??
        (slug
          ? document.querySelector<HTMLElement>(
              `.band-set:not(.band-set-clone) [data-work-slug="${slug}"]`
            )
          : null) ??
        document.getElementById('main-content');

      if (triggerEl && typeof triggerEl.focus === 'function') {
        try {
          triggerEl.focus({ preventScroll: true });
        } catch {
          triggerEl.focus();
        }
      }
    });
  }, []);

  const handleOpenWindow = useCallback(
    (item: WorkItem, triggerEl: HTMLElement | null) => {
      triggerElementRef.current = triggerEl;
      lastOpenedSlugRef.current = item.slug;
      setModalState({ mode: 'window', slug: item.slug });
    },
    []
  );

  const handleExpandToBubble = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, item: WorkItem) => {
      if (!isPlainLeftClick(e)) return;
      e.preventDefault();

      lastOpenedSlugRef.current = item.slug;
      setModalState({
        mode: 'bubble',
        slug: item.slug,
        growFromWindow: true,
      });

      try {
        window.history.pushState(
          { workSlug: item.slug, fromHome: true },
          '',
          `/work/${item.slug}`
        );
        pushedBubbleHistoryRef.current = true;
      } catch {
        // Ignore history errors in restricted iframe environments
      }
      document.title = `${item.title} | ${site.name}`;
      updateCanonicalLink(`${SITE_URL}/work/${item.slug}`);
    },
    [site.name]
  );

  const handleCloseModal = useCallback(() => {
    if (modalState.mode === 'closed') return;

    if (modalState.mode === 'bubble') {
      if (pushedBubbleHistoryRef.current) {
        pushedBubbleHistoryRef.current = false;
        window.history.back();
        return;
      }

      // Directly opened /work/[slug] page: update URL to "/" and reveal home page in place
      try {
        window.history.pushState(null, '', '/');
      } catch {
        // Ignore history errors
      }
      document.title = site.name;
      updateCanonicalLink(`${SITE_URL}/`);
    }

    setModalState({ mode: 'closed' });
    restoreFocusToTrigger();
  }, [modalState.mode, restoreFocusToTrigger, site.name]);

  // Handle browser Back / Forward buttons (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const slugFromUrl = parseWorkSlugFromPathname(window.location.pathname);
      if (slugFromUrl) {
        const matched = allItems.find(
          (item) => item.slug === slugFromUrl && item.level === 'full'
        );
        if (matched) {
          lastOpenedSlugRef.current = matched.slug;
          setModalState({
            mode: 'bubble',
            slug: matched.slug,
            growFromWindow: false,
          });
          document.title = `${matched.title} | ${site.name}`;
          updateCanonicalLink(`${SITE_URL}/work/${matched.slug}`);
          return;
        }
      }

      pushedBubbleHistoryRef.current = false;
      document.title = site.name;
      updateCanonicalLink(`${SITE_URL}/`);
      setModalState({ mode: 'closed' });
      restoreFocusToTrigger();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [allItems, restoreFocusToTrigger, site.name]);

  // Sync data-modal-open attribute, scroll lock, focus entry, and focus trap
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;
    if (modalState.mode === 'closed' || !activeItem) {
      root.removeAttribute('data-modal-open');
      return;
    }

    root.setAttribute('data-modal-open', modalState.mode);

    // Move focus into the dialog on open
    const focusTimer = window.requestAnimationFrame(() => {
      if (closeButtonRef.current) {
        try {
          closeButtonRef.current.focus({ preventScroll: true });
        } catch {
          closeButtonRef.current.focus();
        }
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseModal();
        return;
      }

      if (event.key === 'Tab') {
        const panel = dialogPanelRef.current;
        if (!panel) return;

        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
        );

        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey) {
          if (active === first || !panel.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !panel.contains(active)) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      root.removeAttribute('data-modal-open');
    };
  }, [activeItem, handleCloseModal, modalState.mode]);

  const stackGroups = useMemo(
    () => [
      { label: 'Confident', items: stack.confident },
      { label: 'Used', items: stack.used },
      { label: 'Learning', items: stack.learning },
    ],
    [stack.confident, stack.learning, stack.used]
  );

  const isBubbleOpen = modalState.mode === 'bubble' && activeItem !== null;
  const isWindowOpen = modalState.mode === 'window' && activeItem !== null;

  return (
    <>
      {/* Progressive SVG refraction filter used only when @supports matches */}
      <svg
        className="sr-only-svg"
        aria-hidden="true"
        width="0"
        height="0"
        focusable="false"
      >
        <defs>
          <filter
            id="glass-edge-refraction"
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <ScrollReveal />

      <div
        className={`home-backdrop-wrapper ${
          isBubbleOpen ? 'home-backdrop-dimmed' : ''
        }`}
        aria-hidden={isWindowOpen || isBubbleOpen ? 'true' : undefined}
        inert={isWindowOpen || isBubbleOpen ? true : undefined}
      >
        <a href="#main-content" className="skip-link glass-control">
          Skip to main content
        </a>

        <header className="site-header">
          <div className="site-shell site-header-inner">
            <Link href="/" className="brand-mark">
              {site.name}
            </Link>
            <TopNav />
            <ThemeToggle />
          </div>
        </header>

        <main id="main-content" tabIndex={-1}>
          {/* 1. Landing (Full-viewport screen — no scroll reveal applied) */}
          <section
            id="landing"
            className="landing-section"
            aria-labelledby="hero-heading"
          >
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
            <section
              id="about"
              className="page-section"
              aria-labelledby="about-heading"
            >
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
            onOpenWindow={handleOpenWindow}
          />

          {/* 4. Projects band (Full-width outside content container, drifts left to right) */}
          <WorkBand
            id="projects"
            title="Projects"
            direction="ltr"
            items={projectItems}
            onOpenWindow={handleOpenWindow}
          />

          {/* 5. Technology marquee */}
          <section
            id="stack"
            className="stack-section"
            aria-labelledby="stack-heading"
          >
            <div className="site-shell">
              <div className="section-header" data-reveal>
                <h2 id="stack-heading" className="section-title">
                  Technology
                </h2>
              </div>
            </div>

            <div
              className="stack-marquee-viewport"
              tabIndex={0}
              role="group"
              aria-label="Technology stack"
              data-reveal
            >
              <div className="stack-marquee-track">
                {[0, 1].map((copyIndex) => {
                  const isClone = copyIndex > 0;
                  return (
                    <div
                      key={copyIndex}
                      className={`stack-marquee-set ${
                        isClone ? 'stack-marquee-clone' : ''
                      }`}
                      aria-hidden={isClone ? 'true' : undefined}
                    >
                      {stackGroups.map((group) => (
                        <div key={group.label} className="stack-marquee-group">
                          <span className="stack-marquee-group-label">
                            {group.label}
                          </span>
                          <ul className="stack-marquee-list">
                            {group.items.map((tech) => (
                              <li key={tech} className="stack-marquee-item">
                                {tech}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>

        {/* 6. Footer */}
        <footer className="site-footer" data-reveal>
          <div className="site-shell site-footer-inner">
            <div className="site-footer-top">
              <p className="footer-brand">{site.name}</p>
              <nav aria-label="Profile and contact links">
                <ul className="inline-link-list">
                  {visibleSiteLinks.map((link) => {
                    const isIconLink =
                      link.key === 'email' ||
                      link.key === 'linkedin' ||
                      link.key === 'github' ||
                      link.key === 'cv';

                    return (
                      <li key={link.key}>
                        <a
                          href={link.href}
                          className={
                            isIconLink ? 'footer-icon-link' : undefined
                          }
                          title={link.label}
                          target={link.key === 'email' ? undefined : '_blank'}
                          rel={
                            link.key === 'email'
                              ? undefined
                              : 'noopener noreferrer'
                          }
                        >
                          {renderFooterLinkIcon(link.key, link.label)}
                          {isIconLink ? (
                            <span className="sr-only">
                              {link.label}
                              {link.key !== 'email'
                                ? ' (opens in a new tab)'
                                : ''}
                            </span>
                          ) : (
                            link.key !== 'email' && (
                              <span className="sr-only">
                                {' '}
                                (opens in a new tab)
                              </span>
                            )
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            <div className="footer-meta-row">
              <HeavenSnippet />

              <HeartbeatStatus />
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Glass Window or Full-Story Bubble Dialog */}
      {activeItem && modalState.mode !== 'closed' && (
        <div
          className={`modal-scrim ${
            modalState.mode === 'bubble'
              ? 'modal-scrim-bubble'
              : 'modal-scrim-window'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div
            ref={dialogPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-dialog-title"
            aria-describedby="work-dialog-summary"
            tabIndex={-1}
            className={
              modalState.mode === 'bubble'
                ? `work-bubble-panel ${
                    modalState.growFromWindow ? 'work-bubble-grow' : ''
                  }`
                : 'work-glass-window'
            }
          >
            <div
              className={
                modalState.mode === 'bubble'
                  ? 'work-bubble-inner'
                  : 'work-window-tinted-layer'
              }
            >
              <div className="work-dialog-topbar">
                <p className="work-meta">
                  <span className="band-card-group">{activeItem.group}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{activeItem.status}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{activeItem.date}</span>
                  {activeItem.team && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span>Team project</span>
                    </>
                  )}
                </p>

                <button
                  ref={closeButtonRef}
                  type="button"
                  className="glass-control work-dialog-close"
                  onClick={handleCloseModal}
                  aria-label="Close window"
                >
                  Close
                </button>
              </div>

              <h2
                id="work-dialog-title"
                className={
                  modalState.mode === 'bubble'
                    ? 'work-bubble-title'
                    : 'work-window-title'
                }
              >
                {activeItem.title}
              </h2>

              <p id="work-dialog-summary" className="work-dialog-summary">
                {activeItem.summary}
              </p>

              {activeItem.image.trim().length > 0 && (
                <div className="work-dialog-image-frame">
                  <img
                    src={activeItem.image}
                    alt={activeItem.title}
                    className="work-dialog-image"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {activeItem.tags.length > 0 && (
                <p className="work-tags">{activeItem.tags.join(' · ')}</p>
              )}

              {modalState.mode === 'window' ? (
                <>
                  {activeItem.level === 'short' &&
                    activeItem.body.trim().length > 0 &&
                    activeItem.body.trim() !== activeItem.summary.trim() && (
                      <div className="case-study-prose work-bubble-markdown">
                        {renderedBodies[activeItem.slug]}
                      </div>
                    )}

                  {(activeItem.level === 'full' ||
                    activeItem.links.length > 0) && (
                    <div className="work-dialog-actions">
                      {activeItem.level === 'full' && (
                        <a
                          href={`/work/${activeItem.slug}`}
                          className="glass-control work-full-story-cta"
                          onClick={(e) => handleExpandToBubble(e, activeItem)}
                        >
                          Read the full story
                        </a>
                      )}

                      {activeItem.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-control"
                        >
                          {link.label}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="work-bubble-divider" />
                  <article className="case-study-prose work-bubble-markdown">
                    {renderedBodies[activeItem.slug]}
                  </article>

                  {activeItem.links.length > 0 && (
                    <div className="work-dialog-actions work-bubble-links">
                      {activeItem.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-control"
                        >
                          {link.label}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
