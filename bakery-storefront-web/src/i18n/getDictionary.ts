import { enDictionary } from './dictionaries/en';
import { viDictionary } from './dictionaries/vi';
import { defaultLocale, type Locale } from './config';
import type { Dictionary } from './dictionaries/types';

const dictionaries: Record<Locale, Dictionary> = {
  vi: viDictionary,
  en: enDictionary,
};

export const getDictionary = (locale: Locale): Dictionary => {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
};
