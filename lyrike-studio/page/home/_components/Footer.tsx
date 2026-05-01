import { useTranslations } from "next-intl";
import { Link } from "@/shared/lib/i18n/navigation";

export function Footer() {
  const t = useTranslations("home.footer");

  return (
    <footer className="py-10 px-8 border-t border-ink/8">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/" className="font-serif text-xl text-ink">
            LyricSync
          </Link>
          <p className="text-sm text-ink-soft mt-1">{t("tagline")}</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-ink-soft hover:text-ink transition-colors">
            GitHub
          </a>
          <span className="text-ink-soft/30">|</span>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm text-ink-soft hover:text-ink transition-colors">
            Twitter
          </a>
        </div>
        <p className="text-sm text-ink-soft m-0">{t("copyright")}</p>
      </div>
    </footer>
  );
}