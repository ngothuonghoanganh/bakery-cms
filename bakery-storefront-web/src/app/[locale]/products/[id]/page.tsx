import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductImageGallery } from '@/components/ProductImageGallery';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { fetchProductById, fetchProducts } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { buildMetadata } from '@/lib/metadata';
import { normalizeStorefrontAssetUrl } from '@/lib/storefront-assets';
import { getResolvedStorefrontContent } from '@/lib/storefront-content';

const statusText = (status: string, availableText: string, outText: string): string => {
  return status === 'available' ? availableText : outText;
};

const getPriceSuffix = (saleUnitType: 'piece' | 'weight', locale: string): string => {
  if (saleUnitType === 'weight') {
    return '/100g';
  }

  return locale === 'vi' ? '/cái' : '/piece';
};

const resolveDetailImageUrls = (
  product: Awaited<ReturnType<typeof fetchProductById>>
): string[] => {
  if (!product) {
    return [];
  }

  const imageUrls: string[] = [];
  const seen = new Set<string>();

  const pushUrl = (value: string | null | undefined): void => {
    const normalized = normalizeStorefrontAssetUrl(value);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    imageUrls.push(normalized);
  };

  // Primary image is normalized in API mapping and should stay first.
  pushUrl(product.imageUrl);
  pushUrl(product.imageFile?.url);

  for (const image of product.images ?? []) {
    pushUrl(image.url ?? image.file?.url);
  }

  return imageUrls;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const dictionary = getDictionary(locale);
  const [product, storefrontContent] = await Promise.all([
    fetchProductById(id),
    getResolvedStorefrontContent({ locale, dictionary }),
  ]);

  if (!product) {
    return buildMetadata({
      locale,
      title: `${storefrontContent.productsSectionTitle} | ${storefrontContent.storeName}`,
      description: storefrontContent.productsSectionDescription,
      pathname: `/${locale}/products`,
    });
  }

  return buildMetadata({
    locale,
    title: `${product.name} | ${storefrontContent.storeName}`,
    description: product.description || storefrontContent.productsSectionDescription,
    pathname: `/${locale}/products/${id}`,
    image: product.imageUrl ?? undefined,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const [product, storefrontContent] = await Promise.all([
    fetchProductById(id),
    getResolvedStorefrontContent({ locale, dictionary }),
  ]);

  if (!product) {
    notFound();
  }

  const relatedProducts = (await fetchProducts(8))
    .filter((item) => item.id !== id)
    .slice(0, 3);
  const detailImageUrls = resolveDetailImageUrls(product);

  return (
    <>
      <section className="product-detail">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href={`/${locale}`}>{dictionary.nav.home}</Link>
          <span>/</span>
          <Link href={`/${locale}/products`}>{dictionary.nav.menu}</Link>
          <span>/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product-detail-grid">
          <ProductImageGallery productName={product.name} images={detailImageUrls} />

          <div className="product-detail-content">
            {product.category && <span className="product-category">{product.category}</span>}
            <h1>{product.name}</h1>
            {product.description && <p>{product.description}</p>}

            <div className="detail-meta">
              <strong>
                {formatPrice(product.price, locale)} {getPriceSuffix(product.saleUnitType, locale)}
              </strong>
              <span className={`status-badge ${product.status === 'available' ? 'available' : 'out'}`}>
                {statusText(
                  product.status,
                  dictionary.products.available,
                  dictionary.products.outOfStock
                )}
              </span>
            </div>

            <div className="detail-support">
              <div className="detail-support-item">
                <span>{dictionary.footer.contactTitle}</span>
                <strong>{storefrontContent.footerPhone}</strong>
              </div>
              <div className="detail-support-item">
                <span>{dictionary.footer.hoursTitle}</span>
                <strong>{storefrontContent.footerHours}</strong>
              </div>
            </div>

            <Link href={`/${locale}#contact`} className="btn-primary">
              {dictionary.products.contactToOrder}
            </Link>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <ProductGrid
          locale={locale}
          dictionary={dictionary}
          products={relatedProducts}
          title={storefrontContent.productsSectionTitle}
          description={storefrontContent.productsSectionDescription}
          variant="related"
        />
      )}
    </>
  );
}
