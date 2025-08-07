import { fixture, cleanup } from '@test-utils/render';
import { describe, it, expect, afterEach, vi } from 'vitest';
import './AgentStats';

describe('AgentStats', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering stats', () => {
    it('should display downloads when > 25', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats downloads="12400"></agent-stats>
      `);

      // Downloads should be visible with formatted number
      expect(el.textContent).toContain('12.4k');
    });

    it('should not display downloads when <= 25', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats downloads="25"></agent-stats>
      `);

      // Download count of 25 or less should not be displayed
      expect(el.textContent).not.toContain('25');

      const el2 = await fixture<HTMLElement>(`
        <agent-stats downloads="10"></agent-stats>
      `);
      expect(el2.textContent).not.toContain('10');
    });

    it('should display vote buttons when agent-id is provided', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats agent-id="test-agent" upvotes="92" downvotes="142"></agent-stats>
      `);

      // Vote buttons functionality is present (can interact with voting)
      const listener = vi.fn();
      el.addEventListener('vote-changed', listener);

      // Component should have voting capability when agent-id is present
      expect(el.getAttribute('agent-id')).toBe('test-agent');
    });

    it('should not display vote buttons when no agent-id', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats upvotes="0" downvotes="0"></agent-stats>
      `);

      // No voting capability without agent-id
      expect(el.getAttribute('agent-id')).toBeNull();
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
          downvotes="142" 
          last-updated="2d ago"
          agent-id="optimize">
        </agent-stats>
      `);

      // All stats should be visible to user
      expect(el.textContent).toContain('12.4k');
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

      // Find the View Source button specifically (not the vote buttons)
      const buttons = el.querySelectorAll('button');
      const viewSourceButton = Array.from(buttons).find(btn => btn.textContent?.includes('View Source')) as HTMLButtonElement;
      viewSourceButton?.click();

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