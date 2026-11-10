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

// While the tagline's "book" is hovered the cloud spells out the book's title
const BOOK_TOKENS = ['automate', 'the', 'boring', 'stuff'] as const;
const ATLAS_TOKENS: readonly string[] = [...TOKENS, ...BOOK_TOKENS];
const BOOK_SPEED_BOOST = 1.8;
const BOOK_SWAP_SEC = 0.7; // Time for every token to turn into a title word

const FPS_CAP = 30;
const FRAME_INTERVAL_MS = 1000 / FPS_CAP;
const ALPHA_BUCKETS = [0.06, 0.09, 0.13, 0.17, 0.21, 0.25] as const;
const BUCKET_COUNT = ALPHA_BUCKETS.length;
const WIDE_SCREEN_PX = 1024;
const WIDE_ALPHA_BOOST = 1.75;
const WIDE_DRIFT_BOOST = 1.9;
const POINTER_RADIUS_PX = 220;
const POINTER_PUSH_PX = 78;

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
  cosRadialDiff: number;
  sinRadialDiff: number;
  bucketIdx: number;
  bookTokenIndex: number;
  bookThreshold: number; // 0..1, when this token swaps during the cascade
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
    let isTabVisible =
      typeof document !== 'undefined' ? !document.hidden : true;
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

    // Pre-allocated typed buffers per alpha bucket so renderCloudFrame allocates 0 objects per frame
    const bucketCounts = new Int32Array(BUCKET_COUNT);
    let bucketTokenIndices: Int16Array[] = [];
    let bucketDrawX: Float32Array[] = [];
    let bucketDrawY: Float32Array[] = [];

    let simTimeSec = 0;
    let isBookMode =
      typeof document !== 'undefined'
        ? document.documentElement.hasAttribute('data-book-egg')
        : false;
    let bookMix = isBookMode ? 1 : 0;
    let speedFactor = isBookMode ? BOOK_SPEED_BOOST : 1;
    let lastTimestamp = 0;

    // Laptops run at up to 60fps and the cloud parts around the cursor
    let frameIntervalMs = FRAME_INTERVAL_MS;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerStrength = 0;
    let pointerStrengthTarget = 0;
    const canFollowPointer =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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

    const readBookColor = (): string => {
      if (typeof window === 'undefined') return '#F4C25B';
      const raw = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--book')
        .trim();
      return raw || '#F4C25B';
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
      const fontSizeCss = width < 768 ? 11 : width < WIDE_SCREEN_PX ? 12 : 14;
      const cellPad = 6;
      const cellHeightCss = fontSizeCss + cellPad * 2;

      const offscreen = document.createElement('canvas');
      const measureCtx = offscreen.getContext('2d');
      if (!measureCtx) return;

      measureCtx.font = `400 ${fontSizeCss}px ${fontFamily}`;

      const measuredWidths = ATLAS_TOKENS.map((token) =>
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
      const bookColor = readBookColor();

      const nextCells: SpriteCell[] = [];
      let cursorX = 0;

      for (let i = 0; i < ATLAS_TOKENS.length; i++) {
        const wCss = measuredWidths[i];
        const centerX = cursorX + wCss / 2;
        const centerY = cellHeightCss / 2;
        ctx.fillStyle = i < TOKENS.length ? currentAccent : bookColor;
        ctx.fillText(ATLAS_TOKENS[i], centerX, centerY);

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
        const linearSpeedPx =
          (12 + rand() * 6) * (width >= WIDE_SCREEN_PX ? WIDE_DRIFT_BOOST : 1);
        const effectiveRadius = Math.max(48, rNorm * avgCloudRadius);
        const direction = rand() > 0.25 ? 1 : -1;
        const orbitSpeed = (linearSpeedPx / effectiveRadius) * 0.45 * direction;

        // Soft opacity falloff toward the edge of the cloud so the name is always readable
        const edgeFade = Math.max(0.2, 1 - rNorm * 0.78);
        const baseAlpha = (0.07 + rand() * 0.17) * edgeFade;

        const wobblePhase = rand() * Math.PI * 2;
        const wobbleFreq = 0.18 + rand() * 0.22;
        const radialPhase = rand() * Math.PI * 2;
        const phaseDiff = radialPhase - wobblePhase;

        let bucketIdx = Math.floor(
          ((baseAlpha - 0.05) / 0.21) * BUCKET_COUNT
        );
        if (bucketIdx < 0) bucketIdx = 0;
        if (bucketIdx >= BUCKET_COUNT) {
          bucketIdx = BUCKET_COUNT - 1;
        }

        nextParticles.push({
          tokenIndex: i % TOKENS.length,
          baseAngle: angle,
          baseRadiusNorm: rNorm,
          orbitSpeed,
          wobblePhase,
          wobbleFreq,
          cosRadialDiff: Math.cos(phaseDiff),
          sinRadialDiff: Math.sin(phaseDiff),
          bucketIdx,
          bookTokenIndex: TOKENS.length + (i % BOOK_TOKENS.length),
          // A hash rather than rand() so the cloud's layout stays as it was
          bookThreshold: (Math.imul(i + 1, 2654435761) >>> 0) / 4294967296,
        });
      }

      particles = nextParticles;
      bucketTokenIndices = Array.from(
        { length: BUCKET_COUNT },
        () => new Int16Array(targetCount)
      );
      bucketDrawX = Array.from(
        { length: BUCKET_COUNT },
        () => new Float32Array(targetCount)
      );
      bucketDrawY = Array.from(
        { length: BUCKET_COUNT },
        () => new Float32Array(targetCount)
      );
    };

    const renderCloudFrame = (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !atlasCanvas || spriteCells.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      pointerX += (pointerTargetX - pointerX) * 0.14;
      pointerY += (pointerTargetY - pointerY) * 0.14;
      pointerStrength += (pointerStrengthTarget - pointerStrength) * 0.08;

      // The whole cloud leans very slightly towards the cursor
      const leanX = pointerStrength * (pointerX - width * 0.5) * 0.025;
      const leanY = pointerStrength * (pointerY - height * 0.5) * 0.025;

      const cx = width * 0.5 + leanX;
      const cy = height * 0.48 + leanY;

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

      // Precompute frame-level phase trig so per-particle loop uses angle identities
      const phaseA = timeSec * 0.17;
      const cosPhaseA = Math.cos(phaseA);
      const sinPhaseA = Math.sin(phaseA);

      const phaseB = timeSec * 0.13;
      const cosPhaseB = Math.cos(phaseB);
      const sinPhaseB = Math.sin(phaseB);

      bucketCounts.fill(0);

      const particleCount = particles.length;
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        const theta = p.baseAngle + timeSec * p.orbitSpeed;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        // Angle identities: cos(2θ), sin(2θ), cos(3θ), sin(3θ)
        const cos2Theta = 2 * cosTheta * cosTheta - 1;
        const sin2Theta = 2 * sinTheta * cosTheta;
        const sin3Theta = sin2Theta * cosTheta + cos2Theta * sinTheta;
        const cos3Theta = cos2Theta * cosTheta - sin2Theta * sinTheta;

        // cos(2θ + phaseA) and sin(3θ - phaseB)
        const cosLobeA = cos2Theta * cosPhaseA - sin2Theta * sinPhaseA;
        const sinLobeB = sin3Theta * cosPhaseB - cos3Theta * sinPhaseB;

        const lobeDeform = 1 + morphA * cosLobeA + morphB * sinLobeB;

        const wobbleAngle = timeSec * p.wobbleFreq + p.wobblePhase;
        const cosWobble = Math.cos(wobbleAngle);
        const sinWobble = Math.sin(wobbleAngle);

        // sin(wobbleAngle + phaseDiff)
        const sinRadial =
          sinWobble * p.cosRadialDiff + cosWobble * p.sinRadialDiff;
        const radialBreath = 1 + 0.08 * sinRadial;

        const r = p.baseRadiusNorm * heartbeat * lobeDeform * radialBreath;

        const localX = cosTheta * rxBase * r;
        const localY = sinTheta * ryBase * r;

        const driftX = cosWobble * 9;
        const driftY = sinWobble * 9;

        let x = cx + localX * cosTilt - localY * sinTilt + driftX;
        let y = cy + localX * sinTilt + localY * cosTilt + driftY;

        if (pointerStrength > 0.01) {
          const dx = x - pointerX;
          const dy = y - pointerY;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < POINTER_RADIUS_PX * POINTER_RADIUS_PX) {
            const distance = Math.sqrt(distanceSq) || 1;
            const falloff = 1 - distance / POINTER_RADIUS_PX;
            const push =
              falloff * falloff * POINTER_PUSH_PX * pointerStrength;
            x += (dx / distance) * push;
            y += (dy / distance) * push;
          }
        }

        const tokenIndex =
          bookMix > p.bookThreshold ? p.bookTokenIndex : p.tokenIndex;
        const cell = spriteCells[tokenIndex];
        const bIdx = p.bucketIdx;
        const slot = bucketCounts[bIdx];
        bucketTokenIndices[bIdx][slot] = tokenIndex;
        bucketDrawX[bIdx][slot] = x - cell.drawW * 0.5;
        bucketDrawY[bIdx][slot] = y - cell.drawH * 0.5;
        bucketCounts[bIdx] = slot + 1;
      }

      for (let b = 0; b < BUCKET_COUNT; b++) {
        const count = bucketCounts[b];
        if (count === 0) continue;
        ctx.globalAlpha =
          width >= WIDE_SCREEN_PX
            ? ALPHA_BUCKETS[b] * WIDE_ALPHA_BOOST
            : ALPHA_BUCKETS[b];
        const indices = bucketTokenIndices[b];
        const xs = bucketDrawX[b];
        const ys = bucketDrawY[b];

        for (let j = 0; j < count; j++) {
          const cell = spriteCells[indices[j]];
          ctx.drawImage(
            atlasCanvas,
            cell.sx,
            cell.sy,
            cell.sw,
            cell.sh,
            xs[j],
            ys[j],
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
      if (elapsed >= frameIntervalMs) {
        // Clamp delta so returning from a paused tab doesn't jump
        const dtSec = Math.min(elapsed, 100) / 1000;
        const bookTarget = isBookMode ? 1 : 0;
        const swapStep = dtSec / BOOK_SWAP_SEC;
        bookMix =
          bookMix < bookTarget
            ? Math.min(bookTarget, bookMix + swapStep)
            : Math.max(bookTarget, bookMix - swapStep);
        const speedTarget = isBookMode ? BOOK_SPEED_BOOST : 1;
        speedFactor += (speedTarget - speedFactor) * (1 - Math.exp(-dtSec / 0.35));
        simTimeSec += dtSec * speedFactor;
        lastTimestamp = timestamp - (elapsed % frameIntervalMs);
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
      const maxDpr = nextWidth < 768 ? 1.5 : 2;
      const nextDpr = Math.min(window.devicePixelRatio || 1, maxDpr);

      const sizeChanged = nextWidth !== width || nextHeight !== height;
      const dprChanged = nextDpr !== dpr;

      if (!sizeChanged && !dprChanged) return;

      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      frameIntervalMs =
        width >= WIDE_SCREEN_PX ? 1000 / 60 : FRAME_INTERVAL_MS;

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
      const nextBookMode =
        document.documentElement.hasAttribute('data-book-egg');
      if (nextBookMode !== isBookMode) {
        isBookMode = nextBookMode;
        if (prefersReducedMotion) {
          // No cascade or speed-up, just show the title words
          bookMix = isBookMode ? 1 : 0;
          renderCloudFrame(0);
        }
      }
      const nextAccent = readAccentColor();
      if (nextAccent !== currentAccent || !atlasCanvas) {
        buildSpriteAtlas();
        renderCloudFrame(prefersReducedMotion ? 0 : simTimeSec);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointerTargetX = event.clientX - rect.left;
      pointerTargetY = event.clientY - rect.top;
      if (pointerStrengthTarget === 0) {
        // Start at the cursor so the cloud does not sweep in from a corner
        pointerX = pointerTargetX;
        pointerY = pointerTargetY;
      }
      pointerStrengthTarget = 1;
    };

    const handlePointerExit = () => {
      pointerStrengthTarget = 0;
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
          reducedMotionMedia.addEventListener(
            'change',
            handleReducedMotionChange
          );

          colorSchemeMedia = window.matchMedia(
            '(prefers-color-scheme: light)'
          );
          colorSchemeMedia.addEventListener(
            'change',
            handleRootAttributeChange
          );
        }

        isModalOpen =
          document.documentElement.hasAttribute('data-modal-open');
        handleResize();

        if (
          typeof document !== 'undefined' &&
          'fonts' in document &&
          document.fonts?.ready
        ) {
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
            attributeFilter: [
              'data-theme',
              'class',
              'data-modal-open',
              'data-book-egg',
            ],
          });
        }

        window.addEventListener('resize', handleResize, { passive: true });
        if (canFollowPointer) {
          window.addEventListener('pointermove', handlePointerMove, {
            passive: true,
          });
          document.documentElement.addEventListener(
            'mouseleave',
            handlePointerExit
          );
        }
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
        reducedMotionMedia.removeEventListener(
          'change',
          handleReducedMotionChange
        );
      }
      if (colorSchemeMedia) {
        colorSchemeMedia.removeEventListener(
          'change',
          handleRootAttributeChange
        );
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener(
        'mouseleave',
        handlePointerExit
      );
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
