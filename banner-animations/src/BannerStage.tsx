import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

/**
 * Shared stage: white background, soft blurred blue blob, faint grid lines,
 * and a centered glass card. Children are rendered inside the card content area.
 *
 * Card geometry from the source SVGs:
 *   Card outer:   x=537,  y=120,  w=378,  h=475
 *   Inner area:   x=545,  y=141,  w=353,  h=355
 *   Footer divider line at y=542 (inside card)
 */

export const CARD = {
  x: 537,
  y: 120,
  w: 378,
  h: 475,
} as const;

export const INNER = {
  x: 545,
  y: 141,
  w: 353,
  h: 355,
} as const;

const GridLines: React.FC = () => {
  // Faint white grid lines from the SVG (opacity ~0.33).
  // We render them as absolutely positioned divs inside a 1452x709 stage.
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

  // Very subtle breathing — never distracting.
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
  // The actual card window — rendered as a translucent glass surface.
  // `progress` controls the entrance (0 → 1).
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
  // Footer "click to skip" row inside the card.
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
      {/* Divider */}
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
      {/* Left circle "info" icon */}
      <svg
        style={{ position: "absolute", left: 14, top: 564 - CARD.y }}
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
      >
        <circle cx="9" cy="9" r="7.9" stroke="#D8D8D8" strokeWidth="1.1" />
        <line
          x1="9"
          y1="5.9"
          x2="9"
          y2="12.7"
          stroke="#D8D8D8"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <line
          x1="5.9"
          y1="9.3"
          x2="12.7"
          y2="9.3"
          stroke="#D8D8D8"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
      {/* Skip text */}
      <div
        style={{
          position: "absolute",
          left: 38,
          top: 568 - CARD.y,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, system-ui, sans-serif',
          fontSize: 11,
          fontWeight: 500,
          color: "#454545",
          letterSpacing: 0.1,
        }}
      >
        Click to skip and start writing the proposal...
      </div>
      {/* Right paper-plane icon */}
      <svg
        style={{ position: "absolute", right: 14, top: 565 - CARD.y }}
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <path
          d="M13.225 1.778C13.55 0.879 12.679 0.008 11.78 0.333L0.791 4.308C-0.111 4.634 -0.22 5.865 0.609 6.346L4.117 8.377L7.25 5.245C7.392 5.107 7.582 5.032 7.779 5.033C7.976 5.035 8.165 5.114 8.304 5.254C8.444 5.393 8.523 5.582 8.525 5.779C8.526 5.977 8.451 6.167 8.314 6.308L5.181 9.441L7.213 12.949C7.693 13.779 8.924 13.669 9.25 12.767L13.225 1.778Z"
          fill="#BABABA"
        />
      </svg>
    </div>
  );
};

export const BannerStage: React.FC<{
  children: React.ReactNode;
  cardEntryStart?: number; // frame
  cardEntryDuration?: number; // frames
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

  // Children fade-in slightly after the card.
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

      {/* Content layer clipped to card bounds */}
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
