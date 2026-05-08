import {Composition} from 'remotion';
import {ProposalScene} from './ProposalScene';
import {SDScene} from './SDScene';
import {StaffingScene} from './StaffingScene';

// 5s loop @ 30fps = 150 frames
export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="proposal-scene"
        component={ProposalScene}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="sd-scene"
        component={SDScene}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="staffing-scene"
        component={StaffingScene}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
