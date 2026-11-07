---
title: "Personal HQ"
slug: "personal-hq"
kind: "project"
summary: "I plan my days in a paper notebook. This tool turned 33 pages of those notes into a working Notion system that keeps running even when my computer is off, with a terminal task viewer and Dayglass desktop sync."
status: "Running"
tags:
  - "Python"
  - "Notion API"
  - "GitHub Actions"
  - "pytest"
  - "Automation"
group: "Data and automation"
date: "2026-11"
level: "full"
team: false
image: ""
links:
  - label: "Code"
    url: "https://github.com/coleRodneyMigisha/notion-personal-hq"
order: 2
visible: true
---

## Why

My daily plans live in a paper notebook. I wanted that system to follow me everywhere, without changing how I already plan.

## What I did

I designed it around how the notebook already works: tasks, carried-over items, weekly goals, and projects. Python only handles the setup. Once built, everything runs inside Notion, even with my computer off.

- **Interactive Daily Tasks Viewer**: Built a terminal task browser (`scripts/task_viewer.py`) using raw ANSI controls. You can skim day-by-day with arrow keys, toggle tasks, edit notes, carry forward unfinished work, and sync the Notion Contribution Calendar with single keystrokes.
- **Two-way Dayglass Desktop Integration**: Connected the Notion API directly to my Dayglass floating desktop planner. Tasks created in either place stay in sync, with offline queueing so no work is lost when traveling or disconnected.
- **Safety and Reliability**: The scripts default to dry runs, unit tests mock all external calls so test runs never pollute production databases, and a GitHub Action maintains the daily contribution streak automatically.

## Where it stands

Running in daily production against my live workspace and paired with my desktop floating planner.
