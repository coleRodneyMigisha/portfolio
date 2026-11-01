---
title: "Otuuse"
slug: "otuuse"
kind: "project"
summary: "An intern check-in app that swaps the paper sign-in sheet for one button, and shows supervisors who's in today."
status: "Live demo"
tags:
  - "React"
  - "FastAPI"
  - "PostgreSQL"
  - "pytest"
group: "Building and shaping systems"
date: "2026-11"
level: "short"
team: false
image: ""
links:
  - label: "Try the demo"
    url: "https://otuuse.pages.dev"
  - label: "Code"
    url: "https://github.com/coleRodneyMigisha/intern-check-in"
order: 4.7
visible: true
---

Interns check in when they arrive and check out when they leave, while supervisors see who's in and pull attendance reports by department, intern and date. It's a React front end on a FastAPI API, with hashed passwords, role-based access and rules that allow one check-in a day.

It's a public demo with made-up people, so it isn't holding real attendance yet. The free server naps when idle, so the first sign-in can take about a minute.
