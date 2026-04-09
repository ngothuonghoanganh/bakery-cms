import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductGrid } from '@/components/ProductGrid';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { fetchProducts } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';
import { getResolvedStorefrontContent } from '@/lib/storefront-content';

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
    title: `${storefrontContent.productsSectionTitle} | ${storefrontContent.storeName}`,
    description: storefrontContent.productsSectionDescription,
    pathname: `/${locale}/products`,
  });
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const products = await fetchProducts();
  const storefrontContent = await getResolvedStorefrontContent({
    locale,
    dictionary,
  });

  return (
    <section className="menu-page">
      <header className="menu-header">
        <span>{dictionary.nav.menu}</span>
        <h1>{storefrontContent.productsSectionTitle}</h1>
        <p>{storefrontContent.productsSectionDescription}</p>
      </header>

      <ProductGrid
        locale={locale}
        dictionary={dictionary}
        products={products}
        variant="catalog"
      />
    </section>
  );
}
