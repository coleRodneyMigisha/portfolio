---
title: "Data pipeline"
slug: "data-pipeline"
kind: "project"
summary: "A pipeline that takes messy data from separate sources and turns it into clean, validated tables ready for analysis."
status: "Course project"
tags:
  - "Python"
  - "pandas"
  - "Spark"
  - "pytest"
  - "Parquet"
group: "Data and automation"
date: "2026-10"
level: "full"
team: false
image: ""
links: []
order: 1
visible: true
---

## Why

Analysis is only as good as the data under it, and real data arrives messy and in pieces.

## What I did

I built ingestion, validation, cleaning, merging and logging stages in Python, made runs idempotent so they can be repeated safely, added tests, designed a star schema and compared performance with Spark.

## Evidence

The validation stage flagged duplicates, missing values, invalid values and inconsistent categories across 10,756 rows, and a logged run completed from start to finish.
