import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { remotionTheme } from "../../../build/themes/remotion-theme";
import "./style.css";

type Props = {
  title: string;
  keyMetric: string;
  caption: string;
};

export function SignalVideo({ title, keyMetric, caption }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18 } });
  const opacity = interpolate(frame, [0, remotionTheme.motion.duration.scene], [0, 1], {
    extrapolateRight: "clamp"
  });

  return (
    <AbsoluteFill className="video-shell">
      <div className="video-header" style={{ opacity }}>
        <span>AI INDUSTRY RESEARCH</span>
        <span>NERO</span>
      </div>
      <div className="video-body" style={{ transform: `translateY(${(1 - enter) * 48}px)` }}>
        <h1>{title}</h1>
        <div className="metric-line">
          <strong>{keyMetric}</strong>
          <span>signals</span>
        </div>
        <p>{caption}</p>
      </div>
      <div className="video-footer">示例模板，不含真实投资结论</div>
    </AbsoluteFill>
  );
}
