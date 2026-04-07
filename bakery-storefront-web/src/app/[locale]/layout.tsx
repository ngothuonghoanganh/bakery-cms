import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StoreFooter } from '@/components/StoreFooter';
import { StoreHeader } from '@/components/StoreHeader';
import { isLocale, locales, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { buildMetadata } from '@/lib/metadata';
import { getResolvedStorefrontContent } from '@/lib/storefront-content';

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const generateStaticParams = (): Array<{ locale: Locale }> => {
  return locales.map((locale) => ({ locale }));
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const dictionary = getDictionary(locale);
  const storefrontContent = await getResolvedStorefrontContent({
    locale,
    dictionary,
  });

  return buildMetadata({
    locale,
    title: storefrontContent.storeName,
    description: storefrontContent.tagline,
    pathname: `/${locale}`,
  });
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const storefrontContent = await getResolvedStorefrontContent({
    locale,
    dictionary,
  });

  return (
    <div className="site-shell" lang={locale}>
      <StoreHeader
        locale={locale}
        dictionary={dictionary}
        storeName={storefrontContent.storeName}
        tagline={storefrontContent.tagline}
        logoUrl={storefrontContent.storeLogoUrl}
      />
      <main className="site-main">{children}</main>
      <StoreFooter
        dictionary={dictionary}
        storeName={storefrontContent.storeName}
        address={storefrontContent.footerAddress}
        phone={storefrontContent.footerPhone}
        hours={storefrontContent.footerHours}
      />
    </div>
  );
}
