# Next.js Static Export Project

This is a minimal Next.js (App Router) + TypeScript project configured for static HTML export (`output: 'export'` and `images: { unoptimized: true }`). It contains no server-side runtime code, no API routes, and no API keys.

## Routes Included

- `/` (`app/page.tsx`) — Plain text home page
- `/work/test-project` (`app/work/test-project/page.tsx`) — Plain text project page
- `404` (`app/not-found.tsx`) — Plain text 404 page (exported to `out/404.html`)

## Prerequisites

- **Node.js**: v18.18.0 or later (v20+ LTS recommended)
- **npm**: v9+ (or `pnpm` / `yarn`)

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

Running `npm run build` executes `next build`, which compiles the application and writes the static HTML/CSS/JS bundle into the `out/` folder:

- `out/index.html` (`/`)
- `out/work/test-project.html` (`/work/test-project`)
- `out/404.html` (404 page)

### 4. Preview the Static `out/` Directory Locally

Because `output: 'export'` produces pure static files, `next start` is not used. Instead, serve the `out` directory with any static file server:

```bash
npx serve@latest out
```

Or using Python:

```bash
python3 -m http.server 3000 --directory out
```

## Deploying Outside AI Studio

You can deploy the generated `out/` folder directly to any static hosting provider:

- **GitHub Pages / Cloudflare Pages / Netlify / Vercel**: Set the build command to `npm run build` and the publish/output directory to `out`.
- **Nginx / Apache / AWS S3 / Firebase Hosting / Google Cloud Storage**: Upload the contents of the `out/` folder and configure `404.html` as your error document.
