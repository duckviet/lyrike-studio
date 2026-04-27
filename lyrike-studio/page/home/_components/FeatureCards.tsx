"use client";

import { ScrollReveal } from "./ScrollReveal";

const features = [
  {
    label: "WAVEFORM EDITING",
    title: "Drag. Resize. Done.",
    description: "See every syllable on the timeline. Drag regions to align with the music. Resize with precision using intuitive handles.",
    image: "waveform",
    align: "left",
  },
  {
    label: "AUTO TRANSCRIPTION",
    title: "Paste a link. Get lyrics back.",
    description: "Drop a YouTube URL and let our transcription service extract the audio and generate timed lyrics for you to fine-tune.",
    image: "transcription",
    align: "right",
  },
  {
    label: "TAP SYNC",
    title: "Sync with your ears, not your eyes.",
    description: "Play the track and tap any key to mark each line. The rhythm stays in your fingers, not in tedious timestamp hunting.",
    image: "tap",
    align: "left",
  },
  {
    label: "EXPORT",
    title: "One click to .lrc",
    description: "Download industry-standard LRC files. Compatible with all major lyric players, karaoke apps, and subtitle editors.",
    image: "export",
    align: "right",
  },
];

export function FeatureCards() {
  return (
    <section className="py-20 px-8">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-20">
        {features.map((feature, index) => (
          <ScrollReveal
            key={feature.label}
            delay={index * 100}
            className={`grid md:grid-cols-2 gap-16 items-center ${feature.align === "right" ? "direction-rtl" : ""}`}
          >
            <div className={feature.align === "right" ? "md:order-2" : ""}>
              <span className="block text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4">
                {feature.label}
              </span>
              <h3 className="font-serif text-2xl font-normal text-ink leading-tight mb-4">
                {feature.title}
              </h3>
              <p className="text-base leading-relaxed text-ink-soft m-0">
                {feature.description}
              </p>
            </div>
            <div className={feature.align === "right" ? "md:order-1" : ""}>
              <div className="bg-linear-to-b from-[#1a1d24] to-[#0f1115] rounded-2xl p-6 min-h-[280px] shadow-ink-lg">
                {feature.image === "waveform" && (
                  <div className="relative flex items-center gap-0.5 h-40">
                    {Array.from({ length: 80 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-linear-to-t from-primary to-primary/20 rounded-sm min-w-[2px]"
                        style={{ height: `${((i * 19) % 70) + 15}%` }}
                      />
                    ))}
                    <div className="absolute top-[10%] bottom-[10%] bg-indigo/30 border border-indigo/60 rounded flex items-center justify-center text-xs text-white/90" style={{ left: "10%", width: "25%" }}>
                      First half
                    </div>
                    <div className="absolute top-[10%] bottom-[10%] bg-indigo/30 border border-indigo/60 rounded flex items-center justify-center text-xs text-white/90" style={{ left: "40%", width: "35%" }}>
                      Second part
                    </div>
                  </div>
                )}
                {feature.image === "transcription" && (
                  <div className="flex flex-col gap-6 h-full">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg text-white/70 text-sm">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                      Analyzing audio...
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-4 font-mono text-xs">
                        <span className="text-primary shrink-0">[00:05.00]</span>
                        <span className="text-white/80">♪ La la la la ♪</span>
                      </div>
                      <div className="flex gap-4 font-mono text-xs">
                        <span className="text-primary shrink-0">[00:08.50]</span>
                        <span className="text-white/80">Dancing in the moonlight</span>
                      </div>
                    </div>
                  </div>
                )}
                {feature.image === "tap" && (
                  <div className="flex flex-col gap-6 h-full justify-center">
                    <div className="flex gap-2">
                      <div className="w-12 h-12 flex items-center justify-center bg-primary/20 border border-primary rounded-lg text-primary shadow-primary/30 shadow-lg">●</div>
                      <div className="w-12 h-12 flex items-center justify-center bg-white/8 border border-white/15 rounded-lg text-white/40">○</div>
                      <div className="w-12 h-12 flex items-center justify-center bg-white/8 border border-white/15 rounded-lg text-white/40">○</div>
                      <div className="w-12 h-12 flex items-center justify-center bg-white/8 border border-white/15 rounded-lg text-white/40">○</div>
                    </div>
                    <div className="relative h-10 bg-white/5 rounded-lg">
                      <div className="absolute top-2 bottom-2 w-0.5 bg-primary rounded" style={{ left: "15%" }} />
                      <div className="absolute top-2 bottom-2 w-0.5 bg-primary rounded" style={{ left: "35%" }} />
                      <div className="absolute top-2 bottom-2 w-0.5 bg-primary rounded" style={{ left: "55%" }} />
                      <div className="absolute top-2 bottom-2 w-0.5 bg-primary rounded" style={{ left: "75%" }} />
                    </div>
                  </div>
                )}
                {feature.image === "export" && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2 py-1 bg-accent text-white text-[10px] font-bold rounded uppercase">LRC</span>
                      <span className="font-mono text-sm text-white/90">my-song.lrc</span>
                    </div>
                    <div className="flex-1 bg-black/30 rounded-lg p-4 overflow-hidden">
                      <code className="font-mono text-xs text-white/70 leading-relaxed">
                        [00:12.34]First line here<br />
                        [00:15.67]Second line here<br />
                        [00:18.90]Third line here
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}