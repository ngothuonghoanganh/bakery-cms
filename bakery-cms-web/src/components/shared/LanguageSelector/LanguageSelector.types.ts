/**
 * LanguageSelector Component Types
 */

import type { SelectProps } from 'antd';
import type { SupportedLanguage } from '../../../i18n/types';

export type LanguageSelectorProps = {
  /**
   * Additional class name for styling
   */
  className?: string;

  /**
   * Size of the selector
   */
  size?: 'small' | 'middle' | 'large';

  /**
   * Whether to show the flag icon
   */
  showFlag?: boolean;

  /**
   * Whether to show the full language name or just code
   */
  showFullName?: boolean;

  /**
   * Callback when language changes
   */
  onChange?: (language: SupportedLanguage) => void;

  /**
   * Style object
   */
  style?: React.CSSProperties;

  /**
   * Placement of dropdown
   */
  placement?: SelectProps['placement'];

  /**
   * Whether the selector is disabled
   */
  disabled?: boolean;
};
