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