import '@testing-library/jest-dom/vitest';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Ant Design / rc-* dependencies rely on browser APIs not fully implemented in jsdom.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// rc-util getScrollBarSize uses getComputedStyle and may throw in jsdom.
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: (elt: Element) => {
    const style = (elt as any).style || {};
    return {
      ...style,
      getPropertyValue: (_prop: string) => '',
    };
  },
});
