import type { Metadata } from 'next';
import { toOgLocale, type Locale } from '@/i18n/config';

type MetadataInput = {
  locale: Locale;
  title: string;
  description: string;
  pathname: string;
  image?: string;
};

const getSiteUrl = (): string => {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';
};

export const buildMetadata = ({
  locale,
  title,
  description,
  pathname,
  image,
}: MetadataInput): Metadata => {
  const siteUrl = getSiteUrl();
  const safePathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const normalizedPathname = safePathname.replace(/^\/(vi|en)(?=\/|$)/, '') || '/';
  const localizePath = (targetLocale: Locale): string => {
    return normalizedPathname === '/'
      ? `/${targetLocale}`
      : `/${targetLocale}${normalizedPathname}`;
  };

  const pageUrl = `${siteUrl}${safePathname}`;
  const socialImage = image ?? `${siteUrl}/og-bakery.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: {
        vi: `${siteUrl}${localizePath('vi')}`,
        en: `${siteUrl}${localizePath('en')}`,
      },
    },
    openGraph: {
      type: 'website',
      locale: toOgLocale(locale),
      url: pageUrl,
      title,
      description,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImage],
    },
  };
};
