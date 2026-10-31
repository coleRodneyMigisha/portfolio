---
# title (string, required): Display title of the project.
title: "Example Project Title"

# slug (string, required): URL-safe identifier (lowercase letters, numbers, hyphens).
# Used for /work/[slug] when level is "full".
slug: "example-project-slug"

# kind ("project" | "research", required): Must be "project" for files in content/projects/.
kind: "project"

# summary (string, required): Brief plain-text summary shown in cards and windows.
summary: "One- or two-sentence summary explaining why this project was built and what it does."

# status (string, required): Current state, e.g. "Completed", "In Progress", "Prototype", "Archived".
status: "Completed"

# tags (list of strings, required): Technologies, tools, or concepts used.
tags:
  - "Python"
  - "SQL"

# group (string, required): Thematic grouping, e.g. "Automation", "Data Pipelines", "Systems".
group: "Data Pipelines"

# date (string, required): Year or YYYY-MM date string, e.g. "2026" or "2026-03".
date: "2026-03"

# level ("full" | "short", required):
# - "full": Generates a dedicated page at /work/[slug] and opens the full rounded bubble view.
# - "short": Opens a compact glass window only; does not generate a /work/[slug] route.
level: "full"

# team (boolean, required):
# - true: Displays "Team project" (never name teammates).
# - false: Individual work.
team: false

# image (string, required): Path to an image in public/ (e.g. "/images/example.png"), or "" if none.
image: ""

# links (list of { label, url }, required): External links such as repository or documentation. Use [] if none.
links:
  - label: "GitHub"
    url: "https://github.com/example/repo"

# order (number, required): Numeric sort priority (lower numbers appear first, e.g. 1, 2, 3).
order: 1

# visible (boolean, required): Set to false to hide this item from the build and UI without deleting the file.
visible: false
---

Write the full Markdown body here. Start with the reason the project needed to exist, followed by how it was built and what decisions mattered.
