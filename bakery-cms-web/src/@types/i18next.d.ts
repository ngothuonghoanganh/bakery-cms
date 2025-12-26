/**
 * i18next TypeScript Module Augmentation
 * Provides type-safe translation keys
 */

import 'i18next';
import type { resources } from '../i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: (typeof resources)['vi'];
    returnNull: false;
    returnEmptyString: false;
  }
}
