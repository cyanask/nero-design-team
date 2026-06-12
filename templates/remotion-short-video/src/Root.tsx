import { Composition } from "remotion";
import { SignalVideo } from "./SignalVideo";

export function RemotionRoot() {
  return (
    <Composition
      id="NEROSignalVideo"
      component={SignalVideo}
      durationInFrames={210}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        title: "AI 产业链周度信号",
        keyMetric: "42",
        caption: "条产业信号进入复核队列，其中 7 条为高影响信号。"
      }}
    />
  );
}
