import Link from 'next/link';
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
    title: storefrontContent.storeName,
    description: storefrontContent.tagline || dictionary.seo.homeDescription,
    pathname: `/${locale}`,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const products = await fetchProducts(6);
  const storefrontContent = await getResolvedStorefrontContent({
    locale,
    dictionary,
  });

  return (
    <>
      <section className="hero-section">
        {storefrontContent.heroBackgroundImageUrl && (
          <div className="hero-bg-art" aria-hidden="true">
            <img
              src={storefrontContent.heroBackgroundImageUrl}
              alt=""
              className="hero-bg-image"
            />
          </div>
        )}

        <div className="hero-copy">
          <span className="hero-eyebrow">{storefrontContent.heroEyebrow}</span>
          <h1>{storefrontContent.heroTitle}</h1>
          <p>{storefrontContent.heroDescription}</p>

          <div className="hero-actions">
            <Link href={`/${locale}/products`} className="btn-primary">
              {storefrontContent.heroPrimaryCta}
            </Link>
            <Link href={`/${locale}/products`} className="btn-secondary">
              {storefrontContent.heroSecondaryCta}
            </Link>
          </div>
        </div>

        <div className="highlight-list">
          <span>{storefrontContent.highlightHandcrafted}</span>
          <span>{storefrontContent.highlightSeasonal}</span>
          <span>{storefrontContent.highlightFastDelivery}</span>
        </div>
      </section>

      <ProductGrid
        locale={locale}
        dictionary={dictionary}
        products={products}
        title={storefrontContent.productsSectionTitle}
        description={storefrontContent.productsSectionDescription}
        showMenuLink
      />

      <section className="story-section" id="story">
        <div className="story-copy">
          <header>
            <span>{storefrontContent.storySectionTitle}</span>
            <h2>{storefrontContent.storyHeading}</h2>
          </header>
          <p>{storefrontContent.storyBody}</p>
        </div>

        <div className="story-stats">
          <div className="story-stat">{storefrontContent.storyStatOne}</div>
          <div className="story-stat">{storefrontContent.storyStatTwo}</div>
          <div className="story-stat">{storefrontContent.storyStatThree}</div>
        </div>
      </section>

      <section className="promo-banner">
        <div className="promo-copy">
          <h2>{storefrontContent.promoTitle}</h2>
          <p>{storefrontContent.promoDescription}</p>
        </div>
        <a href={storefrontContent.promoCtaHref} className="btn-primary promo-cta">
          {storefrontContent.promoCta}
        </a>
      </section>
    </>
  );
}
