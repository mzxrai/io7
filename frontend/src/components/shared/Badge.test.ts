import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup, queryShadow, nextFrame } from '@test-utils/render';
import './Badge';

describe('Badge', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should render with text content', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Popular"></agent-badge>');
      const textElement = queryShadow(el, '.badge-text');
      expect(textElement?.textContent).toBe('Popular');
    });

    it('should render with icon when provided', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Downloads" icon="⬇️"></agent-badge>');
      const iconElement = queryShadow(el, '.badge-icon');
      expect(iconElement?.textContent).toBe('⬇️');
    });

    it('should not render icon element when no icon provided', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Updated"></agent-badge>');
      const iconElement = queryShadow(el, '.badge-icon');
      expect(iconElement).toBeNull();
    });
  });

  describe('variants', () => {
    it('should apply default variant class when no variant specified', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Test"></agent-badge>');
      const badge = queryShadow(el, '.badge');
      expect(badge?.classList.contains('badge--default')).toBe(true);
    });

    it('should apply popular variant class', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Popular" variant="popular"></agent-badge>');
      const badge = queryShadow(el, '.badge');
      expect(badge?.classList.contains('badge--popular')).toBe(true);
    });

    it('should apply stat variant class', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="12.4k" variant="stat"></agent-badge>');
      const badge = queryShadow(el, '.badge');
      expect(badge?.classList.contains('badge--stat')).toBe(true);
    });
  });

  describe('attributes', () => {
    it('should update when text attribute changes', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Initial"></agent-badge>');
      let textElement = queryShadow(el, '.badge-text');
      expect(textElement?.textContent).toBe('Initial');
      
      el.setAttribute('text', 'Updated');
      await nextFrame();
      textElement = queryShadow(el, '.badge-text');
      expect(textElement?.textContent).toBe('Updated');
    });

    it('should update when icon attribute changes', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="Test"></agent-badge>');
      let iconElement = queryShadow(el, '.badge-icon');
      expect(iconElement).toBeNull();
      
      el.setAttribute('icon', '🔥');
      await nextFrame();
      iconElement = queryShadow(el, '.badge-icon');
      expect(iconElement?.textContent).toBe('🔥');
    });
  });

  describe('accessibility', () => {
    it('should have role="status" for stat badges', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="12.4k" variant="stat"></agent-badge>');
      const badge = queryShadow(el, '.badge');
      expect(badge?.getAttribute('role')).toBe('status');
    });

    it('should have appropriate aria-label', async () => {
      const el = await fixture<HTMLElement>('<agent-badge text="12.4k" icon="⬇️" aria-label="12.4k downloads"></agent-badge>');
      const badge = queryShadow(el, '.badge');
      expect(badge?.getAttribute('aria-label')).toBe('12.4k downloads');
    });
  });
});