import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// ── Original glyph paths (lifted verbatim from the source SVGs) ──
// Magnifier (frame-1.svg line 29 / frame-3.svg line 29 / frame-4.svg line 29)
// Bounding box ≈ x:571..580.5, y:199.5..208.5 ; lens centered at (575, 203).
const MAGNIFIER_PATH =
  'M580.5 208.5L577.5 205.5M571.5 203C571.5 203.46 571.591 203.915 571.766 204.339C571.942 204.764 572.2 205.15 572.525 205.475C572.85 205.8 573.236 206.058 573.661 206.234C574.085 206.409 574.54 206.5 575 206.5C575.46 206.5 575.915 206.409 576.339 206.234C576.764 206.058 577.15 205.8 577.475 205.475C577.8 205.15 578.058 204.764 578.234 204.339C578.409 203.915 578.5 203.46 578.5 203C578.5 202.54 578.409 202.085 578.234 201.661C578.058 201.236 577.8 200.85 577.475 200.525C577.15 200.2 576.764 199.942 576.339 199.766C575.915 199.591 575.46 199.5 575 199.5C574.54 199.5 574.085 199.591 573.661 199.766C573.236 199.942 572.85 200.2 572.525 200.525C572.2 200.85 571.942 201.236 571.766 201.661C571.591 202.085 571.5 202.54 571.5 203Z';
const MAGNIFIER_CENTER = {x: 575, y: 203};

// Checkbox (frame-3.svg lines 72-73): grey square outline + blue check.
// Bounding box ≈ x:859..876.6, y:361..377 ; visual center ≈ (867, 369).
const CHECKBOX_BOX_PATH = 'M870.375 361.125H859.125V376.875H874.875V371.625';
const CHECKBOX_CHECK_PATH = 'M863.875 368.625L867.625 372.375L876.625 362.625';
const CHECKBOX_CENTER = {x: 867, y: 369};
// Length of the check polyline (used for stroke-dasharray draw-on).
// Segment 1: (863.875,368.625)→(867.625,372.375) ≈ 5.30
// Segment 2: (867.625,372.375)→(876.625,362.625) ≈ 13.27
const CHECK_LENGTH = 18.6;

/*
  ─────────────────────────────────────────────────────────────────
  STAFFING SCENE — Remotion
  ─────────────────────────────────────────────────────────────────
  Banner intrinsic size: 1452 × 709.
  Output composition:    1920 × 1080 letterboxed on white.

  Architecture:
    • Layer A — frame-1-base.svg (card chrome only — search-bar
      magnifier + "Search" placeholder + 1 profile card stripped).
    • Layer B — typewriter text overlay rendering "ServiceNow
      Developer" character-by-character inside the search bar.
    • Layer C — original magnifier glyph (lifted verbatim from the
      source SVG). Two instances:
        • Static: rendered at the search-bar position so the bar
          always shows its icon.
        • Scanning: same glyph translated+scaled over each avatar
          during the scan window, then disappears completely.
    • Layer D — frame-3-base.svg (4 profiles list, no search-bar
      glyphs and no baked-in checkbox/scanner). Fades in once
      typing is complete.
    • Layer E — original checkbox glyph (square outline + blue check
      from F3). Box pops in with overshoot; check stroke draws on
      via stroke-dasharray once scanning ends.
    • Layer F — frame-4-base.svg (success state). Fades in last.

  Timeline (8s · 240 frames @ 30fps):
       0 – 16   Banner enter (empty search bar)
      16 – 28   Cursor blink before typing
      28 – 112  Typewriter "ServiceNow Developer"
      88 – 112  F3 fades in (4 profile cards reveal)
     112 – 168  Magnifier scans the 4 avatars (~14f each)
     168 – 186  Checkbox stamps onto profile 3
     186 – 212  F4 fades in (success state)
     212 – 240  Hold + loop tail
*/

// ── Banner / coordinate constants ────────────────────────────────
const BANNER_W = 1452;
const BANNER_H = 709;
const DOC = {x: 550, y: 141, w: 353, h: 355};

// Search bar rect: x=562, y=195, w=167, h=18
const SEARCH = {x: 562, y: 195, w: 167, h: 18, cy: 204};

// 4 avatar centers (banner viewBox coordinates) — from frame-3.svg
const AVATAR_CENTERS = [
  {cx: 584, cy: 247}, // profile 1
  {cx: 584, cy: 308}, // profile 2
  {cx: 584, cy: 368}, // profile 3 ← selected
  {cx: 584, cy: 428}, // profile 4
];
const SELECTED_INDEX = 2;

const TYPED_TEXT = 'ServiceNow Developer';

// Helper
const pct = (n: number, total: number) => `${(n / total) * 100}%`;

export const StaffingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width: outW, height: outH} = useVideoConfig();

  // Layout
  const bannerWidth = outW;
  const bannerHeight = (outW * BANNER_H) / BANNER_W;
  const bannerTop = (outH - bannerHeight) / 2;
  const scale = bannerWidth / BANNER_W;

  // ── Banner entrance ──────────────────────────────────────────
  const bannerOpacity = interpolate(
    frame,
    [0, 13, 232, 240],
    [0.92, 1, 1, 0.96],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // ── Typewriter progress ──────────────────────────────────────
  const TYPE_START = 28;
  const TYPE_END = 112;
  const typedCount = Math.max(
    0,
    Math.min(
      TYPED_TEXT.length,
      Math.floor(
        interpolate(frame, [TYPE_START, TYPE_END], [0, TYPED_TEXT.length], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      ),
    ),
  );
  const typedText = TYPED_TEXT.slice(0, typedCount);
  // Cursor blink (during pre-type and active typing only)
  const cursorVisible = frame < TYPE_END + 6 ? Math.floor(frame / 12) % 2 === 0 : false;

  // ── F3 (profile list) opacity ────────────────────────────────
  const f3Opacity = interpolate(
    frame,
    [88, 112, 186, 212],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // ── F4 (success) opacity ─────────────────────────────────────
  const f4Opacity = interpolate(
    frame,
    [186, 212],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // ── Scanning magnifier animation ────────────────────────────
  // The static search-bar magnifier is rendered separately and is
  // visible at all times. This dynamic scanner only exists during
  // the scan window and disappears fully when scanning completes.
  const SCAN_START = 112;
  const SCAN_END = 168;
  const segLen = (SCAN_END - SCAN_START) / AVATAR_CENTERS.length; // ~9f
  const inScan = frame >= SCAN_START && frame < SCAN_END;

  let scanCx = AVATAR_CENTERS[0].cx;
  let scanCy = AVATAR_CENTERS[0].cy;
  if (inScan) {
    const local = (frame - SCAN_START) / segLen;
    const seg = Math.min(AVATAR_CENTERS.length - 1, Math.floor(local));
    const t = local - seg;
    const cur = AVATAR_CENTERS[seg];
    const nxt = AVATAR_CENTERS[Math.min(AVATAR_CENTERS.length - 1, seg + 1)];
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    scanCx = cur.cx + (nxt.cx - cur.cx) * ease;
    scanCy = cur.cy + (nxt.cy - cur.cy) * ease;
  }
  // Original glyph spans ~9 viewBox units — scale up ~4× while scanning.
  const scanScale = 4;
  // Quick fade-in at start, hard fade-out at end so nothing lingers.
  const scanOpacity = interpolate(
    frame,
    [SCAN_START, SCAN_START + 5, SCAN_END - 5, SCAN_END],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // ── Checkbox animation (single mark, appears AFTER scan) ───
  // Two-stage: (1) box pops in with overshoot, (2) check stroke draws on.
  const CHECK_START = SCAN_END;
  const boxIn = interpolate(frame, [CHECK_START, CHECK_START + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Overshoot ease-out (back-out): ~1.15 peak then settle to 1.
  const overshoot = (p: number) => {
    const s = 1.70158;
    const x = p - 1;
    return 1 + (s + 1) * x * x * x + s * x * x;
  };
  const checkBoxScale = boxIn === 0 ? 0 : overshoot(boxIn);
  // Check stroke draws on AFTER the box has popped in.
  const checkDraw = interpolate(
    frame,
    [CHECK_START + 6, CHECK_START + 18],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const checkOpacity = interpolate(
    frame,
    [CHECK_START, CHECK_START + 3, 186, 198],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // ── Card-wipe sheen at key transitions ─────────────────────
  const cardWipeY = (() => {
    if (frame <= 19) return interpolate(frame, [0, 19], [-110, 110]);
    if (frame >= 88 && frame <= 112) return interpolate(frame, [88, 112], [-110, 110]);
    if (frame >= 186 && frame <= 212) return interpolate(frame, [186, 212], [-110, 110]);
    return 110;
  })();

  // Convert viewBox units → screen pixels (banner-relative)
  const vb = (n: number) => n * scale;

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
        {/* ── Layer A: F1 base (card chrome — search/profile1 stripped) ── */}
        <Img
          src={staticFile('scenes/staffing/frame-1-base.svg')}
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block'}}
        />

        {/* ── Layer D: F3 (4 profiles, no search glyphs) — fades in ── */}
        <Img
          src={staticFile('scenes/staffing/frame-3-base.svg')}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            opacity: f3Opacity,
          }}
        />

        {/* ── Layer F: F4 success — fades in last ── */}
        <Img
          src={staticFile('scenes/staffing/frame-4-base.svg')}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            opacity: f4Opacity,
          }}
        />

        {/* ── Layer B: typewriter text inside search bar ── */}
        {/* Hide once F4 success has fully covered the inner area */}
        <div
          style={{
            position: 'absolute',
            left: vb(SEARCH.x + 23),
            top: vb(SEARCH.y),
            width: vb(SEARCH.w - 25),
            height: vb(SEARCH.h),
            display: 'flex',
            alignItems: 'center',
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            fontSize: vb(9),
            lineHeight: 1,
            color: '#454545',
            letterSpacing: vb(0.05),
            opacity: 1 - f4Opacity,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <span>{typedText}</span>
          <span
            style={{
              display: 'inline-block',
              width: vb(0.8),
              height: vb(10),
              marginLeft: vb(0.8),
              backgroundColor: '#454545',
              opacity: cursorVisible ? 1 : 0,
              verticalAlign: 'middle',
            }}
          />
        </div>

        {/* ── Layer C0: avatar zoom-lens — circular cutout that
                shows F3 content scaled up. Follows the scanning
                magnifier so each avatar appears to zoom in as the
                icon passes over it. */}
        {scanOpacity > 0 && (() => {
          const ZOOM = 1.55;
          const lensR = 22; // viewBox units (radius)
          const lensSizePx = vb(lensR * 2);
          // Place the F3 image inside the lens such that the scan-target
          // point (scanCx, scanCy) lands at the lens center.
          const imgW = bannerWidth * ZOOM;
          const imgH = bannerHeight * ZOOM;
          const imgLeft = -scanCx * scale * ZOOM + vb(lensR);
          const imgTop = -scanCy * scale * ZOOM + vb(lensR);
          return (
            <div
              style={{
                position: 'absolute',
                left: vb(scanCx - lensR),
                top: vb(scanCy - lensR),
                width: lensSizePx,
                height: lensSizePx,
                borderRadius: '50%',
                overflow: 'hidden',
                opacity: scanOpacity * (1 - f4Opacity),
                pointerEvents: 'none',
                backgroundColor: '#F1F4FF',
                boxShadow: `0 ${vb(2)}px ${vb(6)}px rgba(0,0,0,0.18), inset 0 0 0 ${vb(0.6)}px rgba(0,0,0,0.06)`,
              }}
            >
              <img
                src={staticFile('scenes/staffing/frame-3-base.svg')}
                style={{
                  position: 'absolute',
                  width: imgW,
                  height: imgH,
                  left: imgLeft,
                  top: imgTop,
                  display: 'block',
                }}
              />
            </div>
          );
        })()}

        {/* ── Layer C + E: original glyphs (magnifier + checkbox) ── */}
        <svg
          viewBox={`0 0 ${BANNER_W} ${BANNER_H}`}
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: 1 - f4Opacity,
          }}
        >
          {/* C1 — STATIC search-bar magnifier (original glyph, always on) */}
          <path
            d={MAGNIFIER_PATH}
            stroke="#BABABA"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* C2 — SCANNING magnifier: same glyph, translated + scaled
                  to each avatar. Grey, hairline stroke (matches the
                  minimal UI palette). */}
          {scanOpacity > 0 && (
            <g
              opacity={scanOpacity}
              transform={`translate(${scanCx} ${scanCy}) scale(${scanScale}) translate(${-MAGNIFIER_CENTER.x} ${-MAGNIFIER_CENTER.y})`}
            >
              <path
                d={MAGNIFIER_PATH}
                stroke="#8A8A8A"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}

          {/* E — original checkbox glyph (square + blue check),
                  positioned at its native coordinates beside profile 3.
                  Box scale-pops in; check stroke draws on. */}
          {checkOpacity > 0 && (
            <g
              opacity={checkOpacity}
              transform={`translate(${CHECKBOX_CENTER.x} ${CHECKBOX_CENTER.y}) scale(${checkBoxScale}) translate(${-CHECKBOX_CENTER.x} ${-CHECKBOX_CENTER.y})`}
            >
              <path
                d={CHECKBOX_BOX_PATH}
                stroke="#D8D8D8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d={CHECKBOX_CHECK_PATH}
                stroke="#5C81F5"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={`${CHECK_LENGTH * checkDraw} ${CHECK_LENGTH}`}
              />
            </g>
          )}
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
