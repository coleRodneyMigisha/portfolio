# Cole Rodney Migisha — Portfolio

This is a Next.js (App Router) + TypeScript project configured for static HTML export (`output: 'export'` and `images: { unoptimized: true }`). It contains no server-side runtime code, no API routes, and no API keys.

## Content Structure

- `content/site.json` — Profile metadata (`name`, `tagline`, `email`, `linkedin`, `github`, `cv`, `leetcode`, `zindi`). Any field left blank (`""`) is automatically hidden in the UI.
- `content/stack.json` — Technology lists (`confident`, `used`, `learning`).
- `content/projects/` — Project Markdown entries (`kind: "project"`).
- `content/research/` — Research Markdown entries (`kind: "research"`).

## Adding new work

You can add a new project or research item simply by creating a Markdown file—no code changes are required:

1. **Copy the appropriate template**:
   - For a project: copy `content/projects/_template.md` to `content/projects/your-slug.md`
   - For research: copy `content/research/_template.md` to `content/research/your-slug.md`
   - Note: Any file whose filename starts with `_` (such as `_template.md`) is ignored by the build.
2. **Fill in all required frontmatter fields**:
   - `title` (non-empty string)
   - `slug` (URL-safe lowercase string with hyphens, e.g. `"schema-validation-pipeline"`)
   - `kind` (`"project"` in `content/projects/`, or `"research"` in `content/research/`)
   - `summary` (non-empty string)
   - `status` (non-empty string, e.g. `"Completed"`, `"In Progress"`, `"Working Note"`)
   - `tags` (YAML list of non-empty strings)
   - `group` (non-empty string)
   - `date` (non-empty string, e.g. `"2026-03"`)
   - `level` (`"full"` or `"short"`):
     - `"full"` items appear on the home page **and** generate a standalone static route at `/work/[slug]`.
     - `"short"` items appear on the home page (and open in a compact window) without generating a `/work/[slug]` route.
   - `team` (`true` or `false` — `true` displays `"Team project"`; never list teammate names)
   - `image` (string path in `public/`, or `""` if none)
   - `links` (list of `{ label, url }` objects, or `[]` if none)
   - `order` (number controlling sort order; lower numbers appear first)
   - `visible` (`true` to publish, `false` to hide without deleting the file)
3. **Write the Markdown body** below the second `---`.
4. **Build and verify**:
   - Run `npm run build`.
   - The build validates all frontmatter fields and fails with a message naming the file and field if anything is missing or invalid.

## Running Locally Outside AI Studio

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build Static Files (`out/` directory)

```bash
npm run build
```

Running `npm run build` executes `next build`, validating all content in `content/` and exporting static HTML/CSS/JS into the `out/` folder.

### 4. Preview the Static `out/` Directory Locally

```bash
npx serve@latest out
```

Or using Python:

```bash
python3 -m http.server 3000 --directory out
```
