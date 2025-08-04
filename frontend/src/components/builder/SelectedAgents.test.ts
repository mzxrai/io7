import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { fixture, cleanup, queryShadow, queryShadowAll } from '@test-utils/render';
import { selectionStore } from '@store/selection';
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
      const el = await fixture<HTMLElement>(`<selected-agents></selected-agents>`);
      
      const emptyState = queryShadow(el, '.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('No agents selected');
    });

    it('should display single selected agent chip', async () => {
      selectionStore.select('optimize');
      
      const el = await fixture<HTMLElement>(`<selected-agents></selected-agents>`);
      
      const chips = queryShadowAll(el, '.agent-chip');
      expect(chips).toHaveLength(1);
      
      const chip = chips[0];
      expect(chip?.textContent).toContain('📈');
      expect(chip?.textContent).toContain('Conversion Optimizer');
    });

    it('should display multiple selected agent chips', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');
      selectionStore.select('performance');
      
      const el = await fixture<HTMLElement>(`<selected-agents></selected-agents>`);
      
      const chips = queryShadowAll(el, '.agent-chip');
      expect(chips).toHaveLength(3);
    });

    it('should include remove button on each chip', async () => {
      selectionStore.select('optimize');
      
      const el = await fixture<HTMLElement>(`<selected-agents></selected-agents>`);
      
      const removeBtn = queryShadow(el, '.remove-btn');
      expect(removeBtn).toBeTruthy();
      expect(removeBtn?.getAttribute('aria-label')).toContain('Remove');
    });

    it('should show agent count when multiple selected', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');
      
      const el = await fixture<HTMLElement>(`<selected-agents></selected-agents>`);
      
      const count = queryShadow(el, '.selection-count');
      expect(count?.textContent).toContain('2 agents selected');
    });
  });

  describe('interaction', () => {
    it('should remove agent when clicking remove button', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');
      
      const el = await fixture<HTMLElement>(`<selected-agents></selected-agents>`);
      
      const chips = queryShadowAll(el, '.agent-chip');
      expect(chips).toHaveLength(2);
      
      // Click remove on first chip (optimize)
      const removeBtn = queryShadow(el, '.remove-btn[data-agent-id="optimize"]') as HTMLElement;
      removeBtn?.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should only have one chip left
      const updatedChips = queryShadowAll(el, '.agent-chip');
      expect(updatedChips).toHaveLength(1);
      expect(selectionStore.isSelected('optimize')).toBe(false);
      expect(selectionStore.isSelected('security')).toBe(true);
    });

    it('should clear all when clicking clear button', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');
      selectionStore.select('performance');
      
      const el = await fixture<HTMLElement>(`<selected-agents></selected-agents>`);
      
      const clearBtn = queryShadow(el, '.clear-all-btn') as HTMLElement;
      expect(clearBtn).toBeTruthy();
      
      clearBtn?.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const emptyState = queryShadow(el, '.empty-state');
      expect(emptyState).toBeTruthy();
      expect(selectionStore.getCount()).toBe(0);
    });
  });

  describe('reactivity', () => {
    it('should update when agents are selected', async () => {
      const el = await fixture<HTMLElement>(`<selected-agents></selected-agents>`);
      
      let chips = queryShadowAll(el, '.agent-chip');
      expect(chips).toHaveLength(0);
      
      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      chips = queryShadowAll(el, '.agent-chip');
      expect(chips).toHaveLength(1);
      
      selectionStore.select('security');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      chips = queryShadowAll(el, '.agent-chip');
      expect(chips).toHaveLength(2);
    });

    it('should return to empty state when all deselected', async () => {
      selectionStore.select('optimize');
      
      const el = await fixture<HTMLElement>(`<selected-agents></selected-agents>`);
      
      let chips = queryShadowAll(el, '.agent-chip');
      expect(chips).toHaveLength(1);
      
      selectionStore.clear();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      chips = queryShadowAll(el, '.agent-chip');
      expect(chips).toHaveLength(0);
      
      const emptyState = queryShadow(el, '.empty-state');
      expect(emptyState).toBeTruthy();
    });
  });

  describe('agent data integration', () => {
    it('should handle agents with proper data', async () => {
      // Mock agents data
      const mockAgents = [
        { id: 'test1', name: 'Test Agent 1', icon: '🧪', package: 'test1' },
        { id: 'test2', name: 'Test Agent 2', icon: '🔬', package: 'test2' }
      ];

      const el = await fixture<HTMLElement>(`<selected-agents></selected-agents>`);
      (el as any).agents = mockAgents;

      selectionStore.select('test1');
      selectionStore.select('test2');
      await new Promise(resolve => setTimeout(resolve, 10));

      const chips = queryShadowAll(el, '.agent-chip');
      expect(chips).toHaveLength(2);
      expect(chips[0]?.textContent).toContain('🧪');
      expect(chips[0]?.textContent).toContain('Test Agent 1');
      expect(chips[1]?.textContent).toContain('🔬');
      expect(chips[1]?.textContent).toContain('Test Agent 2');
    });

    it('should handle missing agent gracefully', async () => {
      selectionStore.select('non-existent');
      
      const el = await fixture<HTMLElement>(`<selected-agents></selected-agents>`);
      
      const chips = queryShadowAll(el, '.agent-chip');
      expect(chips).toHaveLength(0); // Should not render chip for missing agent
    });
  });
});