import { fixture, cleanup } from '@test-utils/render';
import { describe, it, expect, afterEach } from 'vitest';
import type { Agent } from '../types/Agent';
import './AgentList';

const mockAgents: Agent[] = [
  {
    id: 'test-1',
    name: 'test-agent-1',
    display_name: 'Test Agent 1',
    description: 'Test description 1',
    metadata: {
      category: 'Testing',
      tags: ['test', 'mock'],
    },
    stats: {
      downloads: 100,
      upvotes: 10,
      votes: 20,
    },
    content: '',
    last_updated: '1d ago',
    isPopular: false,
  },
  {
    id: 'test-2',
    name: 'test-agent-2',
    display_name: 'Test Agent 2',
    description: 'Test description 2',
    metadata: {
      category: 'Development',
      tags: ['dev', 'testing'],
    },
    stats: {
      downloads: 200,
      upvotes: 20,
      votes: 40,
    },
    content: '',
    last_updated: '2d ago',
    isPopular: true,
  },
];

describe('AgentList', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should display the title', async () => {
      const el = await fixture<HTMLElement>('<agent-list></agent-list>');
      (el as any).setAgents(mockAgents);

      expect(el.textContent).toContain('Available Agents');
    });

    it('should display all agent cards', async () => {
      const el = await fixture<HTMLElement>('<agent-list></agent-list>');
      (el as any).setAgents(mockAgents);

      // Verify we can see agent names from the data
      expect(el.textContent).toContain(mockAgents[0].display_name);
      expect(el.textContent).toContain(mockAgents[1].display_name);

      // Verify correct number of cards are rendered
      const cards = el.querySelectorAll('agent-card');
      expect(cards.length).toBe(mockAgents.length);
    });

    it('should pass correct data to agent cards', async () => {
      const el = await fixture<HTMLElement>('<agent-list></agent-list>');
      (el as any).setAgents(mockAgents);

      // Verify first agent's data is displayed
      const firstCard = el.querySelector('agent-card');
      expect(firstCard?.getAttribute('agent-id')).toBe(mockAgents[0].id);
      expect(firstCard?.getAttribute('name')).toBe(mockAgents[0].display_name);
      expect(firstCard?.getAttribute('category')).toBe(mockAgents[0].metadata.category);
      expect(firstCard?.getAttribute('tags')).toBe(mockAgents[0].metadata.tags.join(','));
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
      const manyAgents: Agent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `agent-${i}`,
        name: `agent-${i}`,
        display_name: `Agent ${i}`,
        description: `Description for agent ${i}`,
        metadata: {
          category: 'Test',
          tags: ['test', 'performance'],
        },
        stats: {
          downloads: Math.floor(Math.random() * 10000),
          upvotes: Math.floor(Math.random() * 100),
          votes: Math.floor(Math.random() * 500),
        },
        content: '',
        isPopular: false,
      }));

      const el = await fixture<HTMLElement>('<agent-list></agent-list>');
      (el as any).setAgents(manyAgents);

      const cards = el.querySelectorAll('agent-card');
      expect(cards).toHaveLength(100);
    });
  });
});