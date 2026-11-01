---
title: "Personal HQ"
slug: "personal-hq"
kind: "project"
summary: "I keep my daily plans in a paper notebook. This tool turned 33 pages of those notes into a working Notion system, which runs even when my computer is off."
status: "Running"
tags:
  - "Python"
  - "Notion API"
  - "GitHub Actions"
  - "pytest"
  - "Automation"
group: "Data and automation"
date: "2026-10"
level: "full"
team: false
image: ""
links: []
order: 2
visible: true
---

## Why

I keep my daily plans in a paper notebook. I wanted that system to work everywhere, without changing how I already plan.

## What I did

I designed the system around how the notebook was already used: tasks, carried-over items, weekly goals and projects. Python is only the setup tool. Once built, it runs inside Notion, even when my computer is off.

The scripts default to a safe dry run, with tests that never touch Notion. A GitHub Action also keeps a contribution calendar up to date.

## Where it stands

It ran against my real workspace and is fully operational.
