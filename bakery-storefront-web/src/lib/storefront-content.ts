import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/types';
import { fetchStorefrontSettings } from './api';
import type { StorefrontHomeContentLocale, StorefrontSettings } from './types';

export type ResolvedStorefrontContent = {
  storeName: string;
  storeLogoUrl: string | null;
  tagline: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroBackgroundImageUrl: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  highlightHandcrafted: string;
  highlightSeasonal: string;
  highlightFastDelivery: string;
  productsSectionTitle: string;
  productsSectionDescription: string;
  storySectionTitle: string;
  storyHeading: string;
  storyBody: string;
  storyStatOne: string;
  storyStatTwo: string;
  storyStatThree: string;
  promoTitle: string;
  promoDescription: string;
  promoCta: string;
  promoCtaHref: string;
  footerAddress: string;
  footerPhone: string;
  footerHours: string;
};

const resolveLocaleContent = (
  locale: Locale,
  settings: StorefrontSettings | null
): StorefrontHomeContentLocale | null => {
  return settings?.storefrontHomeContent?.[locale] ?? null;
};

export const resolveStorefrontContent = ({
  locale,
  dictionary,
  settings,
}: {
  locale: Locale;
  dictionary: Dictionary;
  settings: StorefrontSettings | null;
}): ResolvedStorefrontContent => {
  const localeContent = resolveLocaleContent(locale, settings);

  return {
    storeName: settings?.storeProfile?.name || dictionary.siteName,
    storeLogoUrl: settings?.storeProfile?.logoUrl || null,
    tagline: localeContent?.tagline || dictionary.tagline,
    heroEyebrow: localeContent?.heroEyebrow || dictionary.hero.eyebrow,
    heroTitle: localeContent?.heroTitle || dictionary.hero.title,
    heroDescription: localeContent?.heroDescription || dictionary.hero.description,
    heroBackgroundImageUrl: localeContent?.heroBackgroundImageUrl || '',
    heroPrimaryCta: localeContent?.heroPrimaryCta || dictionary.hero.primaryCta,
    heroSecondaryCta: localeContent?.heroSecondaryCta || dictionary.hero.secondaryCta,
    highlightHandcrafted:
      localeContent?.highlightHandcrafted || dictionary.highlights.handcrafted,
    highlightSeasonal: localeContent?.highlightSeasonal || dictionary.highlights.seasonal,
    highlightFastDelivery:
      localeContent?.highlightFastDelivery || dictionary.highlights.fastDelivery,
    productsSectionTitle:
      localeContent?.productsSectionTitle || dictionary.products.sectionTitle,
    productsSectionDescription:
      localeContent?.productsSectionDescription || dictionary.products.sectionDescription,
    storySectionTitle: localeContent?.storySectionTitle || dictionary.story.sectionTitle,
    storyHeading: localeContent?.storyHeading || dictionary.story.heading,
    storyBody: localeContent?.storyBody || dictionary.story.body,
    storyStatOne: localeContent?.storyStatOne || dictionary.story.statOne,
    storyStatTwo: localeContent?.storyStatTwo || dictionary.story.statTwo,
    storyStatThree: localeContent?.storyStatThree || dictionary.story.statThree,
    promoTitle: localeContent?.promoTitle || dictionary.promo.title,
    promoDescription: localeContent?.promoDescription || dictionary.promo.description,
    promoCta: localeContent?.promoCta || dictionary.promo.cta,
    promoCtaHref: localeContent?.promoCtaHref || '#contact',
    footerAddress: localeContent?.footerAddress || dictionary.footer.address,
    footerPhone: localeContent?.footerPhone || dictionary.footer.phone,
    footerHours: localeContent?.footerHours || dictionary.footer.hours,
  };
};

export const getResolvedStorefrontContent = async ({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}): Promise<ResolvedStorefrontContent> => {
  const settings = await fetchStorefrontSettings();
  return resolveStorefrontContent({ locale, dictionary, settings });
};
