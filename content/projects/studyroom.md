---
title: "StudyRoom"
slug: "studyroom"
kind: "project"
summary: "A study site for three of my course units, with step-through lessons, labs that run Python in the browser, mock exams, and an AI study buddy grounded in our lecturers' own slides."
status: "Live"
tags:
  - "Next.js"
  - "TypeScript"
  - "FastAPI"
  - "Gemini API"
  - "Pyodide"
  - "PostgreSQL"
group: "Intelligent systems"
date: "2026-11"
level: "full"
team: false
image: ""
links:
  - label: "Live site"
    url: "https://study-up.pages.dev"
  - label: "Code"
    url: "https://github.com/coleRodneyMigisha/study-room-frontend"
order: 2.5
visible: true
---

## Why

Revising from slides alone wasn't working for me or my classmates. The slides list the facts, but they don't show you a process step by step, let you try something and see what happens, or tell you whether your exam answer would score. I wanted one place where a course is taught, practised and tested, and where the AI help sticks to what our lecturers actually teach.

## What I did

I built StudyRoom as two parts: a static Next.js site and a FastAPI service that does the AI work.

- **Courses as content, not code.** Each course unit is a folder of YAML files: lessons, notes, worked examples, quizzes, exam questions and labs. A schema checks them on every build, so adding a course needs no application code. Three units run on it now: Computer Vision, Data Science Systems, and AI Model Deployment and Scaling.
- **Grounded in the lecturer's materials.** Slides, notes and past papers go into a resources folder. The backend extracts the text from PDF, PowerPoint and Word files, indexes it, and retrieves the relevant passages for every buddy reply, grade and new question. Drafted content from those materials is reviewed before it's merged into a course.
- **Labs that run in the browser.** Python and SQL exercises run on the student's own device through Pyodide, with hidden tests. A verification script runs every model solution against its tests, and checks that the starter code fails, before anything ships.
- **A study buddy that sees the page.** Every page tells the buddy what the student is looking at: the lesson step, the lab values, their last answer and its score. Modes (nudge, hint, walkthrough, explain) decide how much it gives away.
- **Accounts and progress.** Students can sign in with Google, a magic link or a password, and their progress and buddy chats sync across devices. The rate limiter keys on Cloudflare's client IP header, after I found that a forged forwarding header could get around it.

Late in the build, I rewrote every module in plain language for someone who has never taken the course.

## Where it stands

It's live on Cloudflare Pages, with the API on Render. Classmates use it for revision, and the AI Deployment unit now includes our class's group presentations.
