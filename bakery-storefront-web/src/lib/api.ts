import type {
  ApiProduct,
  ApiProductImage,
  ProductListResponse,
  ProductResponse,
  StorefrontHomeContent,
  StorefrontHomeContentLocale,
  StorefrontSettings,
  StorefrontSettingsResponse,
} from './types';
import { normalizeStorefrontAssetUrl } from './storefront-assets';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

const normalizeProductImages = (
  images: ApiProduct['images']
): ApiProductImage[] => {
  if (!Array.isArray(images)) {
    return [];
  }

  const normalizedImages: ApiProductImage[] = [];

  for (const [index, item] of images.entries()) {
    const normalizedUrl = normalizeStorefrontAssetUrl(item?.url ?? item?.file?.url);

    if (!normalizedUrl) {
      continue;
    }

    const displayOrder = Number(item?.displayOrder);

    normalizedImages.push({
      ...item,
      displayOrder: Number.isFinite(displayOrder) ? displayOrder : index,
      isPrimary: item?.isPrimary === true,
      url: normalizedUrl,
      file: item?.file
        ? {
            ...item.file,
            url: normalizedUrl,
          }
        : item?.file,
    });
  }

  return normalizedImages.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) {
      return a.isPrimary ? -1 : 1;
    }

    return a.displayOrder - b.displayOrder;
  });
};

const resolveProductImageUrl = ({
  product,
  normalizedImages,
}: {
  product: ApiProduct;
  normalizedImages: ApiProductImage[];
}): string | null => {
  const primaryImage =
    normalizedImages.find((item) => item.isPrimary && item.url) ??
    normalizedImages.find((item) => item.url);

  return (
    primaryImage?.url ??
    normalizeStorefrontAssetUrl(product.imageFile?.url) ??
    normalizeStorefrontAssetUrl(product.imageUrl)
  );
};

const normalizeProduct = (product: ApiProduct): ApiProduct => {
  const normalizedImages = normalizeProductImages(product.images);
  const normalizedImageFileUrl = normalizeStorefrontAssetUrl(product.imageFile?.url);

  return {
    ...product,
    saleUnitType: product.saleUnitType === 'weight' ? 'weight' : 'piece',
    description: product.description ?? '',
    imageUrl: resolveProductImageUrl({ product, normalizedImages }),
    imageFile: product.imageFile
      ? {
          ...product.imageFile,
          url: normalizedImageFileUrl ?? product.imageFile.url,
        }
      : product.imageFile,
    category: product.category ?? null,
    images: normalizedImages,
  };
};

const normalizeText = (value: unknown): string => {
  return String(value ?? '').trim();
};

const normalizeStorefrontLocale = (
  locale: Partial<StorefrontHomeContentLocale> | null | undefined
): StorefrontHomeContentLocale | null => {
  if (!locale) {
    return null;
  }

  const normalized: StorefrontHomeContentLocale = {
    tagline: normalizeText(locale.tagline),
    heroEyebrow: normalizeText(locale.heroEyebrow),
    heroTitle: normalizeText(locale.heroTitle),
    heroDescription: normalizeText(locale.heroDescription),
    heroBackgroundImageUrl:
      normalizeStorefrontAssetUrl(locale.heroBackgroundImageUrl) ??
      normalizeText(locale.heroBackgroundImageUrl),
    heroPrimaryCta: normalizeText(locale.heroPrimaryCta),
    heroSecondaryCta: normalizeText(locale.heroSecondaryCta),
    highlightHandcrafted: normalizeText(locale.highlightHandcrafted),
    highlightSeasonal: normalizeText(locale.highlightSeasonal),
    highlightFastDelivery: normalizeText(locale.highlightFastDelivery),
    productsSectionTitle: normalizeText(locale.productsSectionTitle),
    productsSectionDescription: normalizeText(locale.productsSectionDescription),
    storySectionTitle: normalizeText(locale.storySectionTitle),
    storyHeading: normalizeText(locale.storyHeading),
    storyBody: normalizeText(locale.storyBody),
    storyStatOne: normalizeText(locale.storyStatOne),
    storyStatTwo: normalizeText(locale.storyStatTwo),
    storyStatThree: normalizeText(locale.storyStatThree),
    promoTitle: normalizeText(locale.promoTitle),
    promoDescription: normalizeText(locale.promoDescription),
    promoCta: normalizeText(locale.promoCta),
    promoCtaHref: normalizeText(locale.promoCtaHref),
    footerAddress: normalizeText(locale.footerAddress),
    footerPhone: normalizeText(locale.footerPhone),
    footerHours: normalizeText(locale.footerHours),
  };

  return normalized;
};

const createEmptyStorefrontLocale = (): StorefrontHomeContentLocale => ({
  tagline: '',
  heroEyebrow: '',
  heroTitle: '',
  heroDescription: '',
  heroBackgroundImageUrl: '',
  heroPrimaryCta: '',
  heroSecondaryCta: '',
  highlightHandcrafted: '',
  highlightSeasonal: '',
  highlightFastDelivery: '',
  productsSectionTitle: '',
  productsSectionDescription: '',
  storySectionTitle: '',
  storyHeading: '',
  storyBody: '',
  storyStatOne: '',
  storyStatTwo: '',
  storyStatThree: '',
  promoTitle: '',
  promoDescription: '',
  promoCta: '',
  promoCtaHref: '',
  footerAddress: '',
  footerPhone: '',
  footerHours: '',
});

const normalizeStorefrontSettings = (
  payload: StorefrontSettingsResponse
): StorefrontSettings | null => {
  if (!payload.success || !payload.data) {
    return null;
  }

  const storeName = normalizeText(payload.data.storeProfile?.name);
  const logoUrl =
    normalizeStorefrontAssetUrl(payload.data.storeProfile?.logoUrl) ??
    normalizeText(payload.data.storeProfile?.logoUrl);

  if (!storeName) {
    return null;
  }

  const vi =
    normalizeStorefrontLocale(payload.data.storefrontHomeContent?.vi) ??
    createEmptyStorefrontLocale();
  const en =
    normalizeStorefrontLocale(payload.data.storefrontHomeContent?.en) ??
    createEmptyStorefrontLocale();

  const storefrontHomeContent: StorefrontHomeContent = { vi, en };

  return {
    storeProfile: {
      name: storeName,
      logoUrl: logoUrl || null,
    },
    storefrontHomeContent,
  };
};

const safeFetch = async <T>(
  path: string,
  options?: {
    revalidate?: number;
    noStore?: boolean;
  }
): Promise<T | null> => {
  try {
    const fetchOptions: RequestInit & {
      next?: { revalidate: number };
    } = {
      headers: {
        Accept: 'application/json',
      },
    };

    if (options?.noStore) {
      fetchOptions.cache = 'no-store';
    } else {
      fetchOptions.next = {
        revalidate: options?.revalidate ?? 120,
      };
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export const fetchProducts = async (limit?: number): Promise<ApiProduct[]> => {
  const query = new URLSearchParams();
  query.set('isPublished', 'true');
  if (limit) {
    query.set('limit', String(limit));
  }

  const path = query.size > 0 ? `/products?${query}` : '/products';
  const payload = await safeFetch<ProductListResponse>(path, { revalidate: 120 });

  if (!payload?.success || !Array.isArray(payload.data)) {
    return [];
  }

  if (payload.data.length === 0) {
    return [];
  }

  return payload.data.map(normalizeProduct);
};

export const fetchProductById = async (id: string): Promise<ApiProduct | null> => {
  const payload = await safeFetch<ProductResponse>(`/products/${id}`, {
    revalidate: 120,
  });

  if (!payload?.success || !payload.data?.id) {
    return null;
  }

  return normalizeProduct(payload.data);
};

export const fetchStorefrontSettings = async (): Promise<StorefrontSettings | null> => {
  const payload = await safeFetch<StorefrontSettingsResponse>(
    '/settings/public/storefront',
    { noStore: true }
  );

  if (!payload) {
    return null;
  }

  return normalizeStorefrontSettings(payload);
};
