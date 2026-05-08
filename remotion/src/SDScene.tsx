import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/*
  ─────────────────────────────────────────────────────────────────
  SOFTWARE DEVELOPMENT SCENE — Remotion
  ─────────────────────────────────────────────────────────────────
  Banner intrinsic size: 1452 × 709.
  Output composition:    1920 × 1080 letterboxed on white.

  Architecture (per user spec):
    • Outer card frame is STATIC.
    • Layer A — frame-1.svg (full F1 with the centered coding icon).
    • Layer B — frame-2-bg.svg (F2 minus the code lines). Fades in
      45→60 to fully cover F1's icon BEFORE the lines reveal.
    • Layer C — frame-2.svg (with lines), opaque from 60+, applies
      animated `clip-path` (60→110) so each line's row crosses the
      reveal threshold at a unique frame ⇒ "lines appear one by one".
    • Layer D — frame-3-bg.svg (F3 minus the chart bars & donut
      arcs). Crossfades in over F2 (110→125).
    • Layer E — animated bar chart: 6 React rects with their height
      growing from 0 → final, staggered.
    • Layer F — animated donut: SVG circle with stroke-dashoffset
      animating 0% → 25% of circumference (matches the source arc).

  Timeline (5s · 150 frames @ 30fps):
      0  – 15   Banner enter
      15 – 45   F1 hold (icon centered)
      45 – 60   F1 → F2 background crossfade (icon covered)
      60 – 110  F2 lines reveal top-down
      110 – 125 F2 → F3 background crossfade
      122 – 142 Bars + donut animate to life
      142 – 150 Hold + loop tail
*/

// ── Banner / coordinate constants ────────────────────────────────
const BANNER_W = 1452;
const BANNER_H = 709;
const DOC = {x: 550, y: 141, w: 353, h: 355};

// ── Bar chart data extracted from frame-3.svg (white width=10 rects) ─
// All bars share baseline y=422; rx=1; width=10; fill=white.
type Bar = {x: number; finalH: number; startFrame: number};
const BARS: Bar[] = [
  {x: 648, finalH: 26, startFrame: 122},
  {x: 666, finalH: 43, startFrame: 124},
  {x: 684, finalH: 51, startFrame: 126},
  {x: 702, finalH: 74, startFrame: 128},
  {x: 720, finalH: 26, startFrame: 130},
  {x: 738, finalH: 74, startFrame: 132},
];
const BAR_BASELINE = 422;
const BAR_GROW_FRAMES = 14;

// ── Donut data extracted from frame-3.svg (the two arc paths) ───
// Center (826.5, 357.5), radius 29.5. Original blue arc spans 25%
// of the circle (top → right). Background ring is white.
const DONUT = {cx: 826.5, cy: 357.5, r: 29.5, strokeWidth: 7};
const DONUT_TARGET_PCT = 0.25;
const DONUT_START = 122;
const DONUT_END = 142;

// Helper
const pct = (n: number, total: number) => `${(n / total) * 100}%`;

export const SDScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width: outW, height: outH} = useVideoConfig();

  // Layout
  const bannerWidth = outW;
  const bannerHeight = (outW * BANNER_H) / BANNER_W;
  const bannerTop = (outH - bannerHeight) / 2;

  // ── F2 background opacity (covers F1 icon before line reveal) ──
  const f2BgOpacity = interpolate(
    frame,
    [45, 60, 110, 125],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  // ── F2 (with lines) opacity — opaque while lines reveal ──
  const f2Opacity = interpolate(
    frame,
    [60, 65, 110, 125],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  // ── F2 line-reveal sweep (top-down clip-path) ────────────────
  const f2Reveal = interpolate(
    frame,
    [60, 110],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const f2InsetBottom = (1 - f2Reveal) * 100;

  // ── F3 background opacity ────────────────────────────────────
  const f3BgOpacity = interpolate(
    frame,
    [110, 125, 145, 150],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // ── Banner entrance ──────────────────────────────────────────
  const bannerOpacity = interpolate(
    frame,
    [0, 8, 145, 150],
    [0.92, 1, 1, 0.96],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // ── Card-wipe sheen over doc area (subtle entrance polish) ──
  const cardWipeY = (() => {
    if (frame <= 12) return interpolate(frame, [0, 12], [-110, 110]);
    if (frame >= 45 && frame <= 60) return interpolate(frame, [45, 60], [-110, 110]);
    if (frame >= 110 && frame <= 125) return interpolate(frame, [110, 125], [-110, 110]);
    return 110;
  })();

  // ── Donut stroke progress (0 → 0.25 of circumference) ──────
  const circumference = 2 * Math.PI * DONUT.r;
  const donutProgress = interpolate(
    frame,
    [DONUT_START, DONUT_END],
    [0, DONUT_TARGET_PCT],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const donutFilled = circumference * donutProgress;
  const chartsOpacity = interpolate(
    frame,
    [120, 125],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  return (
    <AbsoluteFill style={{backgroundColor: '#FFFFFF'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: bannerTop,
          width: bannerWidth,
          height: bannerHeight,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          opacity: bannerOpacity,
        }}
      >
        {/* ── Layer A: F1 base (card chrome only — icon stripped) ── */}
        <Img
          src={staticFile('scenes/sd/frame-1-base.svg')}
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block'}}
        />

        {/* ── Animated coding icon: staggered chevrons + breathing pulse ── */}
        <AnimatedCodeIcon frame={frame} />


        {/* ── Layer B: F2 background (no lines) — covers icon ── */}
        <DocAreaOverlay
          src={staticFile('scenes/sd/frame-2-bg.svg')}
          opacity={f2BgOpacity}
          insetBottomPct={0}
        />

        {/* ── Layer C: F2 (with lines) — top-down progressive reveal ── */}
        <DocAreaOverlay
          src={staticFile('scenes/sd/frame-2.svg')}
          opacity={f2Opacity}
          insetBottomPct={f2InsetBottom}
        />

        {/* ── Layer D: F3 background (no bars/donut) — crossfades in ── */}
        <DocAreaOverlay
          src={staticFile('scenes/sd/frame-3-bg.svg')}
          opacity={f3BgOpacity}
          insetBottomPct={0}
        />

        {/* ── Layer E + F: animated charts (bars + donut) ── */}
        <svg
          viewBox={`0 0 ${BANNER_W} ${BANNER_H}`}
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: chartsOpacity,
          }}
        >
          {/* Bar chart — heights grow from 0 to final, staggered */}
          {BARS.map((bar) => {
            const p = interpolate(
              frame,
              [bar.startFrame, bar.startFrame + BAR_GROW_FRAMES],
              [0, 1],
              {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
            );
            // Ease-out for natural growth
            const eased = 1 - Math.pow(1 - p, 2);
            const h = bar.finalH * eased;
            return (
              <rect
                key={bar.x}
                x={bar.x}
                y={BAR_BASELINE - h}
                width={10}
                height={h}
                rx={1}
                fill="white"
              />
            );
          })}

          {/* Donut — animated stroke-dashoffset */}
          {/* Background ring (the white arc that was path 52) */}
          <circle
            cx={DONUT.cx}
            cy={DONUT.cy}
            r={DONUT.r}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={DONUT.strokeWidth}
          />
          {/* Foreground colored arc, rotated to start at top (12 o'clock) */}
          <circle
            cx={DONUT.cx}
            cy={DONUT.cy}
            r={DONUT.r}
            fill="none"
            stroke="#85A1F8"
            strokeWidth={DONUT.strokeWidth}
            strokeDasharray={`${donutFilled} ${circumference}`}
            transform={`rotate(-90 ${DONUT.cx} ${DONUT.cy})`}
          />
        </svg>

        {/* ── Card-wipe sheen ── */}
        <div
          style={{
            position: 'absolute',
            left: pct(DOC.x, BANNER_W),
            top: pct(DOC.y, BANNER_H),
            width: pct(DOC.w, BANNER_W),
            height: pct(DOC.h, BANNER_H),
            overflow: 'hidden',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.45) 35%, rgba(255,255,255,.65) 50%, rgba(255,255,255,.45) 65%, rgba(255,255,255,0) 100%)',
              transform: `translateY(${cardWipeY}%)`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── AnimatedCodeIcon: same paths as the original SVG icon, but with
//    staggered entrance (chevron-left → slash → chevron-right) and a
//    subtle breathing pulse during the F1 hold. Fades out as F2 takes over.
const AnimatedCodeIcon: React.FC<{frame: number}> = ({frame}) => {
  // Per-stroke entrance — each chevron/slash fades + slides into place.
  const leftIn = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slashIn = interpolate(frame, [5, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rightIn = interpolate(frame, [10, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Breathing pulse: scale 1 → 1.05 → 1 on a 30-frame cycle, only during
  // the hold phase (20-45). Center of icon ≈ (718, 331).
  const breathePhase = (frame - 20) / 30; // cycles
  const breatheActive = frame >= 20 && frame <= 45;
  const breatheScale = breatheActive
    ? 1 + 0.05 * Math.sin(breathePhase * Math.PI * 2)
    : 1;

  // Whole-icon fade out as F2 background takes over.
  const iconOpacity = interpolate(frame, [40, 55], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Slide offsets for entrance (each stroke comes from its own side)
  const leftDx = (1 - leftIn) * -16;
  const rightDx = (1 - rightIn) * 16;
  const slashDy = (1 - slashIn) * 16;

  return (
    <svg
      viewBox={`0 0 ${BANNER_W} ${BANNER_H}`}
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: iconOpacity,
      }}
    >
      <g
        transform={`translate(718 331) scale(${breatheScale}) translate(-718 -331)`}
      >
        {/* Left chevron `<` */}
        <path
          d="M692.458 357.542L666.417 331.5L692.458 305.458"
          stroke="#DDE6FF"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={leftIn}
          transform={`translate(${leftDx} 0)`}
        />
        {/* Slash `/` */}
        <path
          d="M702.875 383.583L734.125 279.417"
          stroke="#DDE6FF"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          opacity={slashIn}
          transform={`translate(0 ${slashDy})`}
        />
        {/* Right chevron `>` */}
        <path
          d="M744.542 357.542L770.583 331.5L744.542 305.458"
          stroke="#DDE6FF"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={rightIn}
          transform={`translate(${rightDx} 0)`}
        />
      </g>
    </svg>
  );
};

// ── DocAreaOverlay: clips an SVG to just the inner content area ──
const DocAreaOverlay: React.FC<{
  src: string;
  opacity: number;
  insetBottomPct: number;
}> = ({src, opacity, insetBottomPct}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: pct(DOC.x, BANNER_W),
        top: pct(DOC.y, BANNER_H),
        width: pct(DOC.w, BANNER_W),
        height: pct(DOC.h, BANNER_H),
        overflow: 'hidden',
        opacity,
        clipPath: `inset(0 0 ${insetBottomPct}% 0)`,
      }}
    >
      <Img
        src={src}
        style={{
          position: 'absolute',
          width: `${(BANNER_W / DOC.w) * 100}%`,
          height: `${(BANNER_H / DOC.h) * 100}%`,
          left: `${(-DOC.x / DOC.w) * 100}%`,
          top: `${(-DOC.y / DOC.h) * 100}%`,
          display: 'block',
        }}
      />
    </div>
  );
};
