import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Check} from 'lucide-react';

/*
  ─────────────────────────────────────────────────────────────────
  PROPOSAL WRITING SCENE — Remotion port
  ─────────────────────────────────────────────────────────────────
  Banner intrinsic size: 1452 × 709 (matches PD-frame SVG viewBox).
  Output composition:    1920 × 1080 (standard 16:9). The banner is
  fitted by width (1920 × 937.5), centered vertically on white.

  Architecture (per user spec):
    • Outer card frame is STATIC.
      - Base layer = frame-1-base.svg (frame-1 with the static blue
        indicator rect stripped). This provides chrome + caption +
        background blob + initial skeleton document.
      - Card never moves; only the document-area content transforms.
    • Document-area content transitions:
      - F1 base showing always.
      - F2.svg clipped to the document area, fades in 30%→50%, holds,
        then fades out into F3 over 70%→82%. Inner img has subtle
        scale+translate so transformation is contained inside the
        clipped doc area.
      - F3.svg clipped to the document area, fades in 70%→82%, holds.
    • Scanner = the existing blue vector (x=565.5, y=207.5, w=53, h=15,
      fill #3362F3 @ 0.08, stroke #C3D2FF). Snaps line-by-line through
      the 16 skeleton-line y positions during F1 hold.
    • Overlays kept: shimmer band, card-wipe, Approved badge.

  Timeline (5s · 150 frames @ 30fps):
      0  – 12   F1 enter        (banner subtle ease-in)
      12 – 13   pre-scan
      13 – 62   Scanner sweeps every line (16 lines · 3 frames each)
      62 – 75   F1 → F2 transition (F2 fades in)
      75 – 105  F2 hold
      105 – 123 F2 → F3 transition
      123 – 141 F3 hold + Approved badge appears
      141 – 150 Loop tail — overlays decay to 0 for seamless restart
*/

// ── Banner / coordinate constants (in raw SVG pixels) ───────────────
const BANNER_W = 1452;
const BANNER_H = 709;

// Inner content area shared by F1/F2/F3: x=545, y=141, w=353, h=355
// (the #F7F7F7 rect inside the card). Using this as the doc-area clip
// ensures F2/F3 overlays cover the full inner area with no edge gap,
// and matches F1's frame size to F2/F3.
const DOC = {
  x: 545,
  y: 141,
  w: 353,
  h: 355,
};

// Card outer (for badge anchor reference): x=537, y=120, w=378, h=475
const CARD = {x: 537, y: 120, w: 378, h: 475};

// Each skeleton line's exact geometry (x, y, width) — extracted from
// the <rect> elements in frame-1.svg. The scanner uses these so it
// FITS the actual content of each line, not a fixed-width pill.
type SkelLine = {x: number; y: number; w: number};
const SKELETON_LINES: SkelLine[] = [
  {x: 657, y: 236, w: 140},
  {x: 656, y: 248, w: 129},
  {x: 700, y: 260, w: 97},
  {x: 656, y: 272, w: 119},
  {x: 656, y: 284, w: 141},
  {x: 685, y: 296, w: 112},
  {x: 656, y: 308, w: 141},
  {x: 673, y: 320, w: 124},
  {x: 656, y: 332, w: 126},
  {x: 669, y: 344, w: 128},
  {x: 656, y: 356, w: 135},
  {x: 680, y: 368, w: 117},
  {x: 669, y: 380, w: 128},
  {x: 664, y: 392, w: 133},
  {x: 661, y: 404, w: 75},
  {x: 656, y: 416, w: 80},
];

// Visual style of the existing blue vector (preserved). Geometry is
// driven per-line so the scanner resizes to fit each row's content.
const BLUE_RECT_STYLE = {
  height: 15,           // original h
  rx: 2.5,              // original corner radius
  fill: '#3362F3',
  fillOpacity: 0.08,
  stroke: '#C3D2FF',
  strokeWidth: 1,
  yOffset: -3.5,        // original blue rect was at line.y - 3.5
  xPadding: 6,          // extends slightly beyond each line's edges
};

// Scanner timing (frames)
const SCAN_START = 13;       // first frame the scanner is visible
const SCAN_END = 62;         // last frame on the final line
const FRAMES_PER_LINE = 3;   // 3/30 = 100ms per line snap
// 16 lines × 3 frames = 48 frames → fits 13..61 inclusive (49 frames)

// Helper: percent string
const pct = (n: number, total: number) => `${(n / total) * 100}%`;

export const ProposalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width: outW, height: outH} = useVideoConfig();

  // ── Layout: fit banner by width inside 1920×1080 ─────────────────
  const bannerWidth = outW;
  const bannerHeight = (outW * BANNER_H) / BANNER_W; // 1920*709/1452 ≈ 937.5
  const bannerTop = (outH - bannerHeight) / 2;

  // ── Document-area content opacities ──────────────────────────────
  // F2 doc fades in 62→75, holds 75→105, fades out 105→123
  const f2DocOpacity = interpolate(
    frame,
    [62, 75, 105, 123],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  // F3 doc fades in 105→123, holds 123→141, fades out 141→150
  const f3DocOpacity = interpolate(
    frame,
    [105, 123, 141, 150],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // Subtle inner-content transform on F2/F3 entrance (clipped to doc area)
  const f2DocScale = interpolate(
    frame,
    [62, 75],
    [0.992, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const f3DocScale = interpolate(
    frame,
    [105, 123],
    [0.992, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // ── Scanner — snap line-by-line, sized to fit each line ─────────
  const scannerVisible = frame >= SCAN_START && frame <= SCAN_END + 2;
  let scannerLineIdx = 0;
  if (scannerVisible) {
    const stepFrames = frame - SCAN_START;
    scannerLineIdx = Math.min(
      SKELETON_LINES.length - 1,
      Math.max(0, Math.floor(stepFrames / FRAMES_PER_LINE)),
    );
  }
  const curLine = SKELETON_LINES[scannerLineIdx];
  const scannerX = curLine.x - BLUE_RECT_STYLE.xPadding;
  const scannerY = curLine.y + BLUE_RECT_STYLE.yOffset;
  const scannerW = curLine.w + BLUE_RECT_STYLE.xPadding * 2;
  const scannerOpacity = interpolate(
    frame,
    [SCAN_START - 1, SCAN_START, SCAN_END, SCAN_END + 4],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // ── Shimmer — continuous skeleton sweep, confined to doc area ────
  // Visible during F1 phase (loading state). Fades out as F2 takes over.
  const shimmerOpacity = interpolate(
    frame,
    [0, 8, 75, 95],
    [0, 0.55, 0.55, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  // Shimmer band sweeps left→right every 42 frames (1.4s)
  const shimmerCycle = (frame % 42) / 42;
  const shimmerX = interpolate(shimmerCycle, [0, 1], [-45, 405]); // % within doc area

  // ── Card-wipe — vertical white wipe over doc area at frame entries ─
  // F1 enter wipe: 0→12
  // F2 enter wipe: 60→75
  // F3 enter wipe: 105→123
  const cardWipeY = (() => {
    if (frame <= 12) return interpolate(frame, [0, 12], [-110, 110]);
    if (frame >= 60 && frame <= 75) return interpolate(frame, [60, 75], [-110, 110]);
    if (frame >= 105 && frame <= 123) return interpolate(frame, [105, 123], [-110, 110]);
    return 110; // off-screen below
  })();

  // ── Approved badge ───────────────────────────────────────────────
  // Visible during F3 hold; pops in 117→126, holds, fades out 141→150
  const badgeOpacity = interpolate(
    frame,
    [117, 126, 141, 150],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const badgeScale = interpolate(
    frame,
    [117, 126, 132],
    [0.7, 1.06, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const badgeTranslateY = interpolate(
    frame,
    [117, 126],
    [8, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // ── Banner subtle entrance (scene-level opacity for loop seam) ──
  const bannerOpacity = interpolate(
    frame,
    [0, 8, 145, 150],
    [0.92, 1, 1, 0.96],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  return (
    <AbsoluteFill style={{backgroundColor: '#FFFFFF'}}>
      {/* Banner container (letterboxed inside 1920×1080) */}
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
        {/* ── Layer A: static base — frame-1 with blue rect removed ── */}
        <Img
          src={staticFile('scenes/pd/frame-1-base.svg')}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />

        {/* ── Layer C1: F2 clipped to doc area ── */}
        <DocAreaOverlay
          src={staticFile('scenes/pd/frame-2.svg')}
          opacity={f2DocOpacity}
          scale={f2DocScale}
        />

        {/* ── Layer C2: F3 clipped to doc area ── */}
        <DocAreaOverlay
          src={staticFile('scenes/pd/frame-3.svg')}
          opacity={f3DocOpacity}
          scale={f3DocScale}
        />

        {/* ── Layer D1: shimmer band over doc area ── */}
        <div
          style={{
            position: 'absolute',
            left: pct(DOC.x, BANNER_W),
            top: pct(DOC.y, BANNER_H),
            width: pct(DOC.w, BANNER_W),
            height: pct(DOC.h, BANNER_H),
            overflow: 'hidden',
            borderRadius: 4,
            opacity: shimmerOpacity,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${shimmerX}%`,
              width: '30%',
              background:
                'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 60%, transparent 100%)',
              filter: 'blur(3px)',
            }}
          />
        </div>

        {/* ── Layer D2: card-wipe vertical white wash over doc area ── */}
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
                'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.55) 35%, rgba(255,255,255,.78) 50%, rgba(255,255,255,.55) 65%, rgba(255,255,255,0) 100%)',
              transform: `translateY(${cardWipeY}%)`,
            }}
          />
        </div>

        {/* ── Layer D3: scanner — animated blue vector ── */}
        <svg
          viewBox={`0 0 ${BANNER_W} ${BANNER_H}`}
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: scannerOpacity,
          }}
        >
          <rect
            x={scannerX}
            y={scannerY}
            width={scannerW}
            height={BLUE_RECT_STYLE.height}
            rx={BLUE_RECT_STYLE.rx}
            fill={BLUE_RECT_STYLE.fill}
            fillOpacity={BLUE_RECT_STYLE.fillOpacity}
            stroke={BLUE_RECT_STYLE.stroke}
            strokeWidth={BLUE_RECT_STYLE.strokeWidth}
          />
        </svg>

        {/* ── Layer E: Approved badge above the card ── */}
        <div
          style={{
            position: 'absolute',
            // Card top edge: y=120 → 16.93%. Place badge slightly above (~14.4%).
            left: '50%',
            top: pct(CARD.y - 18, BANNER_H),
            transform: `translate(-50%, ${badgeTranslateY}px) scale(${badgeScale})`,
            opacity: badgeOpacity,
            padding: '6px 12px 6px 6px',
            background: '#fff',
            color: '#16A34A',
            border: '1px solid rgba(22,163,74,0.22)',
            borderRadius: 999,
            boxShadow:
              '0 6px 16px -6px rgba(22,163,74,0.45), 0 2px 6px -2px rgba(15,17,21,0.10)',
            fontFamily:
              '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: 0.3,
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            zIndex: 6,
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#16A34A',
              color: '#fff',
              display: 'inline-grid',
              placeItems: 'center',
              lineHeight: 1,
            }}
          >
            <Check size={12} strokeWidth={3} />
          </span>
          Approved
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Doc-area overlay: clips an SVG to just the document grey rect ────
// This way the outer card NEVER moves — only inner content transforms.
const DocAreaOverlay: React.FC<{src: string; opacity: number; scale: number}> = ({
  src,
  opacity,
  scale,
}) => {
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
      }}
    >
      {/* Inner img is sized so its document area aligns with the clip box.
         The img is rendered at full banner scale, then offset so the doc
         area sits at (0,0) within the clip. */}
      <Img
        src={src}
        style={{
          position: 'absolute',
          width: `${(BANNER_W / DOC.w) * 100}%`,
          height: `${(BANNER_H / DOC.h) * 100}%`,
          left: `${(-DOC.x / DOC.w) * 100}%`,
          top: `${(-DOC.y / DOC.h) * 100}%`,
          transformOrigin: '50% 50%',
          transform: `scale(${scale})`,
          display: 'block',
        }}
      />
    </div>
  );
};
