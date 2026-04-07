export const locales = ['vi', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'vi';

export const localeLabels: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};

export const isLocale = (value: string): value is Locale => {
  return locales.includes(value as Locale);
};

export const toOgLocale = (locale: Locale): string => {
  return locale === 'vi' ? 'vi_VN' : 'en_US';
};

export const localeCurrency: Record<Locale, string> = {
  vi: 'VND',
  en: 'VND',
};
