import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BannerStage, CARD } from "./BannerStage";
import { SCENES, Scene } from "./scenes";

/* ────────────────────────────────────────────────────────────────────────────
 * V2 — Multi-scene skeleton banner. Same card stays mounted; the inner layout
 * morphs between four distinct skeleton shapes — paragraph / code / list /
 * grid — each communicating a different service pillar without text.
 *
 * A continuous global shimmer band sweeps left → right across every block.
 * ──────────────────────────────────────────────────────────────────────────── */

const COLORS = {
  innerBg: "#F7F7F7",
  headerTint: "#D4DFFE",
  pillIdle: "#EDEDED",
  pillActive: "#ADC0FA",
  white: "#FFFFFF",
  panelBg: "#EDEDED",
  textBlock: "#D8D8D8",
};

// Card-local helpers.
const lx = (x: number) => x - CARD.x;
const ly = (y: number) => y - CARD.y;

/* ── Scene timing (mirrors V1) ────────────────────────────────────────── */
const SCENE_DUR = 180;
const CROSS = 16;
const SCENE_STRIDE = SCENE_DUR - CROSS; // 164
export const TOTAL_FRAMES = SCENES.length * SCENE_STRIDE + CROSS;

/* ────────────────────────────────────────────────────────────────────────── */

type BlockProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  radius?: number;
  /** Local frame (within the current scene) when this block enters. */
  delay: number;
  /** Local frame for shimmer phase. */
  localFrame: number;
  /** Shimmer period in frames (synced across scene). */
  shimmerPeriod: number;
  shimmer?: boolean;
};

const SkelBox: React.FC<BlockProps> = ({
  x,
  y,
  w,
  h,
  fill = COLORS.textBlock,
  radius = 2,
  delay,
  localFrame,
  shimmerPeriod,
  shimmer = true,
}) => {
  const enter = interpolate(localFrame, [delay, delay + 12], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wavePhase = (localFrame % shimmerPeriod) / shimmerPeriod;
  const sweepX = -30 + wavePhase * 160;
  const showShimmer = shimmer && enter > 0.6;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: fill,
        borderRadius: radius,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 4}px)`,
        overflow: "hidden",
      }}
    >
      {showShimmer ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${sweepX}%`,
            width: "40%",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
};

const Circle: React.FC<{
  cx: number;
  cy: number;
  r: number;
  delay: number;
  localFrame: number;
}> = ({ cx, cy, r, delay, localFrame }) => {
  const enter = interpolate(localFrame, [delay, delay + 12], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: 999,
        background: COLORS.textBlock,
        opacity: enter,
        transform: `scale(${0.85 + 0.15 * enter})`,
      }}
    />
  );
};

/* ── Shared scaffold (header + tabs + content panel) ──────────────────── */

const Scaffold: React.FC<{
  localFrame: number;
  shimmerPeriod: number;
  /** Which of the four tabs is filled in (0..3). */
  activeTab: number;
}> = ({ localFrame, shimmerPeriod, activeTab }) => {
  const sb = (props: Omit<BlockProps, "localFrame" | "shimmerPeriod">) => (
    <SkelBox {...props} localFrame={localFrame} shimmerPeriod={shimmerPeriod} />
  );

  return (
    <>
      {sb({ x: lx(545), y: ly(141), w: 353, h: 355, fill: COLORS.innerBg, radius: 0, delay: 0, shimmer: false })}
      {sb({ x: lx(547.25), y: ly(141.25), w: 352.5, h: 41.5, fill: COLORS.headerTint, radius: 0, delay: 2, shimmer: false })}
      {sb({ x: lx(555), y: ly(154), w: 105, h: 15, fill: COLORS.white, delay: 4 })}
      {sb({ x: lx(832), y: ly(154), w: 53, h: 15, fill: COLORS.white, delay: 5 })}
      {[0, 1, 2, 3].map((i) =>
        sb({
          x: lx(555 + i * 86),
          y: ly(197),
          w: 72,
          h: 22,
          fill: i === activeTab ? COLORS.pillActive : COLORS.pillIdle,
          delay: 8 + i,
        })
      )}
      {sb({ x: lx(555), y: ly(233), w: 330, h: 246, fill: COLORS.panelBg, delay: 14, shimmer: false })}
    </>
  );
};

/* ── Layout A: paragraph (Proposal Writing) ───────────────────────────── */

const LayoutParagraph: React.FC<{ localFrame: number; shimmerPeriod: number }> = ({
  localFrame,
  shimmerPeriod,
}) => {
  const TEXT_X = lx(565);
  const lines = [
    { y: ly(245), w: 124, delay: 18 },
    { y: ly(258), w: 124, delay: 20 },
    { y: ly(271), w: 307, delay: 22 },
    { y: ly(284), w: 307, delay: 24 },
    { y: ly(297), w: 307, delay: 26 },
    { y: ly(310), w: 307, delay: 28 },
    { y: ly(323), w: 307, delay: 30 },
    { y: ly(336), w: 307, delay: 32 },
    { y: ly(349), w: 307, delay: 34 },
    { y: ly(362), w: 307, delay: 36 },
    { y: ly(375), w: 307, delay: 38 },
    { y: ly(388), w: 307, delay: 40 },
    { y: ly(401), w: 307, delay: 42 },
    { y: ly(414), w: 307, delay: 44 },
    { y: ly(427), w: 173, delay: 46 },
    { y: ly(460), w: 173, delay: 50 },
  ];
  return (
    <>
      {lines.map((l, i) => (
        <SkelBox
          key={i}
          x={TEXT_X}
          y={l.y}
          w={l.w}
          h={6}
          radius={1}
          delay={l.delay}
          localFrame={localFrame}
          shimmerPeriod={shimmerPeriod}
        />
      ))}
    </>
  );
};

/* ── Layout B: code-block (Software Development) ──────────────────────── */
// Lines of varying widths with subtle indentation, mimicking source code.

const LayoutCode: React.FC<{ localFrame: number; shimmerPeriod: number }> = ({
  localFrame,
  shimmerPeriod,
}) => {
  // Left "gutter" rail (line numbers).
  const GUTTER_X = lx(563);
  // Base indent layers.
  const indent = [0, 16, 32];
  const codeLines: { y: number; indent: number; w: number; delay: number }[] = [
    { y: ly(245), indent: 0, w: 80, delay: 18 },
    { y: ly(258), indent: 0, w: 140, delay: 19 },
    { y: ly(271), indent: 1, w: 180, delay: 21 },
    { y: ly(284), indent: 1, w: 220, delay: 23 },
    { y: ly(297), indent: 2, w: 160, delay: 25 },
    { y: ly(310), indent: 2, w: 200, delay: 27 },
    { y: ly(323), indent: 1, w: 100, delay: 29 },
    { y: ly(336), indent: 0, w: 60, delay: 31 },
    { y: ly(355), indent: 0, w: 230, delay: 34 },
    { y: ly(368), indent: 1, w: 260, delay: 36 },
    { y: ly(381), indent: 2, w: 180, delay: 38 },
    { y: ly(394), indent: 2, w: 140, delay: 40 },
    { y: ly(407), indent: 1, w: 220, delay: 42 },
    { y: ly(420), indent: 0, w: 60, delay: 44 },
    { y: ly(443), indent: 0, w: 110, delay: 46 },
    { y: ly(460), indent: 1, w: 240, delay: 48 },
  ];
  const TEXT_BASE = lx(577); // a bit right of gutter
  return (
    <>
      {/* Faint vertical "gutter" line */}
      <SkelBox
        x={lx(572)}
        y={ly(241)}
        w={1}
        h={228}
        fill="#E2E2E2"
        radius={1}
        delay={16}
        localFrame={localFrame}
        shimmerPeriod={shimmerPeriod}
        shimmer={false}
      />
      {/* Line-number dots */}
      {codeLines.map((l, i) => (
        <SkelBox
          key={`gut-${i}`}
          x={GUTTER_X}
          y={l.y + 1}
          w={4}
          h={4}
          radius={1}
          fill="#CFCFCF"
          delay={l.delay - 2}
          localFrame={localFrame}
          shimmerPeriod={shimmerPeriod}
          shimmer={false}
        />
      ))}
      {codeLines.map((l, i) => (
        <SkelBox
          key={`code-${i}`}
          x={TEXT_BASE + indent[l.indent]}
          y={l.y}
          w={l.w}
          h={6}
          radius={1}
          delay={l.delay}
          localFrame={localFrame}
          shimmerPeriod={shimmerPeriod}
        />
      ))}
    </>
  );
};

/* ── Layout C: list with avatars (Staffing & Recruitment) ─────────────── */

const LayoutList: React.FC<{ localFrame: number; shimmerPeriod: number }> = ({
  localFrame,
  shimmerPeriod,
}) => {
  // 5 rows inside the panel (which spans y: 233..479).
  const rows = [0, 1, 2, 3, 4];
  const ROW_H = 44;
  const ROW_TOP = ly(245);
  return (
    <>
      {rows.map((i) => {
        const yTop = ROW_TOP + i * (ROW_H + 4);
        const delay = 18 + i * 4;
        return (
          <React.Fragment key={i}>
            <Circle
              cx={lx(565) + 14}
              cy={yTop + 14}
              r={11}
              delay={delay}
              localFrame={localFrame}
            />
            <SkelBox
              x={lx(565) + 36}
              y={yTop + 6}
              w={140}
              h={7}
              radius={2}
              delay={delay + 1}
              localFrame={localFrame}
              shimmerPeriod={shimmerPeriod}
            />
            <SkelBox
              x={lx(565) + 36}
              y={yTop + 17}
              w={210}
              h={5}
              radius={1}
              delay={delay + 2}
              localFrame={localFrame}
              shimmerPeriod={shimmerPeriod}
            />
            {/* Right-side mini "status pill" */}
            <SkelBox
              x={lx(565) + 270}
              y={yTop + 9}
              w={36}
              h={10}
              radius={2}
              fill="#CFCFCF"
              delay={delay + 3}
              localFrame={localFrame}
              shimmerPeriod={shimmerPeriod}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

/* ── Layout D: card grid (IT Support Services) ────────────────────────── */

const LayoutGrid: React.FC<{ localFrame: number; shimmerPeriod: number }> = ({
  localFrame,
  shimmerPeriod,
}) => {
  // 2x2 grid of cards inside panel (panel = 330x246 starting at lx(555),ly(233)).
  const CARD_W = 150;
  const CARD_H = 105;
  const gap = 10;
  const startX = lx(565);
  const startY = ly(244);
  const cards = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ] as const;
  return (
    <>
      {cards.map(([cx, cy], i) => {
        const x = startX + cx * (CARD_W + gap);
        const y = startY + cy * (CARD_H + gap);
        const delay = 18 + i * 5;
        return (
          <React.Fragment key={i}>
            {/* Card surface (lighter than panel) */}
            <SkelBox
              x={x}
              y={y}
              w={CARD_W}
              h={CARD_H}
              radius={3}
              fill="#E5E5E5"
              delay={delay}
              localFrame={localFrame}
              shimmerPeriod={shimmerPeriod}
              shimmer={false}
            />
            {/* Title bar */}
            <SkelBox
              x={x + 10}
              y={y + 12}
              w={70}
              h={8}
              radius={2}
              fill="#CFCFCF"
              delay={delay + 2}
              localFrame={localFrame}
              shimmerPeriod={shimmerPeriod}
            />
            {/* Status dot */}
            <Circle
              cx={x + CARD_W - 14}
              cy={y + 16}
              r={4}
              delay={delay + 2}
              localFrame={localFrame}
            />
            {/* Body lines */}
            <SkelBox
              x={x + 10}
              y={y + 32}
              w={CARD_W - 20}
              h={5}
              radius={1}
              delay={delay + 3}
              localFrame={localFrame}
              shimmerPeriod={shimmerPeriod}
            />
            <SkelBox
              x={x + 10}
              y={y + 43}
              w={CARD_W - 40}
              h={5}
              radius={1}
              delay={delay + 4}
              localFrame={localFrame}
              shimmerPeriod={shimmerPeriod}
            />
            <SkelBox
              x={x + 10}
              y={y + 54}
              w={CARD_W - 30}
              h={5}
              radius={1}
              delay={delay + 5}
              localFrame={localFrame}
              shimmerPeriod={shimmerPeriod}
            />
            {/* Mini progress bar */}
            <SkelBox
              x={x + 10}
              y={y + 78}
              w={CARD_W - 20}
              h={4}
              radius={2}
              fill="#D8D8D8"
              delay={delay + 6}
              localFrame={localFrame}
              shimmerPeriod={shimmerPeriod}
              shimmer={false}
            />
            <SkelBox
              x={x + 10}
              y={y + 78}
              w={(CARD_W - 20) * (0.4 + i * 0.15)}
              h={4}
              radius={2}
              fill={COLORS.pillActive}
              delay={delay + 7}
              localFrame={localFrame}
              shimmerPeriod={shimmerPeriod}
              shimmer={false}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

/* ── Per-scene content router ─────────────────────────────────────────── */

const SceneContent: React.FC<{
  scene: Scene;
  localFrame: number;
  shimmerPeriod: number;
}> = ({ scene, localFrame, shimmerPeriod }) => {
  // Active tab — for skeletons we just visually animate the active pill
  // shifting to suggest progress through the workflow.
  const tabFromTime = Math.min(
    3,
    Math.floor(interpolate(localFrame, [30, 160], [0, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))
  );

  return (
    <>
      <Scaffold localFrame={localFrame} shimmerPeriod={shimmerPeriod} activeTab={tabFromTime} />
      {scene.skeleton === "paragraph" ? (
        <LayoutParagraph localFrame={localFrame} shimmerPeriod={shimmerPeriod} />
      ) : null}
      {scene.skeleton === "code" ? (
        <LayoutCode localFrame={localFrame} shimmerPeriod={shimmerPeriod} />
      ) : null}
      {scene.skeleton === "list" ? (
        <LayoutList localFrame={localFrame} shimmerPeriod={shimmerPeriod} />
      ) : null}
      {scene.skeleton === "grid" ? (
        <LayoutGrid localFrame={localFrame} shimmerPeriod={shimmerPeriod} />
      ) : null}
    </>
  );
};

/* ── Top-level banner ─────────────────────────────────────────────────── */

export const BannerV2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shimmerPeriod = 2.4 * fps;

  return (
    <BannerStage cardEntryStart={6} cardEntryDuration={24}>
      {SCENES.map((scene, i) => {
        const sceneStart = i * SCENE_STRIDE;
        const sceneEnd = sceneStart + SCENE_DUR;
        const localFrame = frame - sceneStart;

        const isLast = i === SCENES.length - 1;
        const opacity = isLast
          ? interpolate(frame, [sceneStart, sceneStart + CROSS], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : interpolate(
              frame,
              [sceneStart, sceneStart + CROSS, sceneEnd - CROSS, sceneEnd],
              [0, 1, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
        if (opacity <= 0.001) return null;

        const inLift = interpolate(frame, [sceneStart, sceneStart + CROSS], [6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const outLift = isLast
          ? 0
          : interpolate(frame, [sceneEnd - CROSS, sceneEnd], [0, -6], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              opacity,
              transform: `translateY(${inLift + outLift}px)`,
            }}
          >
            <SceneContent scene={scene} localFrame={localFrame} shimmerPeriod={shimmerPeriod} />
          </div>
        );
      })}
    </BannerStage>
  );
};
