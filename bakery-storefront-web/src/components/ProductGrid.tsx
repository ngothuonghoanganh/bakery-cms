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
  variant?: 'featured' | 'catalog' | 'related';
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
  variant = 'catalog',
}: ProductGridProps) => {
  const showCategory = variant === 'catalog';
  const showDescription = variant !== 'related';

  return (
    <section
      className={`product-section product-section-${variant}`}
      id={variant === 'featured' ? 'menu' : undefined}
    >
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
        <div className={`product-grid product-grid-${variant}`}>
          {products.map((product, index) => (
            <article
              key={product.id}
              className={`product-card product-card-${variant}`}
              style={{ animationDelay: `${Math.min(index * 70, 280)}ms` }}
            >
              <Link
                href={`/${locale}/products/${product.id}`}
                className="product-card-link"
                aria-label={`${dictionary.products.viewDetail}: ${product.name}`}
              >
                <div className="product-image-wrap">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="product-image" loading="lazy" />
                  ) : (
                    <div className="product-image product-image-fallback" aria-hidden="true" />
                  )}
                </div>

                <div className="product-content">
                  <div className="product-topline">
                    {showCategory && product.category ? (
                      <span className="product-category">{product.category}</span>
                    ) : (
                      <span className="product-spacer" aria-hidden="true" />
                    )}
                    <span className={getStatusClassName(product.status)}>
                      {getStatusLabel(product.status, dictionary)}
                    </span>
                  </div>

                  <div className="product-text">
                    <h3>{product.name}</h3>
                    {showDescription && product.description && <p>{product.description}</p>}
                  </div>

                  <div className="product-footer">
                    <strong>
                      {formatPrice(product.price, locale)} {getPriceSuffix(product.saleUnitType, locale)}
                    </strong>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
