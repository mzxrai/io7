// Global test setup
import { vi, expect } from 'vitest';
import '@testing-library/dom';

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
  writable: true,
});

// Mock window.open
window.open = vi.fn();

// Mock fetch to prevent network errors during tests
globalThis.fetch = vi.fn(() =>
  Promise.reject(new Error('Network error')),
);

// Suppress expected console errors during tests
const originalError = console.error;
console.error = (...args: unknown[]) => {
  // Suppress fetch-related errors that are expected during tests
  if (args[0]?.toString().includes('Failed to fetch') ||
      args[0]?.toString().includes('Failed to load agents')) {
    return;
  }
  originalError.apply(console, args);
};

// Add custom matchers if needed
expect.extend({
  toHaveBeenDispatchedWith(received: Event, expectedDetail: unknown) {
    const customEvent = received as CustomEvent;
    const pass = JSON.stringify(customEvent.detail) === JSON.stringify(expectedDetail);

    return {
      pass,
      message: () => pass
        ? `Expected event not to have been dispatched with ${JSON.stringify(expectedDetail)}`
        : `Expected event to have been dispatched with ${JSON.stringify(expectedDetail)}, but got ${JSON.stringify(customEvent.detail)}`,
    };
  },
});