export const locales = ['ka', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ka';

export const localeNames: Record<Locale, string> = {
  ka: 'ქართული',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  ka: '🇬🇪',
  en: '🇬🇧',
};

// RTL support for future Arabic
export const rtlLocales: Locale[] = [];

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
}
