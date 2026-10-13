import { WAVEFORM } from "@/shared/config/constants";

const RATIO = WAVEFORM.MAX_ZOOM / WAVEFORM.MIN_ZOOM;

/** Slider position (0..ZOOM_SLIDER_STEPS) -> px per second, logarithmic. */
export function sliderToZoom(position: number): number {
  const t = Math.min(1, Math.max(0, position / WAVEFORM.ZOOM_SLIDER_STEPS));
  return Math.round(WAVEFORM.MIN_ZOOM * Math.pow(RATIO, t));
}

/** px per second -> slider position (0..ZOOM_SLIDER_STEPS). */
export function zoomToSlider(pxPerSec: number): number {
  const clamped = Math.min(
    WAVEFORM.MAX_ZOOM,
    Math.max(WAVEFORM.MIN_ZOOM, pxPerSec),
  );
  const t = Math.log(clamped / WAVEFORM.MIN_ZOOM) / Math.log(RATIO);
  return Math.round(t * WAVEFORM.ZOOM_SLIDER_STEPS);
}
