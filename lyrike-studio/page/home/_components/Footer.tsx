import { useTranslations } from "next-intl";
import { Link } from "@/shared/lib/i18n/navigation";

export function Footer() {
  const t = useTranslations("home.footer");

  return (
    <footer className="border-t border-home-border bg-home-canvas px-6 py-10 md:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4">
        <div>
          <Link className="font-serif text-xl text-home-forest" href="/">
            LyricSync
          </Link>
          <p className="mt-1 text-sm text-home-charcoal">{t("tagline")}</p>
        </div>
        <div className="flex items-center gap-4">
          <a
            className="text-sm text-home-charcoal transition-colors hover:text-home-forest"
            href="https://github.com/duckviet/lyrike-studio"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <span className="text-home-border">|</span>
        </div>
        <p className="m-0 text-sm text-home-charcoal">{t("copyright")}</p>
      </div>
    </footer>
  );
}
