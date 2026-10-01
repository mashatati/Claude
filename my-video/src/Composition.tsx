import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";

const FPS = 30;
const DURATION = 720;
const SIZE = 1254; // native poster size
const SCALE = 1080 / SIZE;

// Artwork area of the poster (text lives below it and is never touched)
const ART = { x: 56, y: 52, w: 1145, h: 834 };
const DOOR = { x: 627, y: 700 };
const WATER_TOP = 640;

const Poster: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <Img
    src={staticFile("poster.png")}
    style={{ position: "absolute", left: 0, top: 0, width: SIZE, height: SIZE, ...style }}
  />
);

const Art: React.FC = () => {
  const frame = useCurrentFrame();

  const zoom = interpolate(frame, [0, DURATION], [1, 1.09]);
  const zoomStyle: React.CSSProperties = {
    transformOrigin: `${DOOR.x}px ${DOOR.y}px`,
    transform: `scale(${zoom})`,
  };

  const glow = 0.12 + 0.1 * Math.sin(frame / 22) + 0.05 * Math.sin(frame / 7.3);

  // Water ripple: animated turbulence displacement on the reflection only
  const freqX = 0.012 + 0.002 * Math.sin(frame / 40);
  const freqY = 0.045 + 0.005 * Math.cos(frame / 33);
  const seed = Math.floor(frame / 3);

  // Glitch bursts: short windows with horizontal slice offsets
  const burst = Math.floor(frame / 6);
  const glitching = random(`burst-${burst}`) > 0.86;
  const slices = glitching
    ? [0, 1, 2].map((i) => ({
        y: ART.y + random(`y-${burst}-${i}`) * (ART.h - 60),
        h: 8 + random(`h-${burst}-${i}`) * 40,
        dx: (random(`dx-${burst}-${i}`) - 0.5) * 50,
      }))
    : [];

  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="ripple" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${freqX} ${freqY}`}
            numOctaves={2}
            seed={seed % 8}
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={10} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* base artwork with slow push-in */}
      <div style={{ position: "absolute", left: ART.x, top: ART.y, width: ART.w, height: ART.h, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: -ART.x, top: -ART.y, width: SIZE, height: SIZE, ...zoomStyle }}>
          <Poster />
        </div>

        {/* rippling water */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: WATER_TOP - ART.y,
            width: ART.w,
            height: ART.h - (WATER_TOP - ART.y),
            overflow: "hidden",
            filter: "url(#ripple)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -ART.x,
              top: -WATER_TOP,
              width: SIZE,
              height: SIZE,
              ...zoomStyle,
            }}
          >
            <Poster />
          </div>
        </div>

        {/* doorway glow pulse */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            mixBlendMode: "screen",
            opacity: glow,
            background: `radial-gradient(circle at ${DOOR.x - ART.x}px ${DOOR.y - ART.y}px, #d8d0c0 0%, rgba(216,208,192,0) 22%)`,
          }}
        />

        {/* glitch slices */}
        {slices.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: s.y - ART.y,
              width: ART.w,
              height: s.h,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -ART.x + s.dx,
                top: -s.y,
                width: SIZE,
                height: SIZE,
                ...zoomStyle,
              }}
            >
              <Poster />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export const PosterAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 60, DURATION - 45, DURATION], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio src={staticFile("audio.mp3")} />
      <div style={{ opacity, width: 1080, height: 1080, position: "relative", overflow: "hidden" }}>
        <div style={{ width: SIZE, height: SIZE, transform: `scale(${SCALE})`, transformOrigin: "top left", position: "relative" }}>
          {/* static poster: all text stays exactly as designed */}
          <Poster />
          <Art />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const MyComposition = () => (
  <Composition
    id="LimbPoster"
    component={PosterAnimation}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1080}
  />
);
