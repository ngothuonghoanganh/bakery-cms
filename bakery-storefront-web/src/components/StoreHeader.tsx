import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/types';
import { LanguageSwitcher } from './LanguageSwitcher';

type StoreHeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
  storeName?: string;
  tagline?: string;
  logoUrl?: string | null;
};

export const StoreHeader = ({
  locale,
  dictionary,
  storeName,
  tagline,
  logoUrl,
}: StoreHeaderProps) => {
  const resolvedStoreName = storeName || dictionary.siteName;
  const resolvedTagline = tagline || dictionary.tagline;

  return (
    <>
      <header className="store-header">
        <div className="store-header-top">
          <Link href={`/${locale}`} className="brand-link">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={resolvedStoreName}
                className="brand-logo"
              />
            ) : (
              <span className="brand-mark">BM</span>
            )}
            <span>
              <strong>{resolvedStoreName}</strong>
              <small>{resolvedTagline}</small>
            </span>
          </Link>

          <LanguageSwitcher currentLocale={locale} />
        </div>
      </header>

      <nav className="main-nav" aria-label="Main menu">
        <Link href={`/${locale}`}>{dictionary.nav.home}</Link>
        <Link href={`/${locale}/products`}>{dictionary.nav.menu}</Link>
        <Link href={`/${locale}#story`}>{dictionary.nav.story}</Link>
        <Link href={`/${locale}#contact`}>{dictionary.nav.contact}</Link>
      </nav>
    </>
  );
};
