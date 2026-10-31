---
# title (string, required): Display title of the research item or technical investigation.
title: "Example Research Title"

# slug (string, required): URL-safe identifier (lowercase letters, numbers, hyphens).
# Used for /work/[slug] when level is "full".
slug: "example-research-slug"

# kind ("project" | "research", required): Must be "research" for files in content/research/.
kind: "research"

# summary (string, required): Brief plain-text summary of the question investigated and approach taken.
summary: "Concise summary of the research question, methodology, and scope."

# status (string, required): Current state, e.g. "Ongoing", "Completed", "Reading Note", "Working Note".
status: "Ongoing"

# tags (list of strings, required): Research topics, methods, or tools involved.
tags:
  - "Data Quality"
  - "Distributed Systems"

# group (string, required): Research theme or area, e.g. "Data Engineering", "Systems", "Algorithms".
group: "Data Engineering"

# date (string, required): Year or YYYY-MM date string, e.g. "2026" or "2026-02".
date: "2026-02"

# level ("full" | "short", required):
# - "full": Generates a dedicated page at /work/[slug] and opens the full rounded bubble view.
# - "short": Opens a compact glass window only; does not generate a /work/[slug] route.
level: "short"

# team (boolean, required):
# - true: Displays "Team project" (never name teammates).
# - false: Individual research.
team: false

# image (string, required): Path to an image in public/ (e.g. "/images/research.png"), or "" if none.
image: ""

# links (list of { label, url }, required): External links such as notes or code. Use [] if none.
links: []

# order (number, required): Numeric sort priority (lower numbers appear first, e.g. 1, 2, 3).
order: 1

# visible (boolean, required): Set to false to hide this item from the build and UI without deleting the file.
visible: false
---

Write the research notes or full write-up here in Markdown. Focus on the underlying question, constraints, and reasoning.
