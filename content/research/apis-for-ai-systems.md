---
title: "APIs for AI systems"
slug: "apis-for-ai-systems"
kind: "research"
summary: "A review of published systems that put trained models behind APIs: how they serve them, how fast they run, and what makes them unsafe. Includes a FastAPI demo of the defences."
status: "Presented"
tags:
  - "FastAPI"
  - "API security"
  - "Model serving"
group: "Intelligent systems"
date: "2026-10"
level: "short"
team: true
image: ""
links: []
order: 5
visible: true
---

How do you put a trained model behind an API, fast and safely? We read published systems, from a diabetic-retinopathy screener to a zero-day attack detector, and pulled out the pattern they share: load, receive, prepare, predict, respond. We set an async FastAPI result against a Django monolith, compared REST with gRPC, and listed the flaws a security study found in AI-written APIs: mass assignment, unchecked body sizes, and race conditions. I built a small FastAPI service to show the defences working.
