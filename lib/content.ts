import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
export { SITE_URL } from './site-url';

export type WorkKind = 'project' | 'research';
export type WorkLevel = 'full' | 'short';

export interface WorkLink {
  label: string;
  url: string;
}

export interface WorkFrontmatter {
  title: string;
  slug: string;
  kind: WorkKind;
  summary: string;
  status: string;
  tags: string[];
  group: string;
  date: string;
  level: WorkLevel;
  team: boolean;
  image: string;
  links: WorkLink[];
  order: number;
  visible: boolean;
}

export interface WorkItem extends WorkFrontmatter {
  body: string;
  filePath: string;
}

export interface SiteConfig {
  name: string;
  brandName: string;
  tagline: string;
  email: string;
  linkedin: string;
  github: string;
  cv: string;
  leetcode: string;
  zindi: string;
}

export interface StackConfig {
  confident: string[];
  used: string[];
  learning: string[];
}

const CONTENT_ROOT = path.join(process.cwd(), 'content');

function failValidation(relativeFilePath: string, field: string, reason: string): never {
  throw new Error(
    `[Content Validation Error] File "${relativeFilePath}" — invalid or missing field "${field}": ${reason}`
  );
}

function assertNonEmptyString(
  value: unknown,
  relativeFilePath: string,
  field: string
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    failValidation(relativeFilePath, field, 'expected a non-empty string.');
  }
  return value.trim();
}

function assertStringAllowEmpty(
  value: unknown,
  relativeFilePath: string,
  field: string
): string {
  if (typeof value !== 'string') {
    failValidation(
      relativeFilePath,
      field,
      'expected a string (use "" when intentionally blank).'
    );
  }
  return value.trim();
}

function assertBoolean(
  value: unknown,
  relativeFilePath: string,
  field: string
): boolean {
  if (typeof value !== 'boolean') {
    failValidation(relativeFilePath, field, 'expected a boolean (true or false).');
  }
  return value;
}

function assertStringArray(
  value: unknown,
  relativeFilePath: string,
  field: string
): string[] {
  if (!Array.isArray(value)) {
    failValidation(relativeFilePath, field, 'expected a list of strings.');
  }
  return value.map((entry, index) => {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      failValidation(
        relativeFilePath,
        `${field}[${index}]`,
        'expected every list item to be a non-empty string.'
      );
    }
    return entry.trim();
  });
}

function assertLinksArray(
  value: unknown,
  relativeFilePath: string,
  field: string
): WorkLink[] {
  if (!Array.isArray(value)) {
    failValidation(
      relativeFilePath,
      field,
      'expected a list of { label, url } objects (use [] if none).'
    );
  }
  return value.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      failValidation(
        relativeFilePath,
        `${field}[${index}]`,
        'expected an object with "label" and "url" string fields.'
      );
    }
    const record = entry as Record<string, unknown>;
    const label = assertNonEmptyString(
      record.label,
      relativeFilePath,
      `${field}[${index}].label`
    );
    const url = assertNonEmptyString(
      record.url,
      relativeFilePath,
      `${field}[${index}].url`
    );
    return { label, url };
  });
}

function validateAndParseMarkdownFile(
  absoluteFilePath: string,
  expectedKind: WorkKind
): WorkItem {
  const relativeFilePath = path
    .relative(process.cwd(), absoluteFilePath)
    .replace(/\\/g, '/');
  const raw = fs.readFileSync(absoluteFilePath, 'utf8');
  const parsed = matter(raw);
  const data = (parsed.data ?? {}) as Record<string, unknown>;

  const title = assertNonEmptyString(data.title, relativeFilePath, 'title');
  const slug = assertNonEmptyString(data.slug, relativeFilePath, 'slug');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    failValidation(
      relativeFilePath,
      'slug',
      `expected lowercase URL-safe slug (letters, numbers, hyphens), got "${slug}".`
    );
  }

  const kindRaw = assertNonEmptyString(data.kind, relativeFilePath, 'kind');
  if (kindRaw !== 'project' && kindRaw !== 'research') {
    failValidation(
      relativeFilePath,
      'kind',
      `expected "project" or "research", got "${kindRaw}".`
    );
  }
  if (kindRaw !== expectedKind) {
    failValidation(
      relativeFilePath,
      'kind',
      `file is in content/${expectedKind === 'project' ? 'projects' : 'research'}/ so kind must be "${expectedKind}", got "${kindRaw}".`
    );
  }

  const summary = assertNonEmptyString(data.summary, relativeFilePath, 'summary');
  const status = assertNonEmptyString(data.status, relativeFilePath, 'status');
  const tags = assertStringArray(data.tags, relativeFilePath, 'tags');
  const group = assertNonEmptyString(data.group, relativeFilePath, 'group');

  let date: string;
  if (data.date instanceof Date && !Number.isNaN(data.date.getTime())) {
    date = data.date.toISOString().slice(0, 10);
  } else {
    date = assertNonEmptyString(data.date, relativeFilePath, 'date');
  }

  const levelRaw = assertNonEmptyString(data.level, relativeFilePath, 'level');
  if (levelRaw !== 'full' && levelRaw !== 'short') {
    failValidation(
      relativeFilePath,
      'level',
      `expected "full" or "short", got "${levelRaw}".`
    );
  }

  const team = assertBoolean(data.team, relativeFilePath, 'team');
  const image =
    data.image === undefined || data.image === null
      ? ''
      : assertStringAllowEmpty(data.image, relativeFilePath, 'image');
  const links =
    data.links === undefined || data.links === null
      ? []
      : assertLinksArray(data.links, relativeFilePath, 'links');

  if (typeof data.order !== 'number' || !Number.isFinite(data.order)) {
    failValidation(relativeFilePath, 'order', 'expected a finite number.');
  }
  const order = data.order;

  const visible = assertBoolean(data.visible, relativeFilePath, 'visible');

  return {
    title,
    slug,
    kind: kindRaw,
    summary,
    status,
    tags,
    group,
    date,
    level: levelRaw,
    team,
    image,
    links,
    order,
    visible,
    body: parsed.content.trim(),
    filePath: relativeFilePath,
  };
}

function readDirectoryItems(subDir: string, expectedKind: WorkKind): WorkItem[] {
  const dirPath = path.join(CONTENT_ROOT, subDir);
  if (!fs.existsSync(dirPath)) {
    throw new Error(`[Content Error] Missing required content directory: "content/${subDir}"`);
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const items: WorkItem[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.md')) continue;
    // Skip files starting with "_"
    if (entry.name.startsWith('_')) continue;

    const fullPath = path.join(dirPath, entry.name);
    const item = validateAndParseMarkdownFile(fullPath, expectedKind);

    // Skip items with visible: false
    if (!item.visible) continue;

    items.push(item);
  }

  return items.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.title.localeCompare(b.title);
  });
}

export function getAllVisibleWorkItems(): WorkItem[] {
  const projects = readDirectoryItems('projects', 'project');
  const research = readDirectoryItems('research', 'research');
  const all = [...projects, ...research];

  // Ensure no duplicate slugs across visible items
  const seenSlugs = new Map<string, string>();
  for (const item of all) {
    const existingFile = seenSlugs.get(item.slug);
    if (existingFile) {
      failValidation(
        item.filePath,
        'slug',
        `duplicate slug "${item.slug}" already used in "${existingFile}".`
      );
    }
    seenSlugs.set(item.slug, item.filePath);
  }

  return all.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.title.localeCompare(b.title);
  });
}

export function getVisibleItemsByKind(kind: WorkKind): WorkItem[] {
  return getAllVisibleWorkItems().filter((item) => item.kind === kind);
}

export function getFullWorkItems(): WorkItem[] {
  return getAllVisibleWorkItems().filter((item) => item.level === 'full');
}

export function getFullWorkItemBySlug(slug: string): WorkItem | undefined {
  return getFullWorkItems().find((item) => item.slug === slug);
}

export function getSiteConfig(): SiteConfig {
  const relativeFilePath = 'content/site.json';
  const fullPath = path.join(CONTENT_ROOT, 'site.json');
  if (!fs.existsSync(fullPath)) {
    throw new Error(`[Content Error] Missing required file "${relativeFilePath}".`);
  }

  const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as Record<string, unknown>;

  return {
    name: assertNonEmptyString(raw.name, relativeFilePath, 'name'),
    brandName: assertNonEmptyString(raw.brandName, relativeFilePath, 'brandName'),
    tagline: assertNonEmptyString(raw.tagline, relativeFilePath, 'tagline'),
    email: assertStringAllowEmpty(raw.email, relativeFilePath, 'email'),
    linkedin: assertStringAllowEmpty(raw.linkedin, relativeFilePath, 'linkedin'),
    github: assertStringAllowEmpty(raw.github, relativeFilePath, 'github'),
    cv: assertStringAllowEmpty(raw.cv, relativeFilePath, 'cv'),
    leetcode: assertStringAllowEmpty(raw.leetcode, relativeFilePath, 'leetcode'),
    zindi: assertStringAllowEmpty(raw.zindi, relativeFilePath, 'zindi'),
  };
}

export function getVisibleSiteLinks(site: SiteConfig): Array<{ key: string; label: string; value: string; href: string }> {
  const linkDefinitions: Array<{
    key: keyof Omit<SiteConfig, 'name' | 'brandName' | 'tagline'>;
    label: string;
    isEmail?: boolean;
  }> = [
    { key: 'email', label: 'Email', isEmail: true },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'github', label: 'GitHub' },
    { key: 'cv', label: 'CV' },
    { key: 'leetcode', label: 'LeetCode' },
    { key: 'zindi', label: 'Zindi' },
  ];

  return linkDefinitions
    .filter((def) => site[def.key].trim().length > 0)
    .map((def) => {
      const value = site[def.key].trim();
      const href =
        def.isEmail && !value.startsWith('mailto:') ? `mailto:${value}` : value;
      return {
        key: def.key,
        label: def.label,
        value,
        href,
      };
    });
}

export interface AboutContent {
  aboutParagraphs: string[];
  experience: string[];
  achievements: string[];
  education: string[];
}

export function getStackConfig(): StackConfig {
  const relativeFilePath = 'content/stack.json';
  const fullPath = path.join(CONTENT_ROOT, 'stack.json');
  if (!fs.existsSync(fullPath)) {
    throw new Error(`[Content Error] Missing required file "${relativeFilePath}".`);
  }

  const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as Record<string, unknown>;

  return {
    confident: assertStringArray(raw.confident, relativeFilePath, 'confident'),
    used: assertStringArray(raw.used, relativeFilePath, 'used'),
    learning: assertStringArray(raw.learning, relativeFilePath, 'learning'),
  };
}

export function getAboutContent(): AboutContent {
  const relativeFilePath = 'content/about.md';
  const fullPath = path.join(CONTENT_ROOT, 'about.md');
  if (!fs.existsSync(fullPath)) {
    throw new Error(`[Content Error] Missing required file "${relativeFilePath}".`);
  }

  const raw = fs.readFileSync(fullPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  type SectionKey = 'about' | 'experience' | 'achievements' | 'education';
  let currentSection: SectionKey = 'about';

  const aboutLines: string[] = [];
  const experience: string[] = [];
  const achievements: string[] = [];
  const education: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    const headingCandidate = trimmed.replace(/^#+\s*/, '');

    if (headingCandidate === 'About Me') {
      currentSection = 'about';
      continue;
    }
    if (headingCandidate === 'Experience') {
      currentSection = 'experience';
      continue;
    }
    if (headingCandidate === 'Achievements') {
      currentSection = 'achievements';
      continue;
    }
    if (headingCandidate === 'Education') {
      currentSection = 'education';
      continue;
    }

    if (currentSection === 'about') {
      aboutLines.push(trimmed);
    } else if (trimmed.length > 0) {
      const cleanedItem = trimmed.replace(/^[-*]\s+/, '');
      if (currentSection === 'experience') {
        experience.push(cleanedItem);
      } else if (currentSection === 'achievements') {
        achievements.push(cleanedItem);
      } else if (currentSection === 'education') {
        education.push(cleanedItem);
      }
    }
  }

  const aboutParagraphs = aboutLines
    .join('\n')
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n+/g, ' ').trim())
    .filter((p) => p.length > 0);

  return {
    aboutParagraphs,
    experience,
    achievements,
    education,
  };
}

