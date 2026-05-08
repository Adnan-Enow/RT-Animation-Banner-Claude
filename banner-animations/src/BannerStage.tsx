import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { CirclePlus, Send } from "lucide-react";
import { loadFont } from "@remotion/google-fonts/Inter";

// Load Inter at module init so it's available during renders.
// Restricted to one weight + Latin subset to avoid 100+ network requests.
const { fontFamily: INTER } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

/**
 * Shared stage: white background, soft blurred blue blob, faint grid lines,
 * and a centered glass card. Children render inside the card content area.
 */

export const CARD = { x: 537, y: 120, w: 378, h: 475 } as const;
export const INNER = { x: 545, y: 141, w: 353, h: 355 } as const;

const GridLines: React.FC = () => {
  const v = (x: number) => (
    <div
      key={`v-${x}`}
      style={{
        position: "absolute",
        left: x,
        top: 0,
        bottom: 0,
        width: 1,
        background: "rgba(255,255,255,0.33)",
      }}
    />
  );
  const h = (y: number) => (
    <div
      key={`h-${y}`}
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        height: 1,
        background: "rgba(255,255,255,0.33)",
      }}
    />
  );
  return (
    <>
      {v(99.5)}
      {v(537.5)}
      {v(915.5)}
      {v(1392.5)}
      {h(69.5)}
      {h(119.5)}
      {h(594.5)}
      {h(637.5)}
    </>
  );
};

const BackgroundBlob: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const scale = 1 + Math.sin(t * 0.6) * 0.015;
  const drift = Math.sin(t * 0.4) * 6;

  return (
    <svg
      width={1452}
      height={709}
      viewBox="0 0 1452 709"
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${drift}px, ${-drift * 0.3}px) scale(${scale})`,
        transformOrigin: "50% 60%",
      }}
    >
      <defs>
        <filter
          id="bg-blob-blur"
          x="-636.6"
          y="-399.6"
          width="2616.2"
          height="1332.2"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="249.3" />
        </filter>
      </defs>
      <g filter="url(#bg-blob-blur)">
        <path
          d="M152.182 293.319C-12.8918 249.97 -135.683 425.412 -138 434H1479.72C1483.77 322.764 1480.53 112.806 1435.12 162.862C1378.36 225.432 1176.79 115.832 1073.12 100.292C969.439 84.7515 858.811 213.164 664.778 284.322C470.744 355.48 317.255 336.668 152.182 293.319Z"
          fill="#ADC0FA"
        />
      </g>
    </svg>
  );
};

const CardChrome: React.FC<{ progress: number }> = ({ progress }) => {
  const lift = interpolate(progress, [0, 1], [16, 0]);
  const scale = interpolate(progress, [0, 1], [0.985, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x,
        top: CARD.y,
        width: CARD.w,
        height: CARD.h,
        opacity,
        transform: `translateY(${lift}px) scale(${scale})`,
        transformOrigin: "50% 50%",
        background: "rgba(255,255,255,0.86)",
        backdropFilter: "blur(8.8px)",
        WebkitBackdropFilter: "blur(8.8px)",
        border: "0.76px solid rgba(255,255,255,0.71)",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 30px 60px -20px rgba(60, 80, 160, 0.18), 0 8px 24px -8px rgba(60, 80, 160, 0.12)",
        borderRadius: 4,
        overflow: "hidden",
      }}
    />
  );
};

const CardFooter: React.FC<{ progress: number }> = ({ progress }) => {
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x,
        top: CARD.y,
        width: CARD.w,
        height: CARD.h,
        opacity,
        pointerEvents: "none",
      }}
    >
      {/* Divider above the footer row */}
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 17,
          top: 542 - CARD.y,
          height: 1,
          background: "#F3F3F3",
        }}
      />
      {/* Footer row — flex container keeps icons + text on a shared baseline */}
      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          top: 558 - CARD.y,
          height: 24,
          display: "flex",
          alignItems: "center",
        }}
      >
        <CirclePlus size={16} color="#A8A8A8" strokeWidth={1.6} />
        <span
          style={{
            marginLeft: 10,
            flex: 1,
            fontFamily: INTER,
            fontSize: 11,
            fontWeight: 500,
            color: "#454545",
            letterSpacing: 0.05,
            lineHeight: 1,
          }}
        >
          Click to skip and start writing the proposal...
        </span>
        <Send size={14} color="#A8A8A8" strokeWidth={1.6} />
      </div>
    </div>
  );
};

export const BannerStage: React.FC<{
  children: React.ReactNode;
  cardEntryStart?: number;
  cardEntryDuration?: number;
  showFooter?: boolean;
}> = ({ children, cardEntryStart = 6, cardEntryDuration = 24, showFooter = true }) => {
  const frame = useCurrentFrame();

  const cardProgress = interpolate(
    frame,
    [cardEntryStart, cardEntryStart + cardEntryDuration],
    [0, 1],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const contentProgress = interpolate(
    frame,
    [cardEntryStart + 12, cardEntryStart + cardEntryDuration + 6],
    [0, 1],
    {
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill style={{ background: "#ffffff" }}>
      <BackgroundBlob />
      <GridLines />
      <CardChrome progress={cardProgress} />
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          overflow: "hidden",
          opacity: contentProgress,
          transform: `translateY(${interpolate(contentProgress, [0, 1], [6, 0])}px)`,
          borderRadius: 4,
        }}
      >
        {children}
      </div>
      {showFooter ? <CardFooter progress={contentProgress} /> : null}
    </AbsoluteFill>
  );
};
