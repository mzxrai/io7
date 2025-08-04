import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup } from '@test-utils/render';
import { agents } from '@data/agents';
import './AgentList';

describe('AgentList', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should display the title', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      
      expect(el.textContent).toContain('Available Agents');
    });

    it('should display all agent cards', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      
      // Verify we can see agent names from the data
      expect(el.textContent).toContain(agents[0].name);
      expect(el.textContent).toContain(agents[1].name);
      
      // Verify correct number of cards are rendered
      const cards = el.querySelectorAll('agent-card');
      expect(cards.length).toBe(agents.length);
    });

    it('should pass correct data to agent cards', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      
      // Verify first agent's data is displayed
      const firstCard = el.querySelector('agent-card');
      expect(firstCard?.getAttribute('agent-id')).toBe(agents[0].id);
      expect(firstCard?.getAttribute('name')).toBe(agents[0].name);
    });
  });


  describe('empty state', () => {
    it('should show empty message when no agents', async () => {
      const el = await fixture<HTMLElement>(`<agent-list></agent-list>`);
      (el as any).agents = [];
      (el as any).render();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify empty state message is displayed
      expect(el.textContent).toContain('No agents available');
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
      
      const cards = el.querySelectorAll('agent-card');
      expect(cards).toHaveLength(100);
    });
  });
});