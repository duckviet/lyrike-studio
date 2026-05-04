import { useTranslations } from "next-intl";
import { ScrollReveal } from "./ScrollReveal";
import {
  useWaveformAnimation,
  useTranscriptionLoop,
  useTapSyncLoop,
  useExportAnimation,
} from "../hooks";

export function FeatureCards() {
  const t = useTranslations("home.features");

  const features = [
    {
      id: "waveform",
      image: "waveform",
      align: "left",
    },
    {
      id: "transcription",
      image: "transcription",
      align: "right",
    },
    {
      id: "tap",
      image: "tap",
      align: "left",
    },
    {
      id: "export",
      image: "export",
      align: "right",
    },
  ];

  // Card component with hooks
  const FeatureCard = ({ feature }: { feature: (typeof features)[0] }) => {
    const waveform = useWaveformAnimation();
    const transcription = useTranscriptionLoop();
    const tapSync = useTapSyncLoop();
    const exportAnim = useExportAnimation();

    return (
      <div className="bg-linear-to-b from-[#1a1d24] to-[#0f1115] rounded-2xl p-6 min-h-[280px] shadow-ink-lg group hover:shadow-ink-xl transition-shadow duration-300">
        {feature.image === "waveform" && (
          <div className="feature-card-waveform relative flex flex-col h-full gap-4">
            {/* Ruler ticks */}
            <div className="flex items-center justify-between text-[10px] text-white/40 px-1">
              <span>0:00</span>
              <span>1:00</span>
              <span>2:00</span>
            </div>

            {/* Waveform with playhead */}
            <div className="relative flex items-center gap-0.5 h-32 px-2 bg-black/20 rounded-lg overflow-hidden">
              {Array.from({ length: 80 }).map((_, i) => {
                const isInActiveRegion =
                  (waveform.activeRegion === 0 && i >= 8 && i <= 28) ||
                  (waveform.activeRegion === 1 && i >= 32 && i <= 60) ||
                  (waveform.activeRegion === 2 && i >= 68);
                return (
                  <div
                    key={i}
                    className={`flex-1 bg-linear-to-t rounded-sm min-w-[2px] transition-all duration-75 ${
                      isInActiveRegion
                        ? "from-primary to-primary/40"
                        : "from-primary/50 to-primary/20"
                    }`}
                    style={{
                      height: `${((i * 19) % 70) + 15}%`,
                    }}
                  />
                );
              })}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-accent/80 z-10 pointer-events-none"
                style={{
                  left: `${waveform.playheadPosition}%`,
                }}
              />

              {/* Active regions highlight */}
              {waveform.activeRegion >= 0 && (
                <div
                  className="absolute top-0 bottom-0 bg-accent/10 border-l border-r border-accent/30 z-0"
                  style={{
                    left:
                      waveform.activeRegion === 0
                        ? "10%"
                        : waveform.activeRegion === 1
                          ? "40%"
                          : "85%",
                    width:
                      waveform.activeRegion === 0
                        ? "25%"
                        : waveform.activeRegion === 1
                          ? "35%"
                          : "15%",
                  }}
                />
              )}
            </div>

            {/* Time counter */}
            <div className="flex justify-between items-center text-xs font-mono text-white/70">
              <span>{waveform.timeDisplay}</span>
              <span>4:48</span>
            </div>
          </div>
        )}

        {feature.image === "transcription" && (
          <div className="feature-card-transcription flex flex-col gap-4 h-full">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    transcription.isLoading ? "bg-primary/50" : "bg-accent"
                  }`}
                  style={{
                    width: `${transcription.progress}%`,
                  }}
                />
              </div>
              <span className="text-xs text-white/60 font-mono">
                {transcription.isLoading ? "Loading..." : "Done!"}
              </span>
              {!transcription.isLoading && (
                <span className="text-accent">✓</span>
              )}
            </div>

            {/* Lyrics with highlighting */}
            <div className="flex flex-col gap-3">
              {transcription.lyrics.map((lyric, idx) => (
                <div
                  key={idx}
                  className={`transition-all duration-300 ${
                    lyric.visible
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-[-8px]"
                  }`}
                >
                  <div
                    className={`flex gap-2 font-mono text-xs px-2 py-1 rounded ${
                      lyric.visible
                        ? "bg-primary/20 text-white/90"
                        : "text-white/50"
                    }`}
                  >
                    <span className="text-primary shrink-0">
                      {lyric.timestamp}
                    </span>
                    <span>{lyric.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {feature.image === "tap" && (
          <div className="feature-card-tap flex flex-col gap-4 h-full justify-center">
            {/* Clock display */}
            <div className="text-center">
              <div className="font-mono text-2xl text-white/90 tracking-wider">
                {tapSync.clock}
              </div>
              <div className="text-xs text-white/40 mt-1">Playing</div>
            </div>

            {/* Tap buttons with state */}
            <div className="flex gap-2 justify-center">
              {tapSync.tapMarks.map((mark) => (
                <div
                  key={mark.index}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm transition-all duration-200 ${
                    mark.active
                      ? "bg-primary/40 border-2 border-primary text-primary scale-110"
                      : "bg-white/8 border border-white/15 text-white/30"
                  }`}
                >
                  {mark.index + 1}
                </div>
              ))}
            </div>

            {/* Mini waveform indicator */}
            <div className="flex items-center gap-1 h-12 px-2 bg-black/30 rounded-lg">
              {tapSync.waveformBars.map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 bg-primary/40 rounded-sm transition-all duration-100 ${
                    tapSync.waveformAnimating ? "opacity-100" : "opacity-60"
                  }`}
                  style={{
                    height: `${height * 0.6 + 40}%`,
                  }}
                />
              ))}
            </div>

            {/* Tap instructions */}
            <div className="text-center text-xs text-white/50">
              Tap sequence:{" "}
              {tapSync.tapMarks.filter((m) => m.active).length + 1}/4
            </div>
          </div>
        )}

        {feature.image === "export" && (
          <div className="feature-card-export h-full flex flex-col gap-4">
            {/* File header */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-accent text-white text-[10px] font-bold rounded uppercase">
                LRC
              </span>
              <span className="font-mono text-sm text-white/90">
                my-song.lrc
              </span>
            </div>

            {/* LRC content with line highlighting */}
            <div className="flex-1 bg-black/30 rounded-lg p-3 overflow-hidden">
              <code className="font-mono text-xs text-white/70 leading-relaxed">
                {exportAnim.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`transition-all duration-200 ${
                      line.highlighted
                        ? "bg-primary/30 text-white/95"
                        : "text-white/70"
                    }`}
                  >
                    {line.text}
                  </div>
                ))}
              </code>
            </div>

            {/* Download button with state machine */}
            <button
              className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all duration-300 ${
                exportAnim.downloadState === "idle"
                  ? "bg-accent text-white hover:bg-accent-warm"
                  : exportAnim.downloadState === "preparing"
                    ? "bg-primary/40 text-primary/90"
                    : "bg-accent/60 text-white"
              }`}
              disabled={exportAnim.downloadState !== "idle"}
            >
              {exportAnim.downloadState === "idle"
                ? "📥 Download"
                : exportAnim.downloadState === "preparing"
                  ? "⏳ Preparing..."
                  : "✓ Downloaded!"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="py-20 px-8">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-20">
        {features.map((feature, index) => (
          <ScrollReveal
            key={feature.id}
            delay={index * 100}
            className={`grid md:grid-cols-2 gap-16 items-center ${feature.align === "right" ? "direction-rtl" : ""}`}
          >
            <div className={feature.align === "right" ? "md:order-2" : ""}>
              <span className="block text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4">
                {t(`${feature.id}.label`)}
              </span>
              <h3 className="font-serif text-xl font-normal text-ink leading-tight mb-4">
                {t(`${feature.id}.title`)}
              </h3>
              <p className="text-base leading-relaxed text-ink/70 m-0">
                {t(`${feature.id}.description`)}
              </p>
            </div>
            <div className={feature.align === "right" ? "md:order-1" : ""}>
              <FeatureCard feature={feature} />
            </div>
          </ScrollReveal>
        ))}
      </div>

      <style jsx>{`
        @keyframes barPulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        .feature-card-waveform {
          animation: none;
        }
      `}</style>
    </section>
  );
}