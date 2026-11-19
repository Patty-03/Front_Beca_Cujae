import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  Video,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type ProyectoVideoProps = {
  title: string;
  subtitle: string;
  videoFile?: string;
};

const bg: React.CSSProperties = {
  background: "linear-gradient(135deg, #003366 0%, #006a4e 100%)",
  color: "white",
  fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 24,
  padding: 40,
  backdropFilter: "blur(6px)",
};

const TitleScene: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame, config: { damping: 200 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(s, [0, 1], [40, 0]);
  return (
    <AbsoluteFill style={{ ...bg, justifyContent: "center", alignItems: "center" }}>
      <div style={{ ...card, width: 900, textAlign: "center", opacity, transform: `translateY(${y}px)` }}>
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", opacity: 0.85 }}>
          CUJAE · Residencia
        </div>
        <h1 style={{ fontSize: 84, margin: "24px 0 12px", lineHeight: 1 }}>{title}</h1>
        <p style={{ fontSize: 34, margin: 0, opacity: 0.92 }}>{subtitle}</p>
      </div>
    </AbsoluteFill>
  );
};

const DemoScene: React.FC<{ videoFile?: string }> = ({ videoFile }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 20, 700], [1.03, 1, 1.02], { extrapolateRight: "clamp" });
  if (!videoFile) {
    return (
      <AbsoluteFill style={{ ...bg, justifyContent: "center", alignItems: "center", padding: 80 }}>
        <div style={{ ...card, fontSize: 40, textAlign: "center" }}>
          Coloca un video capturado en <code>video/public/demo.webm</code> y vuelve a renderizar.
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1220", opacity }}>
      <Video
        src={staticFile(videoFile)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }}
      />
      <div
        style={{
          position: "absolute",
          left: 40,
          bottom: 32,
          padding: "14px 20px",
          borderRadius: 14,
          background: "rgba(0,51,102,0.82)",
          color: "white",
          fontSize: 28,
          fontWeight: 600,
        }}
      >
        Demo navegable · Front_Beca_Cujae
      </div>
    </AbsoluteFill>
  );
};

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ ...bg, justifyContent: "center", alignItems: "center" }}>
      <div style={{ ...card, textAlign: "center", opacity, transform: `translateY(${y}px)` }}>
        <h2 style={{ fontSize: 64, margin: 0 }}>Vue 3 + Vite · Gestión de Residencia</h2>
        <p style={{ fontSize: 30, marginTop: 20, opacity: 0.9 }}>
          Video generado con Remotion Studio / CLI
        </p>
      </div>
    </AbsoluteFill>
  );
};

export const ProyectoVideo: React.FC<ProyectoVideoProps> = ({ title, subtitle, videoFile }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence from={0} durationInFrames={90}>
        <TitleScene title={title} subtitle={subtitle} />
      </Sequence>
      <Sequence from={90} durationInFrames={720}>
        <DemoScene videoFile={videoFile} />
      </Sequence>
      <Sequence from={810} durationInFrames={90}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
