import { fixture, cleanup } from '@test-utils/render';
import { describe, it, expect, afterEach, vi } from 'vitest';
import './AgentStats';

describe('AgentStats', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering stats', () => {
    it('should display downloads when > 100', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats downloads="12400"></agent-stats>
      `);

      // Downloads should be visible with formatted number
      expect(el.textContent).toContain('12.4k');
    });

    it('should not display downloads when <= 100', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats downloads="85"></agent-stats>
      `);

      // Low download count should not be displayed
      expect(el.textContent).not.toContain('85');
    });

    it('should display upvotes when votes > 100', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats upvotes="92" votes="234"></agent-stats>
      `);

      // Upvote stats should be visible
      expect(el.textContent).toContain('92%');
      expect(el.textContent).toContain('(234)');
    });

    it('should not display upvotes when votes <= 100', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats upvotes="78" votes="23"></agent-stats>
      `);

      // Low vote count should not be displayed
      expect(el.textContent).not.toContain('78%');
    });

    it('should display last updated time', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats last-updated="2d ago"></agent-stats>
      `);

      // Update time should be visible
      expect(el.textContent).toContain('Updated 2d ago');
    });

    it('should display view source button', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats agent-id="optimize"></agent-stats>
      `);

      // View source button should be visible
      expect(el.textContent).toContain('View Source');
    });
  });

  describe('formatting', () => {
    it('should format large download numbers', async () => {
      const testCases = [
        { downloads: 1234, expected: '1.2k' },
        { downloads: 12345, expected: '12.3k' },
        { downloads: 123456, expected: '123.5k' },
        { downloads: 1234567, expected: '1.2M' },
      ];

      for (const { downloads, expected } of testCases) {
        const el = await fixture<HTMLElement>(`
          <agent-stats downloads="${downloads}"></agent-stats>
        `);

        // Formatted number should be visible
        expect(el.textContent).toContain(expected);
        cleanup();
      }
    });

    it('should display all stats together', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats 
          downloads="12400" 
          upvotes="92" 
          votes="234" 
          last-updated="2d ago"
          agent-id="optimize">
        </agent-stats>
      `);

      // All stats should be visible
      expect(el.textContent).toContain('12.4k');
      expect(el.textContent).toContain('92%');
      expect(el.textContent).toContain('Updated');
      expect(el.textContent).toContain('View Source');
    });
  });

  describe('events', () => {
    it('should emit view-source event when button clicked', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats agent-id="optimize"></agent-stats>
      `);

      const listener = vi.fn();
      el.addEventListener('view-source', listener);

      const button = el.querySelector('button') as HTMLButtonElement;
      button?.click();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { agentId: 'optimize' },
        }),
      );
    });

    it('should not display view source button if no agent-id provided', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats downloads="12400"></agent-stats>
      `);

      // View source button should not be visible without agent-id
      expect(el.textContent).not.toContain('View Source');
    });
  });

  describe('edge cases', () => {
    it('should handle no attributes gracefully', async () => {
      const el = await fixture<HTMLElement>('<agent-stats></agent-stats>');
      // Component should render but with no visible stats
      expect(el.textContent).not.toContain('⬇️');
      expect(el.textContent).not.toContain('👍');
      expect(el.textContent).not.toContain('Updated');
      expect(el.textContent).not.toContain('View Source');
    });

    it('should handle invalid numeric values', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats downloads="not-a-number" votes="invalid"></agent-stats>
      `);

      // Invalid stats should not be displayed
      expect(el.textContent).not.toContain('⬇️');
      expect(el.textContent).not.toContain('NaN');
      expect(el.textContent).not.toContain('not-a-number');
    });
  });
});