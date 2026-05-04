import { ScrollReveal } from "./ScrollReveal";

export function MetricsBar() {
  return (
    <section className="py-8">
      <div className="max-w-[1200px] mx-auto px-4">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-0 rounded-2xl border border-white/10 bg-zinc-950/40 backdrop-blur-xl p-8 md:p-10">
            {/* Item 1 */}
            <div className="flex flex-1 flex-col items-center md:items-start text-center md:text-left">
              <div className="text-4xl font-semibold tracking-[-1.5px]">
                LRC
              </div>
              <div className="mt-1 text-sm text-white/60">
                Industry standard
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px self-stretch bg-white/10" />

            {/* Item 2 */}
            <div className="flex flex-1 flex-col items-center text-center">
              <div className="text-4xl font-semibold tracking-[-1.5px]">
                No account
              </div>
              <div className="mt-1 text-sm text-white/60">
                No sign-up needed
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px self-stretch bg-white/10" />

            {/* Item 3 */}
            <div className="flex flex-1 flex-col items-center md:items-end text-center md:text-right">
              <div className="text-4xl font-semibold tracking-[-1.5px]">
                Free
              </div>
              <div className="mt-1 text-sm text-white/60">
                Open source-friendly
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default MetricsBar;
