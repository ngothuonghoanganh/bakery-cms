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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

const toUploadProxyPath = (value: unknown): string | null => {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return null;
  }

  if (raw.startsWith('/upload/')) {
    return raw;
  }

  if (raw.startsWith('/uploads/')) {
    return raw;
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith('/upload/')) {
        return `${parsed.pathname}${parsed.search}`;
      }
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // Keep fallback behavior below
    }
  }

  const uploadPathMatch = raw.match(/\/uploads?\/.+$/);
  if (uploadPathMatch) {
    return uploadPathMatch[0];
  }

  return null;
};

const normalizeImageSource = (value: unknown): string | null => {
  const proxyPath = toUploadProxyPath(value);
  if (proxyPath) {
    return proxyPath;
  }

  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  return raw;
};

const normalizeProductImages = (
  images: ApiProduct['images']
): ApiProductImage[] => {
  if (!Array.isArray(images)) {
    return [];
  }

  const normalizedImages: ApiProductImage[] = [];

  for (const [index, item] of images.entries()) {
    const normalizedUrl = normalizeImageSource(item?.url ?? item?.file?.url);

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
    normalizeImageSource(product.imageFile?.url) ??
    normalizeImageSource(product.imageUrl)
  );
};

const normalizeProduct = (product: ApiProduct): ApiProduct => {
  const normalizedImages = normalizeProductImages(product.images);

  return {
    ...product,
    saleUnitType: product.saleUnitType === 'weight' ? 'weight' : 'piece',
    description: product.description ?? '',
    imageUrl: resolveProductImageUrl({ product, normalizedImages }),
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
      normalizeImageSource(locale.heroBackgroundImageUrl) ??
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
    toUploadProxyPath(payload.data.storeProfile?.logoUrl) ??
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
  } catch (_error) {
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
