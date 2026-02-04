/**
 * LanguageSelector Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LanguageSelector } from './LanguageSelector';

// Mock the language store
const mockSetLanguage = vi.fn();
let mockLanguage = 'vi';

vi.mock('../../../stores/languageStore', () => ({
  useLanguage: () => mockLanguage,
  useSetLanguage: () => mockSetLanguage,
}));

// Mock i18n
vi.mock('../../../i18n', () => ({
  default: {
    changeLanguage: vi.fn(),
  },
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLanguage = 'vi';
  });

  it('renders correctly with default props', () => {
    render(<LanguageSelector />);

    const selector = screen.getByTestId('language-selector');
    expect(selector).toBeInTheDocument();
  });

  it('displays the current language', () => {
    render(<LanguageSelector />);

    // Should show Vietnamese by default
    expect(screen.getByText(/Tiếng Việt/i)).toBeInTheDocument();
  });

  it('shows language options when clicked', async () => {
    render(<LanguageSelector />);

    const selector = screen.getByRole('combobox');
    fireEvent.mouseDown(selector);

    await waitFor(() => {
      expect(screen.getByText(/English/i)).toBeInTheDocument();
    });
  });

  it('calls setLanguage when a new language is selected', async () => {
    render(<LanguageSelector />);

    const selector = screen.getByRole('combobox');
    fireEvent.mouseDown(selector);

    await waitFor(() => {
      const englishOption = screen.getByText(/English/i);
      fireEvent.click(englishOption);
    });

    expect(mockSetLanguage).toHaveBeenCalledWith('en');
  });

  it('calls onChange callback when language changes', async () => {
    const handleChange = vi.fn();
    render(<LanguageSelector onChange={handleChange} />);

    const selector = screen.getByRole('combobox');
    fireEvent.mouseDown(selector);

    await waitFor(() => {
      const englishOption = screen.getByText(/English/i);
      fireEvent.click(englishOption);
    });

    expect(handleChange).toHaveBeenCalledWith('en');
  });

  it('can be disabled', () => {
    render(<LanguageSelector disabled />);

    const selector = screen.getByRole('combobox');
    expect(selector).toHaveClass('ant-select-disabled');
  });

  it('respects showFullName prop', () => {
    render(<LanguageSelector showFullName={false} />);

    // Should show code instead of full name
    expect(screen.getByText('VI')).toBeInTheDocument();
  });

  it('respects size prop', () => {
    render(<LanguageSelector size="small" />);

    const selector = screen.getByTestId('language-selector');
    expect(selector).toHaveClass('ant-select-sm');
  });
});
