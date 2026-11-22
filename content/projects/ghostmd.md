---
title: "ghostmd"
slug: "ghostmd"
kind: "project"
summary: "A keyboard-first Markdown reader and editor for Linux, written in Rust with GTK 4, because I wanted my notes to look like my terminal."
status: "In progress"
tags:
  - "Rust"
  - "GTK 4"
  - "GtkSourceView"
  - "Linux"
date: "2026-11"
group: "Building and shaping systems"
level: "short"
team: false
image: ""
links:
  - label: "Code"
    url: "https://github.com/coleRodneyMigisha/ghostmd"
order: 4.7
visible: true
---

I read and write a lot of Markdown, and every editor I tried was either heavy or looked nothing like the terminal I live in. ghostmd opens a file in a reading view, Ctrl+E flips it to editing, and it takes its dark theme from my Ghostty colours.

It's built in Rust on GTK 4. Code blocks are highlighted by language and look like an editor pane, wide tables scroll sideways on their own, and a side panel browses folders with a filter. Saves are atomic and refuse to overwrite a file that changed on disk, and a clean buffer reloads itself when the file changes. It is ready for daily use. Split panes and a library index are still to come.
