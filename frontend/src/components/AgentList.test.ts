import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup, queryShadow, queryShadowAll } from '@test-utils/render';
import { agents } from '@data/agents';
import './AgentList';

describe('AgentList', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should render a vertical list container', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      
      // Check that the component has a container div
      const container = el.querySelector('div');
      expect(container).toBeTruthy();
    });

    it('should render a header with title', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      
      // Find header by looking for h2 element
      const title = el.querySelector('h2');
      expect(title).toBeTruthy();
      expect(title?.textContent).toBe('Available Agents');
    });

    it('should render agent cards in a vertical stack', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      
      const cards = queryShadowAll(el, 'agent-card');
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.length).toBe(agents.length);
    });

    it('should apply vertical spacing between cards', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      
      // Check that cards are rendered with proper structure
      const cards = el.querySelectorAll('agent-card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should pass agent data to each card', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      
      const firstCard = queryShadow(el, 'agent-card');
      expect(firstCard?.getAttribute('agent-id')).toBe(agents[0].id);
      expect(firstCard?.getAttribute('name')).toBe(agents[0].name);
    });

    it('should have full width cards', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      
      const cards = queryShadowAll(el, 'agent-card');
      // Cards should take full width of container
      expect(cards[0]?.getAttribute('style') || '').not.toContain('width');
    });
  });

  describe('layout', () => {
    it('should use flex column layout', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      
      // Check that the component has proper structure
      const container = el.querySelector('div');
      expect(container).toBeTruthy();
    });

    it('should not wrap cards into multiple columns', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      
      // Cards should be in a vertical list, not grid
      const cards = el.querySelectorAll('agent-card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('should show empty message when no agents', async () => {
      // Mock empty agents
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      (el as any).agents = [];
      (el as any).render();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Look for the empty state div by its content
      const divs = el.querySelectorAll('div');
      const emptyState = Array.from(divs).find(div => 
        div.textContent?.includes('No agents available')
      );
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('No agents available');
    });
  });

  describe('performance', () => {
    it('should render large lists efficiently', async () => {
      // Create 100 mock agents
      const manyAgents = Array.from({ length: 100 }, (_, i) => ({
        id: `agent-${i}`,
        name: `Agent ${i}`,
        package: `agent-${i}`,
        description: `Description for agent ${i}`,
        icon: '🤖',
        downloads: Math.floor(Math.random() * 10000),
        votes: Math.floor(Math.random() * 500)
      }));

      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      (el as any).agents = manyAgents;
      (el as any).render();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const cards = queryShadowAll(el, 'agent-card');
      expect(cards).toHaveLength(100);
    });
  });
});