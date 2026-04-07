export type Dictionary = {
  siteName: string;
  tagline: string;
  nav: {
    home: string;
    menu: string;
    story: string;
    contact: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  highlights: {
    handcrafted: string;
    seasonal: string;
    fastDelivery: string;
  };
  products: {
    sectionTitle: string;
    sectionDescription: string;
    seeAll: string;
    viewDetail: string;
    available: string;
    outOfStock: string;
    empty: string;
    addToCart: string;
  };
  story: {
    sectionTitle: string;
    heading: string;
    body: string;
    statOne: string;
    statTwo: string;
    statThree: string;
  };
  promo: {
    title: string;
    description: string;
    cta: string;
  };
  footer: {
    address: string;
    phone: string;
    hours: string;
    contactTitle: string;
    hoursTitle: string;
  };
  seo: {
    homeTitle: string;
    homeDescription: string;
    productsTitle: string;
    productsDescription: string;
  };
};
