import { agents } from '@data/agents';
import { fixture, cleanup } from '@test-utils/render';
import { describe, it, expect, afterEach } from 'vitest';
import './AgentList';

describe('AgentList', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should display the title', async () => {
      const el = await fixture<HTMLElement>('<agent-list></agent-list>');
      (el as any).setAgents(agents);

      expect(el.textContent).toContain('Available Agents');
    });

    it('should display all agent cards', async () => {
      const el = await fixture<HTMLElement>('<agent-list></agent-list>');
      (el as any).setAgents(agents);

      // Verify we can see agent names from the data
      expect(el.textContent).toContain(agents[0].name);
      expect(el.textContent).toContain(agents[1].name);

      // Verify correct number of cards are rendered
      const cards = el.querySelectorAll('agent-card');
      expect(cards.length).toBe(agents.length);
    });

    it('should pass correct data to agent cards', async () => {
      const el = await fixture<HTMLElement>('<agent-list></agent-list>');
      (el as any).setAgents(agents);

      // Verify first agent's data is displayed
      const firstCard = el.querySelector('agent-card');
      expect(firstCard?.getAttribute('agent-id')).toBe(agents[0].id);
      expect(firstCard?.getAttribute('name')).toBe(agents[0].name);
    });
  });


  describe('empty state', () => {
    it('should show empty message when no agents', async () => {
      const el = await fixture<HTMLElement>('<agent-list></agent-list>');
      (el as any).setAgents([]);

      // Verify empty state message is displayed
      expect(el.textContent).toContain('No agents available');
    });
  });

  describe('performance', () => {
    it('should render large lists efficiently', async () => {
      // Create 100 mock agents
      const manyAgents = Array.from({ length: 100 }, (_, i) => ({
        id: `agent-${i}`,
        name: `agent-${i}`,
        description: `Description for agent ${i}`,
        icon: '🤖',
        stats: {
          downloads: Math.floor(Math.random() * 10000),
          upvotes: Math.floor(Math.random() * 100),
          votes: Math.floor(Math.random() * 500),
        },
        content: '',
      }));

      const el = await fixture<HTMLElement>('<agent-list></agent-list>');
      (el as any).setAgents(manyAgents);

      const cards = el.querySelectorAll('agent-card');
      expect(cards).toHaveLength(100);
    });
  });
});