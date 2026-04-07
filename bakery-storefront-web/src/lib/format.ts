import type { Locale } from '@/i18n/config';

const PRICE_LOCALE = 'vi-VN';
const PRICE_CURRENCY = 'VND';

export const formatPrice = (price: number, _locale: Locale): string => {
  return new Intl.NumberFormat(PRICE_LOCALE, {
    style: 'currency',
    currency: PRICE_CURRENCY,
    maximumFractionDigits: 0,
  }).format(price);
};
