import React from "react";
import { Composition } from "remotion";
import { ProyectoVideo, type ProyectoVideoProps } from "./ProyectoVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ProyectoBecaCujae"
        component={ProyectoVideo}
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          title: "Becas CUJAE",
          subtitle: "Demo del proyecto Front_Beca_Cujae",
          videoFile: "demo.webm",
        } satisfies ProyectoVideoProps}
      />
    </>
  );
};
