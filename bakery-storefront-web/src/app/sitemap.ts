import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { fetchProducts } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';
  const products = await fetchProducts();

  const localeUrls = locales.flatMap((locale) => {
    return [
      {
        url: `${siteUrl}/${locale}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${siteUrl}/${locale}/products`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
    ];
  });

  const productUrls = locales.flatMap((locale) => {
    return products.map((product) => ({
      url: `${siteUrl}/${locale}/products/${product.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  });

  return [...localeUrls, ...productUrls];
}
