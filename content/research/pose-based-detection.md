---
title: "Pose-based suspicious activity detection"
slug: "pose-based-detection"
kind: "research"
summary: "Cameras record far more than anyone can watch. I'm investigating whether computers can flag suspicious behaviour from body movement alone, and whether training on noisy real-world footage helps."
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

It started with recognising faces in shops. Conversations during an aviation internship nudged the idea towards security footage, then concerns about privacy and footage quality moved it from faces to body pose.

## What I have done

A pipeline using YOLOv8-Pose and ByteTrack turns video into skeleton sequences with velocity features. I trained and compared five model families on 947 sequences, tuned the best with cross-validation, and added SHAP and LIME explanations so the model has to show its working.

## Where it stands

Preliminary results only: in one run, a temporal convolution model reached 87.3% accuracy on 189 held-out sequences, against 79.9% for always guessing normal. It caught 19 of 38 suspicious sequences, with few false alarms.

Next up is catching more of them. After that comes the comparison this whole project exists for: does noisy real-world training data actually help?
