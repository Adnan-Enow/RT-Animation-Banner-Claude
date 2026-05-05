import "./index.css";
import { Composition } from "remotion";
import { BannerV1, TOTAL_FRAMES as V1_FRAMES } from "./BannerV1";
import { BannerV2, TOTAL_FRAMES as V2_FRAMES } from "./BannerV2";

// 1452x709 matches the SVG concepts. 30fps. 4 scenes × ~6s each ≈ 22s.
const WIDTH = 1452;
const HEIGHT = 709;
const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BannerV1"
        component={BannerV1}
        durationInFrames={V1_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="BannerV2"
        component={BannerV2}
        durationInFrames={V2_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
