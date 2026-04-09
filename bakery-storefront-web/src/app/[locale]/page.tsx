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
      <section
        className={`hero-section${storefrontContent.heroBackgroundImageUrl ? ' has-hero-art' : ''}`}
      >
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
          </div>
        </div>

        <div className="trust-row" aria-label="Store highlights">
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
        variant="featured"
      />

      <section className="story-section" id="story">
        <div className="story-panel">
          <header>
            <span>{storefrontContent.storySectionTitle}</span>
            <h2>{storefrontContent.storyHeading}</h2>
          </header>
          <p>{storefrontContent.storyBody}</p>
        </div>

        <ul className="story-facts" aria-label="Bakery highlights">
          <li>{storefrontContent.storyStatOne}</li>
          <li>{storefrontContent.storyStatTwo}</li>
          <li>{storefrontContent.storyStatThree}</li>
        </ul>
      </section>

      <section className="contact-strip">
        <div className="contact-strip-copy">
          <span>{dictionary.nav.contact}</span>
          <h2>{storefrontContent.promoTitle}</h2>
          <p>{storefrontContent.promoDescription}</p>
        </div>
        <a href={storefrontContent.promoCtaHref} className="btn-secondary contact-strip-cta">
          {storefrontContent.promoCta}
        </a>
      </section>
    </>
  );
}
