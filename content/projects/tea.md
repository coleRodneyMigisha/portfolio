---
title: "tea"
slug: "tea"
kind: "project"
summary: "An Ubuntu desktop app that asks me small questions through the week and has a ready-to-paste blog prompt waiting on Friday evening. No API key, and no network code."
status: "In progress"
tags:
  - "Python"
  - "PySide6"
  - "SQLite"
  - "pytest"
group: "Building and shaping systems"
date: "2026-11"
level: "short"
team: false
image: ""
links:
  - label: "Code"
    url: "https://github.com/coleRodneyMigisha/tea"
order: 4.6
visible: true
---

I want to write for Medium every week, but a blank page on Friday kills it. tea collects the material bit by bit: short question pop-ups when I log in, files I drop in, and the week's focus. On Friday at 18:00 it turns all of that into one prompt I paste into a normal Claude chat. Claude's reply comes back into tea as a checked draft with a "Copy for Medium" button.

It's built in Python with PySide6 and SQLite, in milestones that are each tested first. All eleven are done, with 1,350 tests passing, including contrast and keyboard checks on every screen and a simulated fortnight that proves the logs never hold what I wrote. What's left is checking it by hand on a real GNOME desktop.
