import { fixture, cleanup, nextFrame } from '@test-utils/render';
import { describe, it, expect, afterEach } from 'vitest';
import './Badge';

describe('Badge', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should render with text content', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Popular"></agent-badge>');
      expect(el.textContent?.trim()).toBe('Popular');
    });

    it('should render with icon when provided', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Downloads" icon="⬇️"></agent-badge>');
      expect(el.textContent).toContain('⬇️');
      expect(el.textContent).toContain('Downloads');
    });

    it('should not render icon when no icon provided', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Updated"></agent-badge>');
      expect(el.textContent?.trim()).toBe('Updated');
      expect(el.textContent).not.toContain('⬇️');
    });
  });

  describe('variants', () => {
    it('should render with default variant', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Test"></agent-badge>');
      expect(el.textContent?.trim()).toBe('Test');
    });

    it('should render with popular variant', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Popular" variant="popular"></agent-badge>');
      expect(el.textContent?.trim()).toBe('Popular');
    });

    it('should render with stat variant', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="12.4k" variant="stat"></agent-badge>');
      expect(el.textContent?.trim()).toBe('12.4k');
    });
  });

  describe('attributes', () => {
    it('should update when text attribute changes', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Initial"></agent-badge>');
      expect(el.textContent?.trim()).toBe('Initial');

      el.setAttribute('text', 'Updated');
      await nextFrame();
      expect(el.textContent?.trim()).toBe('Updated');
    });

    it('should update when icon attribute changes', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Badge"></agent-badge>');
      expect(el.textContent?.trim()).toBe('Badge');

      el.setAttribute('icon', '🔥');
      await nextFrame();
      expect(el.textContent).toContain('🔥');
    });
  });

  describe('accessibility', () => {
    it('should be accessible to screen readers', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="12.4k" variant="stat" aria-label="12.4k downloads"></agent-badge>');
      // Badge should display its text content
      expect(el.textContent?.trim()).toBe('12.4k');
      // Note: Actual screen reader behavior would be tested with e2e tests
    });
  });
});