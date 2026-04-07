export type ApiFile = {
  id: string;
  url: string;
};

export type ApiProductImage = {
  id: string;
  fileId: string;
  displayOrder: number;
  isPrimary: boolean;
  url?: string | null;
  file?: ApiFile | null;
};

export type ApiProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  status: string;
  imageUrl: string | null;
  imageFileId?: string | null;
  imageFile?: ApiFile | null;
  images?: ApiProductImage[];
};

export type ProductListResponse = {
  success: boolean;
  data: ApiProduct[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ProductResponse = {
  success: boolean;
  data: ApiProduct;
};

export type StorefrontHomeContentLocale = {
  tagline: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroBackgroundImageUrl: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  highlightHandcrafted: string;
  highlightSeasonal: string;
  highlightFastDelivery: string;
  productsSectionTitle: string;
  productsSectionDescription: string;
  storySectionTitle: string;
  storyHeading: string;
  storyBody: string;
  storyStatOne: string;
  storyStatTwo: string;
  storyStatThree: string;
  promoTitle: string;
  promoDescription: string;
  promoCta: string;
  promoCtaHref: string;
  footerAddress: string;
  footerPhone: string;
  footerHours: string;
};

export type StorefrontHomeContent = {
  vi: StorefrontHomeContentLocale;
  en: StorefrontHomeContentLocale;
};

export type StorefrontSettings = {
  storeProfile: {
    name: string;
    logoUrl: string | null;
  };
  storefrontHomeContent: StorefrontHomeContent;
};

export type StorefrontSettingsResponse = {
  success: boolean;
  data: StorefrontSettings;
};
