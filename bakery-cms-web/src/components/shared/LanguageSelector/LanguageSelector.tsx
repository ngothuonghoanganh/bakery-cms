/**
 * LanguageSelector Component
 * Allows users to switch between Vietnamese and English
 */

import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useLanguage, useSetLanguage } from '../../../stores/languageStore';
import { LANGUAGE_OPTIONS } from '../../../i18n/types';
import type { SupportedLanguage } from '../../../i18n/types';
import type { LanguageSelectorProps } from './LanguageSelector.types';

export const LanguageSelector = ({
  className,
  size = 'middle',
  showFlag = true,
  showFullName = true,
  onChange,
  style,
  placement = 'bottomRight',
  disabled = false,
}: LanguageSelectorProps) => {
  const currentLanguage = useLanguage();
  const setLanguage = useSetLanguage();

  const handleChange = (value: SupportedLanguage) => {
    setLanguage(value);
    onChange?.(value);
  };

  const options = LANGUAGE_OPTIONS.map((option) => ({
    value: option.value,
    label: (
      <span>
        {showFlag && option.flag && <span style={{ marginRight: 8 }}>{option.flag}</span>}
        {showFullName ? option.label : option.value.toUpperCase()}
      </span>
    ),
  }));

  return (
    <Select
      value={currentLanguage}
      onChange={handleChange}
      options={options}
      className={className}
      size={size}
      style={{ minWidth: showFullName ? 130 : 80, ...style }}
      suffixIcon={<GlobalOutlined />}
      placement={placement}
      disabled={disabled}
      popupMatchSelectWidth={false}
      aria-label="Select language"
      data-testid="language-selector"
    />
  );
};

export default LanguageSelector;
