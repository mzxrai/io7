import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, cleanup, queryShadow, queryShadowAll } from '@test-utils/render';
import './AgentStats';

describe('AgentStats', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering stats', () => {
    it('should render downloads when > 100', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats downloads="12400"></agent-stats>
      `);
      
      const stats = queryShadowAll(el, '.stat');
      const downloadStat = Array.from(stats).find(s => s.textContent?.includes('12.4k'));
      expect(downloadStat).toBeTruthy();
      expect(downloadStat?.textContent).toContain('⬇️');
    });

    it('should not render downloads when <= 100', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats downloads="85"></agent-stats>
      `);
      
      const stats = queryShadowAll(el, '.stat');
      const downloadStat = Array.from(stats).find(s => s.textContent?.includes('⬇️'));
      expect(downloadStat).toBeFalsy();
    });

    it('should render upvotes when votes > 100', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats upvotes="92" votes="234"></agent-stats>
      `);
      
      const stats = queryShadowAll(el, '.stat');
      const upvoteStat = Array.from(stats).find(s => s.textContent?.includes('92%'));
      expect(upvoteStat).toBeTruthy();
      expect(upvoteStat?.textContent).toContain('👍');
      expect(upvoteStat?.textContent).toContain('(234)');
    });

    it('should not render upvotes when votes <= 100', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats upvotes="78" votes="23"></agent-stats>
      `);
      
      const stats = queryShadowAll(el, '.stat');
      const upvoteStat = Array.from(stats).find(s => s.textContent?.includes('👍'));
      expect(upvoteStat).toBeFalsy();
    });

    it('should render last updated time', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats last-updated="2d ago"></agent-stats>
      `);
      
      const stats = queryShadowAll(el, '.stat');
      const updateStat = Array.from(stats).find(s => s.textContent?.includes('Updated 2d ago'));
      expect(updateStat).toBeTruthy();
    });

    it('should render view source button', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats agent-id="optimize"></agent-stats>
      `);
      
      const button = queryShadow(el, '.view-source-btn');
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe('View Source');
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
        
        const stats = queryShadowAll(el, '.stat');
        const downloadStat = Array.from(stats).find(s => s.textContent?.includes(expected));
        expect(downloadStat).toBeTruthy();
        cleanup();
      }
    });

    it('should handle all stats together', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats 
          downloads="12400" 
          upvotes="92" 
          votes="234" 
          last-updated="2d ago"
          agent-id="optimize">
        </agent-stats>
      `);
      
      const stats = queryShadowAll(el, '.stat');
      // Should have 3 stats: downloads, upvotes, updated
      expect(stats.length).toBe(3);
      
      const button = queryShadow(el, '.view-source-btn');
      expect(button).toBeTruthy();
    });
  });

  describe('events', () => {
    it('should emit view-source event when button clicked', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats agent-id="optimize"></agent-stats>
      `);
      
      const listener = vi.fn();
      el.addEventListener('view-source', listener);
      
      const button = queryShadow(el, '.view-source-btn') as HTMLButtonElement;
      button?.click();
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { agentId: 'optimize' }
        })
      );
    });

    it('should not render button if no agent-id provided', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats downloads="12400"></agent-stats>
      `);
      
      const button = queryShadow(el, '.view-source-btn');
      expect(button).toBeFalsy();
    });
  });

  describe('edge cases', () => {
    it('should handle no attributes gracefully', async () => {
      const el = await fixture<HTMLElement>(`<agent-stats></agent-stats>`);
      const container = queryShadow(el, '.agent-stats');
      expect(container).toBeTruthy();
      
      // Should have no stats
      const stats = queryShadowAll(el, '.stat');
      expect(stats.length).toBe(0);
    });

    it('should handle invalid numeric values', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-stats downloads="not-a-number" votes="invalid"></agent-stats>
      `);
      
      const stats = queryShadowAll(el, '.stat');
      // Should not render invalid stats
      const downloadStat = Array.from(stats).find(s => s.textContent?.includes('⬇️'));
      expect(downloadStat).toBeFalsy();
    });
  });
});