'use client';

import { useEffect, useMemo, useState } from 'react';
import { normalizeStorefrontAssetUrl } from '@/lib/storefront-assets';

type ProductImageGalleryProps = {
  productName: string;
  images: string[];
};

export const ProductImageGallery = ({
  productName,
  images,
}: ProductImageGalleryProps) => {
  const normalizedImages = useMemo(() => {
    const deduped: string[] = [];
    const seen = new Set<string>();

    for (const value of images) {
      const normalized = normalizeStorefrontAssetUrl(value);
      if (!normalized || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      deduped.push(normalized);
    }

    return deduped;
  }, [images]);

  const galleryKey = useMemo(() => normalizedImages.join('|'), [normalizedImages]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [galleryKey]);

  const currentIndex = Math.max(
    0,
    Math.min(selectedIndex, normalizedImages.length - 1)
  );
  const activeImage = normalizedImages[currentIndex] ?? null;

  return (
    <div className="product-detail-media">
      <div className="product-detail-image-wrap">
        {activeImage ? (
          <img src={activeImage} alt={productName} className="product-detail-image" />
        ) : (
          <div className="product-detail-image product-image-fallback" aria-hidden="true" />
        )}
      </div>

      {normalizedImages.length > 1 && (
        <div className="product-detail-gallery" aria-label={`${productName} gallery`}>
          {normalizedImages.map((imageUrl, index) => {
            const isPrimary = index === 0;
            const isActive = index === currentIndex;
            const className = [
              'product-detail-thumb-btn',
              isPrimary ? 'is-primary' : '',
              isActive ? 'is-active' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={`${productName}-gallery-${index}`}
                type="button"
                className={className}
                onClick={() => setSelectedIndex(index)}
                aria-label={`View image ${index + 1}`}
                aria-pressed={isActive}
              >
                <img src={imageUrl} alt={`${productName} ${index + 1}`} loading="lazy" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
