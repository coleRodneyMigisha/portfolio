---
title: "Snake reinforcement learning"
slug: "snake-rl"
kind: "project"
summary: "A neural network that taught itself Snake from scratch, going from random moves to an average of 289 food on a 20×20 board."
status: "Trained"
tags:
  - "Python"
  - "PyTorch"
  - "Reinforcement learning"
  - "pytest"
group: "Intelligent systems"
date: "2026-11"
level: "full"
team: false
image: ""
links:
  - label: "Code"
    url: "https://github.com/coleRodneyMigisha/snakeGame"
order: 4.2
visible: true
---

## Why

I wanted to see how high a snake could score if nobody told it how to play, and it could only learn from its own games.

## What I did

I split the game rules from the graphics so training could run without a window, then trained a Double DQN agent on them. It sees 21 numbers from the snake's point of view, such as which moves are fatal and how much of the board each move leaves reachable.

The first version peaked at 188, then got worse. Looking at how it died showed why: it would cut off its own tail, then die about 100 moves later, far too long after the mistake to learn from it. A good snake also dies so rarely that it barely had any failures to study. So I gave it a separate memory of the moves before each death, and made dying cost more.

## Evidence

On 100 boards it had never seen, it averaged 289 and reached 343 at best. A perfect game is 397, and random moves average 0.1.

A simple rule I wrote by hand, using the same inputs, still averages 345, so the learned model doesn't beat it yet. That also shows how much of the snake's skill comes from the inputs I designed. The final model rarely traps itself now, but it has become so careful that it tends to starve instead, which is the next thing to fix.
