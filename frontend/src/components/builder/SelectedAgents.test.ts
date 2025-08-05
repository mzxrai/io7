import { selectionStore } from '@store/selection';
import { fixture, cleanup } from '@test-utils/render';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import './SelectedAgents';

describe('SelectedAgents', () => {
  beforeEach(() => {
    selectionStore.clear();
  });

  afterEach(() => {
    cleanup();
    selectionStore.clear();
  });

  describe('rendering', () => {
    it('should show empty state when no agents selected', async () => {
      const el = await fixture<HTMLElement>('<selected-agents></selected-agents>');

      expect(el.textContent).toContain('No agents selected');
    });

    it('should display selected agents', async () => {
      selectionStore.select('optimize');

      const el = await fixture<HTMLElement>('<selected-agents></selected-agents>');

      expect(el.textContent).toContain('📈');
      expect(el.textContent).toContain('conversion-optimizer');
      expect(el.textContent).toContain('1 agent selected');
    });

    it('should display multiple selected agents', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');
      selectionStore.select('performance');

      const el = await fixture<HTMLElement>('<selected-agents></selected-agents>');

      expect(el.textContent).toContain('3 agents selected');
      expect(el.textContent).toContain('Clear all'); // Should show clear all for multiple
    });
  });

  describe('interaction', () => {
    it('should remove agent when clicking remove button', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');

      const el = await fixture<HTMLElement>('<selected-agents></selected-agents>');

      expect(el.textContent).toContain('2 agents selected');
      expect(el.textContent).toContain('conversion-optimizer');

      // Find and click the first remove button (which should be for optimize)
      const removeBtns = Array.from(el.querySelectorAll('button')).filter(btn =>
        btn.textContent?.trim() === '×',
      );
      removeBtns[0]?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should only have one agent left
      expect(el.textContent).toContain('1 agent selected');
      expect(el.textContent).not.toContain('conversion-optimizer');
      expect(selectionStore.isSelected('optimize')).toBe(false);
      expect(selectionStore.isSelected('security')).toBe(true);
    });

    it('should clear all when clicking clear button', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');
      selectionStore.select('performance');

      const el = await fixture<HTMLElement>('<selected-agents></selected-agents>');

      expect(el.textContent).toContain('3 agents selected');

      const clearBtn = Array.from(el.querySelectorAll('button')).find(btn =>
        btn.textContent?.includes('Clear all'),
      ) as HTMLElement;

      clearBtn?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(el.textContent).toContain('No agents selected');
      expect(selectionStore.getCount()).toBe(0);
    });
  });

  describe('reactivity', () => {
    it('should update when agents are selected', async () => {
      const el = await fixture<HTMLElement>('<selected-agents></selected-agents>');

      expect(el.textContent).toContain('No agents selected');

      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(el.textContent).toContain('1 agent selected');
      expect(el.textContent).toContain('conversion-optimizer');

      selectionStore.select('security');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(el.textContent).toContain('2 agents selected');
    });

    it('should return to empty state when all deselected', async () => {
      selectionStore.select('optimize');

      const el = await fixture<HTMLElement>('<selected-agents></selected-agents>');

      expect(el.textContent).toContain('1 agent selected');

      selectionStore.clear();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(el.textContent).toContain('No agents selected');
    });
  });

  describe('agent data integration', () => {
    it('should handle agents with proper data', async () => {
      // Mock agents data
      const mockAgents = [
        { id: 'test1', name: 'Test Agent 1', icon: '🧪', stats: { downloads: 0, upvotes: 0, votes: 0 }, content: '' },
        { id: 'test2', name: 'Test Agent 2', icon: '🔬', stats: { downloads: 0, upvotes: 0, votes: 0 }, content: '' },
      ];

      const el = await fixture<HTMLElement>('<selected-agents></selected-agents>');
      (el as any).agents = mockAgents;

      selectionStore.select('test1');
      selectionStore.select('test2');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(el.textContent).toContain('🧪');
      expect(el.textContent).toContain('Test Agent 1');
      expect(el.textContent).toContain('🔬');
      expect(el.textContent).toContain('Test Agent 2');
      expect(el.textContent).toContain('2 agents selected');
    });

    it('should handle missing agent gracefully', async () => {
      selectionStore.select('non-existent');

      const el = await fixture<HTMLElement>('<selected-agents></selected-agents>');

      // Should show empty state since the agent doesn't exist
      expect(el.textContent).toContain('No agents selected');
    });
  });
});