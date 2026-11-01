# Cole Rodney Migisha's Portfolio

Hi! This is the code behind my personal site, live at [migisha.pages.dev](https://migisha.pages.dev).

I'm a computer science student at Uganda Christian University, and this site is where my projects and research live. It's also a small project in its own right, because I wanted a portfolio that shows how I build, not just a list of what I've built.

## What it does

- **Shows my work.** Research and projects drift across the page in two bands. Click a card for a quick look, or open the full story.
- **Stays alive.** A cloud of characters from my tech stack floats behind my name, and the background drifts slowly behind everything. On a laptop, the cloud moves out of the way of your cursor.
- **Has a real pulse.** The heartbeat line in the footer comes from an automated pipeline, not a hard-coded value. More on that below.
- **Works for everyone.** It has dark and light modes, works from phone to desktop, can be used with a keyboard, and goes still for anyone who prefers reduced motion.

## How the heartbeat works

1. A GitHub Actions workflow (`.github/workflows/heartbeat.yml`) runs every six hours.
2. It reads my latest public activity from the GitHub API and checks the result.
3. It saves `heartbeat.json` to a separate `data` branch, so a run never rebuilds the site.
4. Your browser fetches that file and shows when the pipeline last ran.

If the data is missing or more than 24 hours old, the line hides itself. No secrets are involved in the browser.

## How it's built

| Part | What I used |
|---|---|
| Framework | Next.js 15 with TypeScript, exported as a static site |
| Styling | Plain CSS with variables, in `app/globals.css` |
| Content | Markdown and JSON files in `content/` |
| Animation | CSS, plus Canvas 2D for the character cloud |
| Automation | GitHub Actions |
| Hosting | Cloudflare Pages, which rebuilds on every push to `main` |

There's no server, database or API key anywhere in this project.

I design the system and make the calls. AI tools wrote first drafts of much of the code, then I reviewed it, changed it and tested it.

## Where things live

```text
app/            Pages, metadata and all the styles
components/     The cloud, bands, footer and other pieces
content/        Everything you read on the site
lib/            Loads and checks the content
public/         Images, CV and icons
.github/        The heartbeat workflow
```

## Running it yourself

You'll need Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Then open <http://localhost:3000>. To make the production build, which ends up in `out/`, run:

```sh
npm run build
```

This project uses npm only, so please don't add a `bun.lock` file. Cloudflare will try to use it and the build will fail.

## Adding new work

No code needed:

1. Copy `content/projects/_template.md` or `content/research/_template.md` to a new file. Files starting with `_` are ignored.
2. Fill in the details at the top and write the story below them.
3. Push to `main`.

The card, window and page build themselves. `level: "full"` gives an item its own page at `/work/your-slug`, and `level: "short"` keeps it in a window. The build checks every field and tells you which file to fix if something is missing.

To change the site's profile details, edit `content/site.json`. Leave a field empty to hide it. Tools live in `content/stack.json`. The words typed out in the footer live in `content/heaven-words.json`.

## License and reuse

There's no open source license yet, so the code, writing and designs here are all rights reserved. You're welcome to read it and learn from it, and please ask before reusing anything.
