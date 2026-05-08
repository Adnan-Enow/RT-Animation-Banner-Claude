import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BannerStage, INNER, CARD } from "./BannerStage";
import { SCENES, Scene, TAB_BOUNDARIES } from "./scenes";

/* ────────────────────────────────────────────────────────────────────────────
 * V1 — Multi-scene UI banner. Same card stays mounted; inner content (title,
 * tabs, step rows) cross-fades between four service pillars.
 * ──────────────────────────────────────────────────────────────────────────── */

const COLORS = {
  brand: "#3362F3",
  brandSoft: "#EDF2FF",
  headerTint: "#D4DFFE",
  innerBg: "#F7F7F7",
  pillIdle: "#EDEDED",
  trackIdle: "#D8D8D8",
  text: "#454545",
  textMuted: "#7A7A7A",
};

const FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, system-ui, sans-serif';

const innerLeft = INNER.x - CARD.x;
const innerTop = INNER.y - CARD.y;
const innerW = INNER.w;
const innerH = INNER.h;

const STEP_ROWS = [
  { y: 240 - CARD.y, h: 45 },
  { y: 291 - CARD.y, h: 45 },
  { y: 342 - CARD.y, h: 45 },
  { y: 393 - CARD.y, h: 45 },
  { y: 444 - CARD.y, h: 45 },
];

const TAB_X = [555 - CARD.x, 641 - CARD.x, 727 - CARD.x, 813 - CARD.x];
const BG_BAR_X = 555 - CARD.x;
const BG_BAR_W = 330;

const SCENE_DUR = 180;
const CROSS = 16;
const SCENE_STRIDE = SCENE_DUR - CROSS;
export const TOTAL_FRAMES = SCENES.length * SCENE_STRIDE + CROSS;

const useTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const Spinner: React.FC = () => {
  const t = useTime();
  const angle = (t * 360 * 1.2) % 360;
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: `rotate(${angle}deg)` }}>
      <circle cx="6" cy="6" r="4.5" stroke={COLORS.trackIdle} strokeWidth="1.4" fill="none" />
      <path
        d="M6 1.5 A4.5 4.5 0 0 1 10.5 6"
        stroke={COLORS.brand}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};

const IdleDot: React.FC = () => (
  <div
    style={{
      width: 8,
      height: 8,
      borderRadius: 999,
      border: `1.4px solid ${COLORS.trackIdle}`,
    }}
  />
);

const Check: React.FC<{ pop: number }> = ({ pop }) => {
  const scale = interpolate(pop, [0, 0.6, 1], [0.6, 1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(pop, [0, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const draw = interpolate(pop, [0.3, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pathLen = 14;
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: 999,
        background: COLORS.brand,
        opacity,
        transform: `scale(${scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
        <path
          d="M1.5 4.6 L3.7 6.7 L7.6 2.4"
          stroke="#fff"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLen}
          strokeDashoffset={pathLen * (1 - draw)}
        />
      </svg>
    </div>
  );
};

const StepRow: React.FC<{
  index: number;
  label: string;
  rowEntry: number;
  fill: number;
  done: number;
  active: boolean;
}> = ({ index, label, rowEntry, fill, done, active }) => {
  const row = STEP_ROWS[index];
  const opacity = interpolate(rowEntry, [0, 1], [0, 1]);
  const slide = interpolate(rowEntry, [0, 1], [6, 0]);

  const t = useTime();
  const glow = active ? Math.sin(t * 4) * 0.5 + 0.5 : 0;
  const borderColor = active ? `rgba(51, 98, 243, ${0.18 + glow * 0.18})` : "transparent";

  return (
    <div
      style={{
        position: "absolute",
        left: BG_BAR_X,
        top: row.y,
        width: BG_BAR_W,
        height: row.h,
        opacity,
        transform: `translateY(${slide}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: COLORS.brandSoft,
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 9,
          fontFamily: FONT,
          fontSize: 11,
          fontWeight: 600,
          color: COLORS.text,
          letterSpacing: 0.1,
        }}
      >
        {String(index + 1).padStart(2, "0")} · {label}
      </div>
      <div
        style={{
          position: "absolute",
          right: 10,
          top: 9,
          width: 14,
          height: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {done > 0 ? <Check pop={done} /> : active ? <Spinner /> : <IdleDot />}
      </div>
      <div
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          top: 30,
          height: 4,
          background: COLORS.trackIdle,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${fill * 100}%`,
            background: COLORS.brand,
            borderRadius: 2,
          }}
        />
        {active && fill > 0 && fill < 1 ? (
          <div
            style={{
              position: "absolute",
              left: `calc(${fill * 100}% - 12px)`,
              top: 0,
              bottom: 0,
              width: 12,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 100%)",
              filter: "blur(0.5px)",
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

type ScenarioContentProps = { scene: Scene; localFrame: number };

const ScenarioContent: React.FC<ScenarioContentProps> = ({ scene, localFrame }) => {
  const headerProgress = interpolate(localFrame, [0, 14], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tabsEntry = interpolate(localFrame, [4, 22], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rowsStart = 14;
  const rowEntry = (i: number) =>
    interpolate(localFrame, [rowsStart + i * 3, rowsStart + i * 3 + 14], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const seqStart = 30;
  const fillDur = 20;
  const checkDur = 6;
  const gap = 2;
  const stepBlock = fillDur + checkDur + gap;

  const fillFor = (i: number) =>
    interpolate(
      localFrame,
      [seqStart + i * stepBlock, seqStart + i * stepBlock + fillDur],
      [0, 1],
      {
        easing: Easing.bezier(0.45, 0, 0.25, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );
  const doneFor = (i: number) =>
    interpolate(
      localFrame,
      [seqStart + i * stepBlock + fillDur, seqStart + i * stepBlock + fillDur + checkDur],
      [0, 1],
      {
        easing: Easing.bezier(0.34, 1.4, 0.64, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );
  const isActive = (i: number) => {
    const start = seqStart + i * stepBlock;
    const end = start + fillDur;
    return localFrame >= start && localFrame < end;
  };

  let activeTab = 0;
  for (let i = 0; i < TAB_BOUNDARIES.length; i++) {
    if (localFrame >= seqStart + TAB_BOUNDARIES[i] * stepBlock) activeTab = i;
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: innerLeft,
          top: innerTop,
          width: innerW,
          height: innerH,
          background: COLORS.innerBg,
          opacity: headerProgress,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 547.25 - CARD.x,
          top: 141.25 - CARD.y,
          width: 352.5,
          height: 41.5,
          background: COLORS.headerTint,
          opacity: 0.5 * headerProgress,
          border: "0.5px solid white",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 12 + (545 - CARD.x),
          top: 14 + (141 - CARD.y),
          fontFamily: FONT,
          fontSize: 11,
          fontWeight: 600,
          color: COLORS.text,
          letterSpacing: 0.1,
          opacity: headerProgress,
          transform: `translateY(${(1 - headerProgress) * 4}px)`,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          position: "absolute",
          right: 14 + (CARD.x + CARD.w - (545 + 353)),
          top: 14 + (141 - CARD.y),
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: 500,
          color: COLORS.textMuted,
          opacity: headerProgress,
          transform: `translateY(${(1 - headerProgress) * 4}px)`,
        }}
      >
        {scene.author}
      </div>

      {scene.tabs.map((label, i) => {
        const local = interpolate(tabsEntry, [i * 0.15, i * 0.15 + 0.6], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const isAct = i === activeTab;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: TAB_X[i],
              top: 197 - CARD.y,
              width: 72,
              height: 22,
              borderRadius: 2,
              background: isAct ? COLORS.brand : COLORS.pillIdle,
              opacity: local,
              transform: `translateY(${(1 - local) * 4}px)`,
              fontFamily: FONT,
              fontSize: 10,
              fontWeight: 600,
              color: isAct ? "#fff" : COLORS.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              letterSpacing: 0.2,
            }}
          >
            {label}
          </div>
        );
      })}

      {scene.steps.map((label, i) => (
        <StepRow
          key={i}
          index={i}
          label={label}
          rowEntry={rowEntry(i)}
          fill={fillFor(i)}
          done={doneFor(i)}
          active={isActive(i)}
        />
      ))}
    </>
  );
};

export const BannerV1: React.FC = () => {
  const frame = useCurrentFrame();

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
            <ScenarioContent scene={scene} localFrame={localFrame} />
          </div>
        );
      })}
    </BannerStage>
  );
};
