"use client";

import "../home/home.css";
import { useEffect, useState } from "react";
import { ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/shared/lib/i18n/navigation";
import { draftManager } from "@/features/playback/model/useDraft";
import type { DraftSummary } from "@/shared/utils/draftManager";

export function ProjectsPage() {
  const t = useTranslations("dashboard.projects");
  const format = useFormatter();
  // null until mounted: localStorage is client-only
  const [projects, setProjects] = useState<DraftSummary[] | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read localStorage after hydration
    setProjects(draftManager.list());
    setNow(Date.now());
  }, []);

  const onDelete = (project: DraftSummary) => {
    if (!confirm(t("confirmDelete", { title: project.title || project.videoId }))) return;
    draftManager.remove(project.videoId);
    setProjects(draftManager.list());
  };

  return (
    <div className="lyrike-home min-h-full bg-home-canvas text-home-ink">
      <section className="mx-auto w-full max-w-[1440px] px-6 py-12 md:px-8 md:py-16">
        <header className="mb-10 flex flex-col gap-6 border-b border-home-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="home-eyebrow mb-4">{t("eyebrow")}</span>
            <h1 className="text-balance font-serif text-4xl font-normal leading-tight text-home-forest md:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-lg text-base text-home-charcoal/80">{t("subtitle")}</p>
          </div>
          <Link className="home-action shrink-0 self-start bg-home-forest text-home-canvas hover:bg-home-forest/90 md:self-auto" href="/studio">
            <Plus aria-hidden="true" size={18} />
            {t("new")}
          </Link>
        </header>

        {projects?.length === 0 && (
          <div className="flex flex-col items-start gap-6 rounded-[14px] bg-home-keylime p-8 md:p-12">
            <p className="max-w-md font-serif text-2xl leading-snug text-home-forest">{t("empty")}</p>
            <Link className="home-action bg-home-forest text-home-canvas hover:bg-home-forest/90" href="/studio">
              {t("new")}
              <ArrowUpRight aria-hidden="true" size={18} />
            </Link>
          </div>
        )}

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects?.map((project, index) => (
            <li
              className="group flex flex-col rounded-[14px] bg-home-keylime p-3 transition-colors duration-150 hover:bg-home-mint-kiss"
              key={project.videoId}
            >
              <Link className="flex flex-1 flex-col rounded-[10px]" href={`/studio?v=${encodeURIComponent(project.videoId)}`}>
                <div className="relative overflow-hidden rounded-[10px] bg-home-forest">
                  {/* eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail */}
                  <img
                    alt=""
                    className="aspect-video w-full object-cover opacity-90 transition-opacity duration-200 group-hover:opacity-100"
                    loading="lazy"
                    src={`https://i.ytimg.com/vi/${encodeURIComponent(project.videoId)}/mqdefault.jpg`}
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-home-canvas/90 px-2 py-0.5 font-mono text-[11px] text-home-forest">
                    #{String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1 px-1 pb-1 pt-4">
                  <h2 className="line-clamp-2 font-serif text-xl leading-snug text-home-forest">
                    {project.title || t("untitled")}
                  </h2>
                  <p className="mt-1 truncate text-sm text-home-charcoal/80">
                    {project.artist || t("unknownArtist")}
                  </p>
                </div>
              </Link>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-home-forest/10 px-1 pt-2">
                <p className="font-mono text-[11px] text-home-charcoal/70">
                  {t("lines", { count: project.lineCount })}
                  {project.savedAt && ` · ${format.relativeTime(new Date(project.savedAt), now)}`}
                </p>
                <button
                  aria-label={t("delete")}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-home-charcoal/60 transition-colors hover:bg-home-canvas hover:text-red-700"
                  onClick={() => onDelete(project)}
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
