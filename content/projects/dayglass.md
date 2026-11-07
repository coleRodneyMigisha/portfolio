---
title: "Dayglass"
slug: "dayglass"
kind: "project"
summary: "A minimalist daily planner that floats on your Ubuntu desktop, with translucent glass styling, Apple Notes-inspired breathing room, offline-first Notion sync, and a focus timer."
status: "Running"
tags:
  - "Python"
  - "PySide6"
  - "SQLite"
  - "Notion API"
  - "pytest"
group: "Building and shaping systems"
date: "2026-11"
level: "full"
team: false
image: ""
links:
  - label: "Code"
    url: "https://github.com/coleRodneyMigisha/dayglass"
order: 4
visible: true
---

## Why

I wanted something that kept a practical record of my work without pulling me out of my flow. Most planner apps are heavy browser tabs or rigid electron bloat. I wanted a calm, translucent companion that floats directly on my Ubuntu desktop and is the first thing I see when I sign into my machine.

## What I did

I designed and built Dayglass using Python, PySide6, and SQLite, pairing offline-first durability with an Apple Notes-inspired glass aesthetic.

- **Clean, Apple Notes-inspired layout**: Redesigned to remove visual congestion. Chunky multi-button task rows were replaced with elegant ghost toolbars, circular checklist indicators, and calm typography with generous breathing room.
- **Bi-directional Notion sync**: Linked directly to my Notion Personal HQ. Any task created via Notion or the CLI appears in Dayglass automatically.
- **Offline-first with reconnect auto-sync**: When internet drops, all changes (new tasks, status toggles, notes, carry-forwards, deletions) persist locally in SQLite and queue in a sync table. The moment the computer reconnects, changes flush to Notion and fresh remote updates are pulled seamlessly on a background daemon thread.
- **System integration**: The window floats smoothly with frameless dragging, borrows its accent colours from your desktop wallpaper via GNOME extraction, and includes Sunday-based weekly objectives and a quiet 25-minute focus timer.

## Where it stands

It is installed locally on my system, launches on login, passes all automated tests, and keeps my desktop and Notion workspace in continuous lockstep.
