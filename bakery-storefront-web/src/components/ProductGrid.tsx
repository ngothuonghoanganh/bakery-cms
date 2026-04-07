import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/types';
import { formatPrice } from '@/lib/format';
import type { ApiProduct } from '@/lib/types';

type ProductGridProps = {
  locale: Locale;
  dictionary: Dictionary;
  products: ApiProduct[];
  title?: string;
  description?: string;
  showMenuLink?: boolean;
};

const getStatusLabel = (status: string, dictionary: Dictionary): string => {
  return status === 'available' ? dictionary.products.available : dictionary.products.outOfStock;
};

const getStatusClassName = (status: string): string => {
  return status === 'available' ? 'status-badge available' : 'status-badge out';
};

const getPriceSuffix = (saleUnitType: ApiProduct['saleUnitType'], locale: Locale): string => {
  if (saleUnitType === 'weight') {
    return '/100g';
  }

  return locale === 'vi' ? '/cái' : '/piece';
};

export const ProductGrid = ({
  locale,
  dictionary,
  products,
  title,
  description,
  showMenuLink,
}: ProductGridProps) => {
  return (
    <section className="product-section" id="menu">
      {(title || description || showMenuLink) && (
        <header className="section-heading">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {showMenuLink && (
            <Link href={`/${locale}/products`} className="text-link">
              {dictionary.products.seeAll}
            </Link>
          )}
        </header>
      )}

      {products.length === 0 ? (
        <p className="empty-state">{dictionary.products.empty}</p>
      ) : (
        <div className="product-grid">
          {products.map((product, index) => (
            <article key={product.id} className="product-card" style={{ animationDelay: `${Math.min(index * 80, 320)}ms` }}>
              <Link
                href={`/${locale}/products/${product.id}`}
                className="product-image-wrap"
                aria-label={`${dictionary.products.viewDetail}: ${product.name}`}
              >
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="product-image" loading="lazy" />
                ) : (
                  <div className="product-image product-image-fallback" aria-hidden="true" />
                )}
              </Link>

              <div className="product-content">
                <div className="product-topline">
                  {product.category && (
                    <span className="product-category">{product.category}</span>
                  )}
                  <span className={getStatusClassName(product.status)}>
                    {getStatusLabel(product.status, dictionary)}
                  </span>
                </div>

                <h3>{product.name}</h3>
                {product.description && <p>{product.description}</p>}

                <div className="product-footer">
                  <strong>
                    {formatPrice(product.price, locale)} {getPriceSuffix(product.saleUnitType, locale)}
                  </strong>
                  <Link
                    href={`/${locale}/products/${product.id}`}
                    className="btn-light"
                    aria-label={`${dictionary.products.viewDetail}: ${product.name}`}
                  >
                    {dictionary.products.viewDetail}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
