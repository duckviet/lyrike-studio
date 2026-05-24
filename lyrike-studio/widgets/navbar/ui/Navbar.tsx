"use client";

import { Home, Languages, PencilLine } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import { Link, usePathname, useRouter } from "@/shared/lib/i18n/navigation";

const GithubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-4.51-2-7-2" />
  </svg>
);
const navLinkClass =
  "inline-flex min-h-10 items-center gap-2 rounded-[14px] px-3 text-sm font-medium transition-colors";

const LanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "vi" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      className="inline-flex min-h-10 items-center gap-2 rounded-[14px] border border-home-border bg-home-canvas px-3 text-xs font-semibold uppercase text-home-charcoal transition-colors hover:text-home-forest"
      onClick={toggleLocale}
      type="button"
    >
      <Languages size={15} strokeWidth={1.8} />
      <span>{locale === "en" ? "EN" : "VI"}</span>
    </button>
  );
};

export const Navbar = () => {
  const t = useTranslations("common.nav");
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/studio", label: t("editor"), icon: PencilLine },
  ];

  return (
    <nav className="sticky left-0 right-0 top-0 z-50 border-b border-home-border bg-home-canvas/90 px-4 py-3 backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
        <Link
          className="flex min-w-0 items-center gap-3 font-serif text-xl font-normal text-home-forest"
          href="/"
        >
          <span className="size-5 shrink-0 rounded-full bg-home-forest" />
          <span className="truncate">LyricSync</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1.5 sm:flex">
            {links.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;

              return (
                <Link
                  className={cn(
                    navLinkClass,
                    isActive
                      ? "bg-home-keylime text-home-forest"
                      : "text-home-charcoal hover:bg-home-keylime hover:text-home-forest",
                  )}
                  href={href}
                  key={href}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          <a
            aria-label="GitHub"
            className="inline-flex size-10 items-center justify-center rounded-[14px] text-home-charcoal transition-colors hover:bg-home-keylime hover:text-home-forest"
            href="https://github.com/duckviet/lyrike-studio"
            rel="noopener noreferrer"
            target="_blank"
          >
            <GithubIcon />
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};
