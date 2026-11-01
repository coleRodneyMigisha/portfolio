---
title: "Personal HQ"
slug: "personal-hq"
kind: "project"
summary: "I plan my days in a paper notebook. This tool turned 33 pages of those notes into a working Notion system that keeps running even when my computer is off."
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

My daily plans live in a paper notebook. I wanted that system to follow me everywhere, without changing how I already plan.

## What I did

I designed it around how the notebook already works: tasks, carried-over items, weekly goals and projects. Python only handles the setup. Once built, everything runs inside Notion, even with my computer off.

The scripts default to a safe dry run, and the tests never touch Notion, so trying things out is safe. A GitHub Action also keeps a contribution calendar up to date.

## Where it stands

It ran against my real workspace and is fully operational.
