---
title: "Portfolio heartbeat"
slug: "portfolio-heartbeat"
kind: "project"
summary: "A small automation pipeline that keeps this site's heartbeat line up to date."
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

A scheduled GitHub Actions workflow runs every six hours. It reads my latest public activity from the GitHub API, checks the result, and saves it to a separate data branch, so a run never rebuilds the site.

The page reads that file in the browser, with no secrets. If the data is missing or old, the line simply disappears.
