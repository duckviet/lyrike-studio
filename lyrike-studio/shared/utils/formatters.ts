export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return "00:00.00";
  }

  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  const msecs = Math.floor((seconds - whole) * 100);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(msecs).padStart(2, "0")}`;
}
