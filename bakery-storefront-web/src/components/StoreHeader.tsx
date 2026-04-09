'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
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

const getPageKind = (pathname: string, locale: Locale): 'home' | 'inner' => {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return 'home';
  }

  return segments.length === 1 && segments[0] === locale ? 'home' : 'inner';
};

export const StoreHeader = ({
  locale,
  dictionary,
  storeName,
  tagline,
  logoUrl,
}: StoreHeaderProps) => {
  const navRef = useRef<HTMLElement | null>(null);
  const fixTimeoutRef = useRef<number | null>(null);
  const resolvedStoreName = storeName || dictionary.siteName;
  const resolvedTagline = tagline || dictionary.tagline;
  const pathname = usePathname();
  const pageKind = getPageKind(pathname, locale);
  const [navEnterOffset, setNavEnterOffset] = useState(0);
  const [isFixing, setIsFixing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.scrollY > 12;
  });

  useEffect(() => {
    return () => {
      if (fixTimeoutRef.current !== null) {
        window.clearTimeout(fixTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const syncScrollState = (): void => {
      const nextIsScrolled = window.scrollY > 12;

      if (nextIsScrolled && !isScrolled && navRef.current) {
        const currentTop = navRef.current.getBoundingClientRect().top;
        const fixedTop = window.matchMedia('(max-width: 720px)').matches
          ? 0
          : 0.35 * parseFloat(window.getComputedStyle(document.documentElement).fontSize);

        setNavEnterOffset(currentTop - fixedTop);
        setIsFixing(true);

        if (fixTimeoutRef.current !== null) {
          window.clearTimeout(fixTimeoutRef.current);
        }

        fixTimeoutRef.current = window.setTimeout(() => {
          setIsFixing(false);
        }, 220);
      }

      if (!nextIsScrolled) {
        setIsFixing(false);
      }

      setIsScrolled(nextIsScrolled);
    };

    syncScrollState();
    window.addEventListener('scroll', syncScrollState, { passive: true });

    return () => {
      window.removeEventListener('scroll', syncScrollState);
    };
  }, [isScrolled, pathname]);

  const navState = isScrolled ? 'scrolled' : 'top';

  return (
    <div
      className={`store-chrome${isFixing ? ' is-fixing' : ''}`}
      data-page-kind={pageKind}
      data-nav-state={navState}
      style={{ '--nav-enter-offset': `${navEnterOffset}px` } as CSSProperties}
    >
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

      <div className="main-nav-shell">
        <nav ref={navRef} className="main-nav" aria-label="Main menu">
          <Link href={`/${locale}`}>{dictionary.nav.home}</Link>
          <Link href={`/${locale}/products`}>{dictionary.nav.menu}</Link>
          <Link href={`/${locale}#story`}>{dictionary.nav.story}</Link>
          <Link href={`/${locale}#contact`}>{dictionary.nav.contact}</Link>
        </nav>
      </div>
    </div>
  );
};
