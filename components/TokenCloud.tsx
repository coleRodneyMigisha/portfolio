'use client';

import { useEffect, useRef } from 'react';

const TOKENS = [
  'def',
  '{ }',
  '<div>',
  'SELECT',
  'λ',
  'tensor',
  'import',
  '=>',
  'git',
  'npm',
  'async',
  'JOIN',
  'class',
  'fit()',
  'pip',
] as const;

const FPS_CAP = 30;
const FRAME_INTERVAL_MS = 1000 / FPS_CAP;
const ALPHA_BUCKETS = [0.06, 0.09, 0.13, 0.17, 0.21, 0.25] as const;

interface SpriteCell {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  drawW: number;
  drawH: number;
}

interface CloudParticle {
  tokenIndex: number;
  baseAngle: number;
  baseRadiusNorm: number; // 0..1 normalized radius inside the soft cloud
  orbitSpeed: number; // rad/s calibrated for ~12-18 px/s drift
  wobblePhase: number;
  wobbleFreq: number;
  radialPhase: number;
  baseAlpha: number;
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export default function TokenCloud() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isDisposed = false;
    let rafId: number | null = null;
    let startRaf1: number | null = null;
    let startRaf2: number | null = null;

    let isOnScreen = true;
    let isTabVisible = typeof document !== 'undefined' ? !document.hidden : true;
    let prefersReducedMotion = false;
    let isModalOpen =
      typeof document !== 'undefined'
        ? document.documentElement.hasAttribute('data-modal-open')
        : false;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let currentAccent = '#C79A5B';
    let heartbeatPeriodSec = 7.0;

    let atlasCanvas: HTMLCanvasElement | null = null;
    let spriteCells: SpriteCell[] = [];
    let particles: CloudParticle[] = [];

    let simTimeSec = 0;
    let lastTimestamp = 0;

    let intersectionObserver: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let reducedMotionMedia: MediaQueryList | null = null;
    let colorSchemeMedia: MediaQueryList | null = null;

    const readHeartbeatPeriodSec = (): number => {
      if (typeof window === 'undefined') return 7.0;
      const raw = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--heartbeat-period')
        .trim();
      if (!raw) return 7.0;
      if (raw.endsWith('ms')) {
        const ms = parseFloat(raw);
        return Number.isFinite(ms) && ms > 0 ? ms / 1000 : 7.0;
      }
      const sec = parseFloat(raw);
      return Number.isFinite(sec) && sec > 0 ? sec : 7.0;
    };

    const readAccentColor = (): string => {
      if (typeof window === 'undefined') return '#C79A5B';
      const raw = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim();
      return raw || '#C79A5B';
    };

    const readFontFamily = (): string => {
      if (typeof window === 'undefined') return 'monospace';
      const raw = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--font-mono-stack')
        .trim();
      return raw || 'monospace';
    };

    const buildSpriteAtlas = () => {
      currentAccent = readAccentColor();
      heartbeatPeriodSec = readHeartbeatPeriodSec();
      const fontFamily = readFontFamily();
      const fontSizeCss = width < 768 ? 11 : 12;
      const cellPad = 6;
      const cellHeightCss = fontSizeCss + cellPad * 2;

      const offscreen = document.createElement('canvas');
      const measureCtx = offscreen.getContext('2d');
      if (!measureCtx) return;

      measureCtx.font = `400 ${fontSizeCss}px ${fontFamily}`;

      const measuredWidths = TOKENS.map((token) =>
        Math.ceil(measureCtx.measureText(token).width + cellPad * 2)
      );
      const totalWidthCss = measuredWidths.reduce((sum, w) => sum + w, 0);

      offscreen.width = Math.max(1, Math.ceil(totalWidthCss * dpr));
      offscreen.height = Math.max(1, Math.ceil(cellHeightCss * dpr));

      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      ctx.font = `400 ${fontSizeCss}px ${fontFamily}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = currentAccent;

      const nextCells: SpriteCell[] = [];
      let cursorX = 0;

      for (let i = 0; i < TOKENS.length; i++) {
        const wCss = measuredWidths[i];
        const centerX = cursorX + wCss / 2;
        const centerY = cellHeightCss / 2;
        ctx.fillText(TOKENS[i], centerX, centerY);

        nextCells.push({
          sx: Math.round(cursorX * dpr),
          sy: 0,
          sw: Math.round(wCss * dpr),
          sh: Math.round(cellHeightCss * dpr),
          drawW: wCss,
          drawH: cellHeightCss,
        });

        cursorX += wCss;
      }

      atlasCanvas = offscreen;
      spriteCells = nextCells;
    };

    const buildParticles = () => {
      // Under 250 tokens on phones; up to 900 tokens on desktop
      const isPhone = width < 768;
      const targetCount = isPhone
        ? 210
        : Math.min(900, Math.max(520, Math.floor((width * height) / 1500)));

      const rand = createSeededRandom(20261031);
      const avgCloudRadius = Math.max(140, Math.min(width, height) * 0.38);

      const nextParticles: CloudParticle[] = [];
      for (let i = 0; i < targetCount; i++) {
        // Soft Gaussian-like radial distribution so tokens gather into one cohesive cloud
        const u1 = rand();
        const u2 = rand();
        const rNorm = Math.pow((u1 + u2) * 0.5, 0.72); // 0..1 concentrated toward center
        const angle = rand() * Math.PI * 2;

        // Target linear drift speed of 12 to 18 px/s
        const linearSpeedPx = 12 + rand() * 6;
        const effectiveRadius = Math.max(48, rNorm * avgCloudRadius);
        const direction = rand() > 0.25 ? 1 : -1;
        const orbitSpeed = (linearSpeedPx / effectiveRadius) * 0.45 * direction;

        // Soft opacity falloff toward the edge of the cloud so the name is always readable
        const edgeFade = Math.max(0.2, 1 - rNorm * 0.78);
        const baseAlpha = (0.07 + rand() * 0.17) * edgeFade;

        nextParticles.push({
          tokenIndex: i % TOKENS.length,
          baseAngle: angle,
          baseRadiusNorm: rNorm,
          orbitSpeed,
          wobblePhase: rand() * Math.PI * 2,
          wobbleFreq: 0.18 + rand() * 0.22,
          radialPhase: rand() * Math.PI * 2,
          baseAlpha,
        });
      }

      particles = nextParticles;
    };

    const renderCloudFrame = (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !atlasCanvas || spriteCells.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.48;

      // Cloud radii scale gently with viewport while remaining one cohesive cloud
      const rxBase = Math.min(width * 0.45, 620);
      const ryBase = Math.min(height * 0.38, 380);

      // Shared subtle heartbeat read from --heartbeat-period + slow organic shape morphing
      const heartbeat =
        1 + 0.035 * Math.sin((timeSec * Math.PI * 2) / heartbeatPeriodSec);
      const morphA = 0.12 * Math.sin(timeSec * 0.21);
      const morphB = 0.09 * Math.cos(timeSec * 0.15);
      const cloudTilt = 0.18 * Math.sin(timeSec * 0.11);
      const cosTilt = Math.cos(cloudTilt);
      const sinTilt = Math.sin(cloudTilt);

      // Bucket draw calls by opacity to minimize Canvas state changes
      const buckets: Array<Array<{ cell: SpriteCell; x: number; y: number }>> =
        ALPHA_BUCKETS.map(() => []);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const theta = p.baseAngle + timeSec * p.orbitSpeed;

        // Organic lobe modulation so the single cloud slowly changes shape
        const lobeDeform =
          1 +
          morphA * Math.cos(2 * theta + timeSec * 0.17) +
          morphB * Math.sin(3 * theta - timeSec * 0.13);

        const radialBreath =
          1 + 0.08 * Math.sin(timeSec * p.wobbleFreq + p.radialPhase);

        const r = p.baseRadiusNorm * heartbeat * lobeDeform * radialBreath;

        const localX = Math.cos(theta) * rxBase * r;
        const localY = Math.sin(theta) * ryBase * r;

        // Apply subtle cloud tilt + gentle local drift
        const driftX = Math.cos(timeSec * p.wobbleFreq + p.wobblePhase) * 9;
        const driftY = Math.sin(timeSec * p.wobbleFreq + p.wobblePhase) * 9;

        const x = cx + localX * cosTilt - localY * sinTilt + driftX;
        const y = cy + localX * sinTilt + localY * cosTilt + driftY;

        const cell = spriteCells[p.tokenIndex];
        const drawX = x - cell.drawW * 0.5;
        const drawY = y - cell.drawH * 0.5;

        // Map particle alpha to nearest bucket
        let bucketIdx = Math.floor(
          ((p.baseAlpha - 0.05) / 0.21) * ALPHA_BUCKETS.length
        );
        if (bucketIdx < 0) bucketIdx = 0;
        if (bucketIdx >= ALPHA_BUCKETS.length) {
          bucketIdx = ALPHA_BUCKETS.length - 1;
        }

        buckets[bucketIdx].push({ cell, x: drawX, y: drawY });
      }

      for (let b = 0; b < ALPHA_BUCKETS.length; b++) {
        const items = buckets[b];
        if (items.length === 0) continue;
        ctx.globalAlpha = ALPHA_BUCKETS[b];
        for (let j = 0; j < items.length; j++) {
          const { cell, x, y } = items[j];
          ctx.drawImage(
            atlasCanvas,
            cell.sx,
            cell.sy,
            cell.sw,
            cell.sh,
            x,
            y,
            cell.drawW,
            cell.drawH
          );
        }
      }

      ctx.globalAlpha = 1;
    };

    const shouldAnimate = () =>
      !isDisposed &&
      isOnScreen &&
      isTabVisible &&
      !prefersReducedMotion &&
      !isModalOpen;

    const tick = (timestamp: number) => {
      if (!shouldAnimate()) {
        rafId = null;
        return;
      }

      if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
      }

      const elapsed = timestamp - lastTimestamp;
      if (elapsed >= FRAME_INTERVAL_MS) {
        // Clamp delta so returning from a paused tab doesn't jump
        const dtSec = Math.min(elapsed, 100) / 1000;
        simTimeSec += dtSec;
        lastTimestamp = timestamp - (elapsed % FRAME_INTERVAL_MS);
        renderCloudFrame(simTimeSec);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const syncLoopState = () => {
      if (shouldAnimate()) {
        if (rafId === null) {
          lastTimestamp = 0;
          rafId = window.requestAnimationFrame(tick);
        }
      } else {
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        if (prefersReducedMotion && width > 0 && height > 0) {
          // Draw one still frame when reduced motion is active
          renderCloudFrame(0);
        }
      }
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.floor(rect.width));
      const nextHeight = Math.max(1, Math.floor(rect.height));
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

      const sizeChanged = nextWidth !== width || nextHeight !== height;
      const dprChanged = nextDpr !== dpr;

      if (!sizeChanged && !dprChanged) return;

      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      buildSpriteAtlas();
      buildParticles();
      renderCloudFrame(prefersReducedMotion ? 0 : simTimeSec);
    };

    const handleRootAttributeChange = () => {
      const nextModalOpen =
        document.documentElement.hasAttribute('data-modal-open');
      if (nextModalOpen !== isModalOpen) {
        isModalOpen = nextModalOpen;
        syncLoopState();
      }
      const nextAccent = readAccentColor();
      if (nextAccent !== currentAccent || !atlasCanvas) {
        buildSpriteAtlas();
        renderCloudFrame(prefersReducedMotion ? 0 : simTimeSec);
      }
    };

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      syncLoopState();
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      syncLoopState();
    };

    // Defer initialization until after first paint
    startRaf1 = window.requestAnimationFrame(() => {
      startRaf2 = window.requestAnimationFrame(() => {
        if (isDisposed) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        if (typeof window.matchMedia === 'function') {
          reducedMotionMedia = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
          );
          prefersReducedMotion = reducedMotionMedia.matches;
          reducedMotionMedia.addEventListener('change', handleReducedMotionChange);

          colorSchemeMedia = window.matchMedia('(prefers-color-scheme: light)');
          colorSchemeMedia.addEventListener('change', handleRootAttributeChange);
        }

        isModalOpen =
          document.documentElement.hasAttribute('data-modal-open');
        handleResize();

        if (typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready) {
          document.fonts.ready.then(() => {
            if (isDisposed || width === 0 || height === 0) return;
            buildSpriteAtlas();
            renderCloudFrame(prefersReducedMotion ? 0 : simTimeSec);
          });
        }

        if ('IntersectionObserver' in window) {
          intersectionObserver = new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              if (entry) {
                isOnScreen = entry.isIntersecting;
                syncLoopState();
              }
            },
            { threshold: 0.01 }
          );
          intersectionObserver.observe(canvas);
        }

        if ('MutationObserver' in window) {
          mutationObserver = new MutationObserver(handleRootAttributeChange);
          mutationObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme', 'class', 'data-modal-open'],
          });
        }

        window.addEventListener('resize', handleResize, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);

        syncLoopState();
      });
    });

    return () => {
      isDisposed = true;
      if (startRaf1 !== null) window.cancelAnimationFrame(startRaf1);
      if (startRaf2 !== null) window.cancelAnimationFrame(startRaf2);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (intersectionObserver) intersectionObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
      if (reducedMotionMedia) {
        reducedMotionMedia.removeEventListener('change', handleReducedMotionChange);
      }
      if (colorSchemeMedia) {
        colorSchemeMedia.removeEventListener('change', handleRootAttributeChange);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="token-cloud-canvas"
      aria-hidden="true"
    />
  );
}
