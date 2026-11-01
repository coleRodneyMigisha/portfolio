---
title: "Data pipeline"
slug: "data-pipeline"
kind: "project"
summary: "Messy data from separate sources goes in. Clean, validated, analysis-ready tables come out. No sighing at spreadsheets required."
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

Analysis is only as good as the data underneath it, and real data shows up messy and in pieces.

## What I did

I built the stages in Python: ingestion, validation, cleaning, merging and logging. Runs are idempotent, so you can repeat them without breaking anything. Then I added tests, designed a star schema and compared performance with Spark.

## Evidence

The validation stage caught duplicates, missing values, invalid values and inconsistent categories across 10,756 rows, and a logged run made it from start to finish.
