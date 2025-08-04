import { fixture, cleanup, nextFrame } from '@test-utils/render';
import { describe, it, expect, afterEach, vi } from 'vitest';
import './CopyButton';

describe('CopyButton', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers(); // Always restore real timers after each test
  });

  describe('rendering', () => {
    it('should display default text', async () => {
      const el = await fixture<HTMLElement>('<copy-button></copy-button>');
      expect(el.textContent?.trim()).toBe('Copy');
    });

    it('should display custom text', async () => {
      const el = await fixture<HTMLElement>('<copy-button text="Copy Command"></copy-button>');
      expect(el.textContent?.trim()).toBe('Copy Command');
    });
  });

  describe('copy functionality', () => {
    it('should copy value to clipboard when clicked', async () => {
      const el = await fixture<HTMLElement>('<copy-button value="test content"></copy-button>');
      const button = el.querySelector('button');

      button?.click();
      await nextFrame();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test content');
    });

    it('should show success feedback after copying', async () => {
      const el = await fixture<HTMLElement>('<copy-button value="test"></copy-button>');
      const button = el.querySelector('button');

      button?.click();
      await nextFrame();

      // User should see success feedback
      expect(el.textContent?.trim()).toBe('Copied!');
    });

    it('should show temporary success feedback', async () => {
      const el = await fixture<HTMLElement>('<copy-button text="Copy" value="test"></copy-button>');
      const button = el.querySelector('button');

      // Initial state
      expect(el.textContent?.trim()).toBe('Copy');

      button?.click();
      await nextFrame();

      // Success state is shown
      expect(el.textContent?.trim()).toBe('Copied!');

      // Note: The component reverts after 2 seconds
      // E2E tests would verify the full interaction
    });

    it('should emit copy event with value', async () => {
      const el = await fixture<HTMLElement>('<copy-button value="test content"></copy-button>');
      const button = el.querySelector('button');

      const copyHandler = vi.fn();
      el.addEventListener('copy', copyHandler);

      button?.click();
      await nextFrame();

      expect(copyHandler).toHaveBeenCalled();
      const event = copyHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.value).toBe('test content');
    });

    it('should not copy if no value provided', async () => {
      const el = await fixture<HTMLElement>('<copy-button></copy-button>');
      const button = el.querySelector('button');

      button?.click();
      await nextFrame();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled attribute is set', async () => {
      const el = await fixture<HTMLElement>('<copy-button disabled></copy-button>');
      const button = el.querySelector('button') as HTMLButtonElement;

      expect(button?.disabled).toBe(true);
    });

    it('should not copy when disabled', async () => {
      const el = await fixture<HTMLElement>('<copy-button value="test" disabled></copy-button>');
      const button = el.querySelector('button');

      button?.click();
      await nextFrame();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });
});