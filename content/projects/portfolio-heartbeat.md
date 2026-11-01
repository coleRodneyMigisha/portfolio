---
title: "Portfolio heartbeat"
slug: "portfolio-heartbeat"
kind: "project"
summary: "A small automation pipeline that gives this site an actual pulse."
status: "Running"
tags:
  - "Python"
  - "GitHub Actions"
  - "GitHub API"
group: "Data and automation"
date: "2026-11"
level: "short"
team: false
image: ""
links:
  - label: "Workflow"
    url: "https://github.com/coleRodneyMigisha/portfolio/blob/main/.github/workflows/heartbeat.yml"
order: 4.5
visible: true
---

Every six hours, a scheduled GitHub Actions workflow reads my latest public activity from the GitHub API, checks the result and saves it to a separate data branch, so a run never rebuilds the site.

The page reads that file right in your browser, with no secrets involved. If the data goes missing or gets old, the line quietly disappears instead of complaining.
