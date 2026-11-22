---
title: "script'd"
slug: "scriptd"
kind: "project"
summary: "A web app where lecturers set tests from their own course topics and every script is marked automatically against one marking guide, run from start to finish as a fully managed two-week project."
status: "In progress"
tags:
  - "Python"
  - "Flask"
  - "SQLAlchemy"
  - "pytest"
  - "Project management"
group: "Building and shaping systems"
date: "2026-11"
level: "full"
team: false
image: ""
links: []
order: 4.8
visible: true
---

## Why

Lecturers mark every script by hand against the same marking guide. It's slow, feedback arrives late, and the topics taught in class aren't recorded in one place, so setting matching exercises takes time too. script'd started as the practical exam for my Software Project Management unit: build something small enough to plan, run, control and close properly in two weeks, with evidence for every step.

## What I did

- **The product.** Lecturers record course topics week by week, build tests, assignments and exams from topic-tagged questions (multiple choice, true/false, exact text and numeric), and publish one marking guide per assessment. Students submit online before a deadline, and late submissions are blocked. Every submission is marked the moment it arrives. Lecturers can review a script, override a mark with a reason, release results and export them to CSV.
- **Marking I can trust.** The marking engine is deterministic, with no AI involved. I checked it against 300 hand-marked answers and it agreed on every one. The CSV export guards against spreadsheet formula injection.
- **Built in Flask and SQLAlchemy, tested throughout.** The suite has over 460 pytest tests, including an access-control matrix for every route, deadline and validation checks, and accessibility checks.
- **Managed like a real project.** I started with a charter the lecturer approved, then built a WBS, a baseline schedule and budget, and a risk register. I logged every issue, decision and change request. Earned value was tracked every day. After a slow start the schedule performance index fell to 0.31; a recovery plan brought it back to 0.97. Five change requests went through formal change control, including self sign-up with pre-loaded registration numbers. One I built before it was approved, and I logged that as a process slip rather than hiding it.

## Where it stands

The build and hardening are done. User acceptance testing, the handover and the closure report come next, and the project closes on 27 November 2026. It runs locally on synthetic data only, by design.
