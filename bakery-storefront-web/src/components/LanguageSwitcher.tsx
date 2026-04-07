'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { localeLabels, locales, type Locale } from '@/i18n/config';

type LanguageSwitcherProps = {
  currentLocale: Locale;
};

const buildPathForLocale = (
  pathname: string,
  search: URLSearchParams,
  targetLocale: Locale
): string => {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return `/${targetLocale}`;
  }

  if (locales.includes(segments[0] as Locale)) {
    segments[0] = targetLocale;
  } else {
    segments.unshift(targetLocale);
  }

  const nextPathname = `/${segments.join('/')}`;
  const query = search.toString();

  return query.length > 0 ? `${nextPathname}?${query}` : nextPathname;
};

export const LanguageSwitcher = ({ currentLocale }: LanguageSwitcherProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="language-switcher" aria-label="Language switcher">
      {locales.map((locale) => {
        const isActive = locale === currentLocale;

        return (
          <Link
            key={locale}
            href={buildPathForLocale(pathname, searchParams, locale)}
            className={`language-chip ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {localeLabels[locale]}
          </Link>
        );
      })}
    </div>
  );
};
