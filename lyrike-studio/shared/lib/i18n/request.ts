import { hasLocale } from "next-intl";
import { loadI18nTranslations } from "next-intl-split/load";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = {
    common: (await import(`../../../messages/${locale}/common.json`)).default,
    home: (await import(`../../../messages/${locale}/home.json`)).default,
    dashboard: (await import(`../../../messages/${locale}/dashboard.json`)).default,
    auth: (await import(`../../../messages/${locale}/auth.json`)).default,
    settings: (await import(`../../../messages/${locale}/settings.json`)).default,
    validation: (await import(`../../../messages/${locale}/validation.json`)).default,
    editor: (await import(`../../../messages/${locale}/editor.json`)).default,
  };


  return {
    locale,
    messages,
  };
});
