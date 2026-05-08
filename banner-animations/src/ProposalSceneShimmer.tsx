import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { BannerStage, CARD } from "./BannerStage";

/* ────────────────────────────────────────────────────────────────────────────
 * Proposal-Writing scene — SHIMMER VARIANT.
 *
 * Same staging as the original ProposalScene, but instead of a scanning blue
 * box driving the "alignment" effect, each uneven line briefly tints light
 * blue (#ADC0FA) like a soft shimmer, and during that shimmer the line morphs
 * uneven → even.  The shimmer cascades top-to-bottom one line at a time.
 *
 *   Total duration: 280 frames @ 30fps = 9.3s
 * ──────────────────────────────────────────────────────────────────────────── */

const COLORS = {
  innerBg: "#F7F7F7",
  headerTint: "#D4DFFE",
  white: "#FFFFFF",
  panelBg: "#F2F2F2",
  textBlock: "#D8D8D8",
  shimmerBlue: "#ADC0FA",
  sparkleBlue: "#ADC0FA",
};

const lx = (x: number) => x - CARD.x;
const ly = (y: number) => y - CARD.y;

/* ── Timeline ─────────────────────────────────────────────────────────── */
// Each line has a 14-frame full transition.  Adjacent lines are offset by 8
// frames, so two lines can be mid-shimmer at once → produces a smooth wave.
const PER_LINE_DURATION = 14;
const PER_LINE_DELAY = 8;
const NUM_LINES = 16;

const T = {
  hold1End: 50, // hold raw uneven document for 0.5s after card settles
  shimmerStart: 50,
  shimmerEnd: 50 + (NUM_LINES - 1) * PER_LINE_DELAY + PER_LINE_DURATION, // 50+120+14 = 184
  hold2End: 200,
  sparkleStart: 200,
  sparkleEnd: 224,
  end: 280,
};

export const PROPOSAL_SHIMMER_DURATION = T.end;

/* ── Keyframe data — identical to ProposalScene ──────────────────────── */

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

const EVEN_LEFT = 565;
const EVEN_FULL_W = 307;
const EVEN_TARGETS = [
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: EVEN_FULL_W },
  { x: EVEN_LEFT, w: 200 },
  { x: EVEN_LEFT, w: 90 },
];

const PANEL = { x: 555, y: 198, w: 330, h: 281 };
const SPARKLE = { cx: 793, cy: 439 };

/* ── Helpers ──────────────────────────────────────────────────────────── */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Linearly mix two hex colors (#RRGGBB) at progress t.  Inputs assumed valid.
const mixHex = (a: string, b: string, t: number): string => {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return `rgb(${r}, ${g}, ${bl})`;
};

/* ── Static card chrome (header + inner bg) ──────────────────────────── */

const StaticCardContent: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        left: lx(545),
        top: ly(141),
        width: 353,
        height: 401, // 141 → 542 (extends to footer divider)
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

/* ── Shimmer line ─────────────────────────────────────────────────────── */

const ShimmerLine: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const uneven = UNEVEN_LINES[index];
  const target = EVEN_TARGETS[index];

  // Per-line progress (0 → 1) staggered top-to-bottom.
  const lineStart = T.shimmerStart + index * PER_LINE_DELAY;
  const lineEnd = lineStart + PER_LINE_DURATION;
  const p = interpolate(frame, [lineStart, lineEnd], [0, 1], {
    easing: Easing.bezier(0.45, 0, 0.55, 1), // ease-in-out
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Color shimmer — peaks blue at the midpoint of the transition, returns to
  // grey at the end.  Slightly weighted toward the second half so the colour
  // change feels concurrent with "becoming aligned" rather than a brief flash.
  const shimmer = interpolate(p, [0, 0.45, 0.85, 1], [0, 1, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fill = mixHex(COLORS.textBlock, COLORS.shimmerBlue, shimmer);

  // Geometry interpolates with the same eased progress.
  const x = lerp(uneven.x, target.x, p);
  const w = lerp(uneven.w, target.w, p);
  const y = uneven.y;

  // Subtle blue glow when shimmer is near peak — gives a "lighting up" feel
  // without being noisy.
  const glow = shimmer * 0.35;

  return (
    <div
      style={{
        position: "absolute",
        left: lx(x),
        top: ly(y),
        width: w,
        height: 8,
        background: fill,
        borderRadius: 1,
        boxShadow: glow > 0.02 ? `0 0 6px rgba(173, 192, 250, ${glow})` : "none",
      }}
    />
  );
};

/* ── AI sparkle (final state) ────────────────────────────────────────── */

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
          <clipPath id="sparkleClipShimmer">
            <rect width="25.8586" height="25.8586" transform="translate(780 429)" />
          </clipPath>
        </defs>
        <path
          d="M819.031 444.969C822.328 430.593 813.346 416.266 798.969 412.969C784.592 409.673 770.266 418.655 766.969 433.031C763.672 447.408 772.654 461.735 787.031 465.031C801.408 468.328 815.734 459.346 819.031 444.969Z"
          fill={COLORS.sparkleBlue}
        />
        <g clipPath="url(#sparkleClipShimmer)">
          <path
            d="M805.784 450.211L801.055 441.466C801.538 440.371 801.808 439.161 801.808 437.888C801.808 432.982 797.83 429.004 792.924 429.004C788.016 429.004 784.039 432.982 784.039 437.888C784.039 439.192 784.322 440.429 784.826 441.544L780.076 450.207C779.923 450.486 779.949 450.829 780.14 451.083C780.332 451.337 780.656 451.456 780.966 451.383L785.022 450.453L786.41 454.319C786.518 454.62 786.793 454.828 787.111 454.852C787.131 454.853 787.151 454.854 787.171 454.854C787.317 454.854 787.46 454.815 787.585 454.74C787.711 454.664 787.813 454.557 787.882 454.428L792.016 446.727C792.318 446.757 792.62 446.772 792.923 446.772C793.204 446.772 793.481 446.758 793.755 446.732L797.979 454.434C798.053 454.571 798.166 454.683 798.303 454.757C798.44 454.831 798.595 454.864 798.75 454.851C799.067 454.826 799.341 454.618 799.448 454.319L800.836 450.452L804.892 451.383C805.204 451.458 805.524 451.337 805.716 451.085C805.909 450.832 805.935 450.491 805.784 450.211H805.784ZM787.318 452.064L786.301 449.232C786.162 448.847 785.759 448.623 785.36 448.718L782.36 449.406L785.779 443.169C786.905 444.69 788.505 445.838 790.361 446.396L787.318 452.064ZM785.662 437.888C785.662 433.885 788.92 430.627 792.924 430.627C796.928 430.627 800.185 433.885 800.185 437.888C800.185 441.892 796.928 445.15 792.924 445.15C788.92 445.15 785.662 441.892 785.662 437.888ZM800.499 448.718C800.098 448.623 799.696 448.623 799.557 449.232L798.534 452.085L795.424 446.414C797.329 445.856 798.968 444.678 800.108 443.113L803.513 449.409L800.499 448.718Z"
            fill="white"
          />
        </g>
      </svg>
    </div>
  );
};

/* ── Work area (panel + lines + sparkle, no scanning box) ─────────────── */

const WorkArea: React.FC = () => {
  const frame = useCurrentFrame();

  const sparklePop = interpolate(frame, [T.sparkleStart, T.sparkleEnd], [0, 1], {
    easing: Easing.bezier(0.34, 1.4, 0.64, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const docScale = 0.8;
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
      {UNEVEN_LINES.map((_, i) => (
        <ShimmerLine key={i} index={i} />
      ))}
      {sparklePop > 0.001 ? <Sparkle pop={sparklePop} /> : null}
    </div>
  );
};

/* ── Top-level scene ─────────────────────────────────────────────────── */

export const ProposalSceneShimmer: React.FC = () => {
  return (
    <BannerStage cardEntryStart={6} cardEntryDuration={24}>
      <StaticCardContent />
      <WorkArea />
    </BannerStage>
  );
};
