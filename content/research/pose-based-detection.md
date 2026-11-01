---
title: "Pose-based suspicious activity detection"
slug: "pose-based-detection"
kind: "research"
summary: "Cameras record more than anyone can watch. I am investigating whether computers can flag suspicious behaviour from body movement alone, and whether training on noisy real-world footage helps."
status: "In progress"
tags:
  - "Computer vision"
  - "PyTorch"
  - "YOLOv8"
  - "ByteTrack"
  - "SHAP"
  - "LIME"
group: "Intelligent systems"
date: "2026-10"
level: "full"
team: false
image: ""
links: []
order: 1
visible: true
---

## Why

The idea began with recognising faces in shops. Conversations during an aviation internship moved it towards security footage, and concerns about privacy and footage quality moved it from faces to body pose.

## What I have done

A pipeline using YOLOv8-Pose and ByteTrack turns video into skeleton sequences with velocity features. I trained and compared five model families on 947 sequences, tuned the best with cross-validation, and added SHAP and LIME explanations.

## Where it stands

Preliminary results only: in one run, a temporal convolution model reached 87.3% accuracy on 189 held-out sequences, against 79.9% for always guessing normal. It caught 19 of 38 suspicious sequences, with few false alarms.

Catching more of them is the next problem, followed by the comparison that is the point of the research: does noisy real-world training data help?
