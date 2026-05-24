export type HomeFeatureId = "waveform" | "transcription" | "tap" | "export";

export interface HomeFeatureDemo {
  id: HomeFeatureId;
  align: "left" | "right";
  surface: "mint" | "slate" | "keylime";
}

export interface TimelineRegion {
  id: string;
  label: string;
  left: number;
  width: number;
}

export const homeFeatures: HomeFeatureDemo[] = [
  { id: "waveform", align: "left", surface: "mint" },
  { id: "transcription", align: "right", surface: "slate" },
  { id: "tap", align: "left", surface: "keylime" },
  { id: "export", align: "right", surface: "mint" },
];

export const timelineRegions: TimelineRegion[] = [
  { id: "intro", label: "Dancing in the moonlight", left: 6, width: 22 },
  { id: "line-2", label: "Spinning round and round", left: 31, width: 26 },
  { id: "line-3", label: "Hands up to the sky", left: 61, width: 18 },
  { id: "line-4", label: "Tonight", left: 82, width: 12 },
];

export const tapMarks = [
  { index: 0, timestamp: "00:15" },
  { index: 1, timestamp: "00:35" },
  { index: 2, timestamp: "00:55" },
  { index: 3, timestamp: "01:15" },
];

export function createWaveBars(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const body = Math.sin(index * 0.42) * 30 + 52;
    const texture = Math.sin(index * 1.7) * 13;
    const accent = index % 9 === 0 ? 16 : 0;

    return Math.round(Math.max(14, Math.min(94, body + texture + accent)));
  });
}

export const heroWaveBars = createWaveBars(96);
export const featureWaveBars = createWaveBars(72);
export const compactWaveBars = createWaveBars(40);
