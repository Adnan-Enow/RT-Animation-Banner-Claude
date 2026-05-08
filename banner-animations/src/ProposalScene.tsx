import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BannerStage, CARD } from "./BannerStage";

/* ────────────────────────────────────────────────────────────────────────────
 * Proposal-Writing scene — animates "PD Animation frame 1..3" SVGs.
 *
 *   KF1  Wide document panel + 16 uneven paragraph lines + a small blue "AI
 *        scan" box hovering on line 1.
 *   KF2  Same panel, same line count; each line has been "cleaned" — left
 *        edges aligned, widths uniformized. The blue box sweeps line-by-line
 *        to drive that transformation (each line snaps from uneven→even as
 *        the box passes over it).
 *   KF3  All lines aligned; AI sparkle indicator pops in (work complete).
 *
 * Outer frame (background blob, grid, glass card chrome, footer) is untouched
 * and provided by <BannerStage>.  Only the work area inside the card animates.
 *
 *   Total duration: 240 frames @ 30fps = 8s
 * ──────────────────────────────────────────────────────────────────────────── */

const COLORS = {
  innerBg: "#F7F7F7",
  headerTint: "#D4DFFE",
  white: "#FFFFFF",
  panelBg: "#F2F2F2",
  textBlock: "#D8D8D8",
  selectionFill: "#3362F3",
  selectionStroke: "#C3D2FF",
  sparkleBlue: "#ADC0FA",
};

const lx = (x: number) => x - CARD.x;
const ly = (y: number) => y - CARD.y;

/* ── Timeline ─────────────────────────────────────────────────────────── */
const PER_LINE_FRAMES = 10; // sweep duration per line (~0.33s at 30fps, eased)
const NUM_LINES = 16;

const T = {
  // Card chrome enters frames 6-36 (BannerStage default).
  hold1End: 50, // ~0.5s of clear KF1 with the AI box on line 1
  scanStart: 50,
  scanEnd: 50 + NUM_LINES * PER_LINE_FRAMES, // 210
  hold2End: 230, // 0.66s of "all aligned" before the sparkle
  sparkleStart: 230,
  sparkleEnd: 254, // 0.8s pop-in
  end: 280,
};

export const PROPOSAL_DURATION = T.end;

/* ── Keyframe data (absolute SVG coords) ──────────────────────────────── */

// Frame 1 — uneven document lines (varying x and w; y unchanged across all KFs).
const UNEVEN_LINES = [
  { x: 568, y: 211, w: 304 },
  { x: 565, y: 227, w: 280 },
  { x: 660, y: 243, w: 212 },
  { x: 565, y: 259, w: 259 },
  { x: 565, y: 275, w: 307 },
  { x: 628, y: 291, w: 244 },
  { x: 565, y: 307, w: 307 },
  { x: 603, y: 323, w: 269 },
  { x: 565, y: 339, w: 274 },
  { x: 594, y: 355, w: 278 },
  { x: 565, y: 371, w: 294 },
  { x: 618, y: 387, w: 254 },
  { x: 594, y: 403, w: 278 },
  { x: 582, y: 419, w: 290 },
  { x: 575, y: 435, w: 163 },
  { x: 565, y: 460, w: 173 },
];

// "Even" target — left edges aligned to the panel margin (565), uniform width
// for the body, with a natural paragraph-ending taper on the last few lines.
const EVEN_LEFT = 565;
const EVEN_FULL_W = 307;
const EVEN_TARGETS = [
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 1
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 2
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 3
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 4
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 5
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 6
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 7
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 8
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 9
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 10
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 11
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 12
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 13
  { x: EVEN_LEFT, w: EVEN_FULL_W }, // 14
  { x: EVEN_LEFT, w: 200 }, // 15 — paragraph ending
  { x: EVEN_LEFT, w: 90 }, // 16 — short closing line
];

// Panel stays constant throughout (frame-1 size).
const PANEL = { x: 555, y: 198, w: 330, h: 281 };

// AI sparkle position (from frame 3 SVG) — bottom-right of the panel.
const SPARKLE = { cx: 793, cy: 439 };

// Blue scanning box dimensions (matches the original frame-1 selection chip).
const BOX_W = 53;
const BOX_H = 15;

/* ── Helpers ──────────────────────────────────────────────────────────── */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Smooth ease-in-out cubic — accelerates and decelerates symmetrically so the
// box neither slams into a line nor stops abruptly at the end.
const easeInOut = (t: number) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/* ── Static card content (header + inner background) ─────────────────── */

const StaticCardContent: React.FC = () => (
  <>
    {/* Inner content background — extended to fill all the way down to the
        footer divider (y=542) so the document floats on a continuous light
        grey field instead of a shorter grey + white-gap. */}
    <div
      style={{
        position: "absolute",
        left: lx(545),
        top: ly(141),
        width: 353,
        height: 401, // 141 → 542 (just up to the divider line)
        background: COLORS.innerBg,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: lx(545.25),
        top: ly(141.25),
        width: 352.5,
        height: 41.5,
        background: COLORS.headerTint,
        opacity: 0.5,
        border: "0.5px solid white",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: lx(555),
        top: ly(154),
        width: 105,
        height: 15,
        background: COLORS.white,
        borderRadius: 2,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: lx(832),
        top: ly(154),
        width: 53,
        height: 15,
        background: COLORS.white,
        borderRadius: 2,
      }}
    />
  </>
);

/* ── Scanning box ─────────────────────────────────────────────────────── */

const ScanningBox: React.FC = () => {
  const frame = useCurrentFrame();

  /* Before the scan begins: hover quietly on line 1. */
  if (frame < T.scanStart) {
    const idleX = UNEVEN_LINES[0].x - 0.5; // matches original 565.5
    const idleY = UNEVEN_LINES[0].y - 4; // matches original 207.5
    return <Box x={idleX} y={idleY} opacity={1} />;
  }

  /* After the scan ends: fade out gracefully. */
  if (frame >= T.scanEnd) {
    const fade = interpolate(frame, [T.scanEnd, T.scanEnd + 8], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    if (fade <= 0.001) return null;
    const last = UNEVEN_LINES[NUM_LINES - 1];
    const target = EVEN_TARGETS[NUM_LINES - 1];
    return <Box x={target.x + target.w - BOX_W} y={last.y - 4} opacity={fade} />;
  }

  /* During the scan: figure out the active line + position within it. */
  const elapsed = frame - T.scanStart;
  const lineIndex = Math.floor(elapsed / PER_LINE_FRAMES);
  const localFrame = elapsed - lineIndex * PER_LINE_FRAMES;
  // Ease-in-out so the box accelerates from rest at the line's left edge
  // and decelerates as it reaches the right edge — feels much smoother than
  // linear motion across each line.
  const localProgress = easeInOut(localFrame / PER_LINE_FRAMES);

  const uneven = UNEVEN_LINES[lineIndex];
  const target = EVEN_TARGETS[lineIndex];

  // Box sweeps from the line's uneven left edge to where the even line will
  // end (target.x + target.w). The box itself stays BOX_W wide.
  const startX = uneven.x;
  const endX = target.x + target.w - BOX_W;
  const x = lerp(startX, endX, localProgress);
  const y = uneven.y - 4;

  // Soft fade-in/out at the start and end of each line's sweep — gives the
  // box a gentle "pickup → carry → drop" feel between lines.
  const blink = interpolate(localProgress, [0, 0.15, 0.85, 1], [0.55, 1, 1, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return <Box x={x} y={y} opacity={blink} />;
};

const Box: React.FC<{ x: number; y: number; opacity: number }> = ({ x, y, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: lx(x),
      top: ly(y),
      width: BOX_W,
      height: BOX_H,
      background: COLORS.selectionFill,
      opacity: opacity * 0.16,
      border: `1px solid ${COLORS.selectionStroke}`,
      borderRadius: 2.5,
      boxSizing: "border-box",
      // A faint glow to feel "active".
      boxShadow: `0 0 8px rgba(51, 98, 243, ${opacity * 0.18})`,
    }}
  />
);

/* ── Skeleton text-line atom ─────────────────────────────────────────── */

const SkelLine: React.FC<{
  index: number;
  sweepPhase: number;
}> = ({ index, sweepPhase }) => {
  const frame = useCurrentFrame();
  const uneven = UNEVEN_LINES[index];
  const target = EVEN_TARGETS[index];

  // Per-line transformation progress (0 → 1) driven by the scanning box's
  // sweep over this line. Ease-in-out matches the box's motion exactly.
  const lineStart = T.scanStart + index * PER_LINE_FRAMES;
  const lineEnd = lineStart + PER_LINE_FRAMES;
  const p = interpolate(frame, [lineStart, lineEnd], [0, 1], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const x = lerp(uneven.x, target.x, p);
  const w = lerp(uneven.w, target.w, p);
  const y = uneven.y;

  const sweepX = -30 + sweepPhase * 160;

  return (
    <div
      style={{
        position: "absolute",
        left: lx(x),
        top: ly(y),
        width: w,
        height: 8,
        background: COLORS.textBlock,
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${sweepX}%`,
          width: "40%",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

/* ── AI sparkle (KF3) ────────────────────────────────────────────────── */

const Sparkle: React.FC<{ pop: number }> = ({ pop }) => {
  const opacity = interpolate(pop, [0, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(pop, [0, 0.6, 1], [0.55, 1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: lx(SPARKLE.cx - 27),
        top: ly(SPARKLE.cy - 27),
        width: 56,
        height: 56,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "50% 50%",
      }}
    >
      <svg width="56" height="56" viewBox="766 412 56 56">
        <defs>
          <clipPath id="sparkleClip">
            <rect width="25.8586" height="25.8586" transform="translate(780 429)" />
          </clipPath>
        </defs>
        <path
          d="M819.031 444.969C822.328 430.593 813.346 416.266 798.969 412.969C784.592 409.673 770.266 418.655 766.969 433.031C763.672 447.408 772.654 461.735 787.031 465.031C801.408 468.328 815.734 459.346 819.031 444.969Z"
          fill={COLORS.sparkleBlue}
        />
        <g clipPath="url(#sparkleClip)">
          <path
            d="M805.784 450.211L801.055 441.466C801.538 440.371 801.808 439.161 801.808 437.888C801.808 432.982 797.83 429.004 792.924 429.004C788.016 429.004 784.039 432.982 784.039 437.888C784.039 439.192 784.322 440.429 784.826 441.544L780.076 450.207C779.923 450.486 779.949 450.829 780.14 451.083C780.332 451.337 780.656 451.456 780.966 451.383L785.022 450.453L786.41 454.319C786.518 454.62 786.793 454.828 787.111 454.852C787.131 454.853 787.151 454.854 787.171 454.854C787.317 454.854 787.46 454.815 787.585 454.74C787.711 454.664 787.813 454.557 787.882 454.428L792.016 446.727C792.318 446.757 792.62 446.772 792.923 446.772C793.204 446.772 793.481 446.758 793.755 446.732L797.979 454.434C798.053 454.571 798.166 454.683 798.303 454.757C798.44 454.831 798.595 454.864 798.75 454.851C799.067 454.826 799.341 454.618 799.448 454.319L800.836 450.452L804.892 451.383C805.204 451.458 805.524 451.337 805.716 451.085C805.909 450.832 805.935 450.491 805.784 450.211H805.784ZM787.318 452.064L786.301 449.232C786.162 448.847 785.759 448.623 785.36 448.718L782.36 449.406L785.779 443.169C786.905 444.69 788.505 445.838 790.361 446.396L787.318 452.064ZM785.662 437.888C785.662 433.885 788.92 430.627 792.924 430.627C796.928 430.627 800.185 433.885 800.185 437.888C800.185 441.892 796.928 445.15 792.924 445.15C788.92 445.15 785.662 441.892 785.662 437.888ZM800.499 448.718C800.098 448.623 799.696 448.623 799.557 449.232L798.534 452.085L795.424 446.414C797.329 445.856 798.968 444.678 800.108 443.113L803.513 449.409L800.499 448.718Z"
            fill="white"
          />
        </g>
      </svg>
    </div>
  );
};

/* ── Work area (panel + lines + box + sparkle) ────────────────────────── */

const WorkArea: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sparklePop = interpolate(frame, [T.sparkleStart, T.sparkleEnd], [0, 1], {
    easing: Easing.bezier(0.34, 1.4, 0.64, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Continuous shimmer phase shared by all skeleton lines (subtle, never the
  // primary effect — the scanning box does the heavy lifting).
  const sweepPeriod = 2.6 * fps;
  const sweepPhase = (frame % sweepPeriod) / sweepPeriod;

  // Scale the entire document (panel + lines + box + sparkle) together so
  // they shrink as one unit relative to their layout center.
  const docScale = 0.8;
  // Panel center in card-local coordinates → used as the scale origin so the
  // document stays centered in the card while shrinking.
  const panelCenterX = lx(PANEL.x + PANEL.w / 2);
  const panelCenterY = ly(PANEL.y + PANEL.h / 2);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `scale(${docScale})`,
        transformOrigin: `${panelCenterX}px ${panelCenterY}px`,
      }}
    >
      {/* Constant work-area panel — never resizes (wrapper handles overall scale). */}
      <div
        style={{
          position: "absolute",
          left: lx(PANEL.x),
          top: ly(PANEL.y),
          width: PANEL.w,
          height: PANEL.h,
          background: COLORS.panelBg,
          borderRadius: 2,
        }}
      />

      {/* 16 lines — each morphs uneven → even when the box passes over it. */}
      {UNEVEN_LINES.map((_, i) => (
        <SkelLine key={i} index={i} sweepPhase={sweepPhase} />
      ))}

      {/* The scanning AI box. */}
      <ScanningBox />

      {/* Sparkle indicator at the very end. */}
      {sparklePop > 0.001 ? <Sparkle pop={sparklePop} /> : null}
    </div>
  );
};

/* ── Top-level scene ─────────────────────────────────────────────────── */

export const ProposalScene: React.FC = () => {
  return (
    <BannerStage cardEntryStart={6} cardEntryDuration={24}>
      <StaticCardContent />
      <WorkArea />
    </BannerStage>
  );
};
