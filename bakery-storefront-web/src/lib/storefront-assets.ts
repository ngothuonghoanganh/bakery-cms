const PROXY_PATH_PREFIXES = ['/api/v1/files/', '/upload/', '/uploads/'] as const;
const RAW_PROXY_PATH_PREFIXES = ['api/v1/files/', 'upload/', 'uploads/'] as const;

const splitPathAndSearch = (
  value: string
): { pathname: string; search: string } => {
  const queryIndex = value.indexOf('?');

  if (queryIndex < 0) {
    return {
      pathname: value,
      search: '',
    };
  }

  return {
    pathname: value.slice(0, queryIndex),
    search: value.slice(queryIndex),
  };
};

const extractProxyPath = (pathname: string): string | null => {
  for (const prefix of PROXY_PATH_PREFIXES) {
    const matchIndex = pathname.indexOf(prefix);

    if (matchIndex >= 0) {
      return pathname.slice(matchIndex);
    }
  }

  for (const prefix of RAW_PROXY_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return `/${pathname}`;
    }
  }

  return null;
};

export const normalizeStorefrontAssetUrl = (value: unknown): string | null => {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return null;
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const parsed = new URL(raw);
      const proxyPath = extractProxyPath(parsed.pathname);

      if (proxyPath) {
        return `${proxyPath}${parsed.search}`;
      }

      return raw;
    } catch {
      return raw;
    }
  }

  const { pathname, search } = splitPathAndSearch(raw);
  const proxyPath = extractProxyPath(pathname);

  if (proxyPath) {
    return `${proxyPath}${search}`;
  }

  return raw;
};
