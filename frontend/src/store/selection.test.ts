import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SelectionStore } from './selection';
import { agents } from '../data/agents';

describe('SelectionStore', () => {
  let store: SelectionStore;

  beforeEach(() => {
    store = new SelectionStore();
  });

  describe('initialization', () => {
    it('should start with no selections', () => {
      expect(store.getSelectedIds()).toEqual([]);
      expect(store.hasSelections()).toBe(false);
    });

    it('should have count of 0', () => {
      expect(store.getCount()).toBe(0);
    });
  });

  describe('selecting agents', () => {
    it('should add agent to selection', () => {
      store.select('optimize');
      expect(store.getSelectedIds()).toContain('optimize');
      expect(store.hasSelections()).toBe(true);
      expect(store.getCount()).toBe(1);
    });

    it('should add multiple agents to selection', () => {
      store.select('optimize');
      store.select('security');
      store.select('performance');
      
      expect(store.getSelectedIds()).toHaveLength(3);
      expect(store.getSelectedIds()).toContain('optimize');
      expect(store.getSelectedIds()).toContain('security');
      expect(store.getSelectedIds()).toContain('performance');
      expect(store.getCount()).toBe(3);
    });

    it('should not duplicate selections', () => {
      store.select('optimize');
      store.select('optimize');
      store.select('optimize');
      
      expect(store.getSelectedIds()).toHaveLength(1);
      expect(store.getCount()).toBe(1);
    });

    it('should check if agent is selected', () => {
      store.select('optimize');
      expect(store.isSelected('optimize')).toBe(true);
      expect(store.isSelected('security')).toBe(false);
    });
  });

  describe('deselecting agents', () => {
    it('should remove agent from selection', () => {
      store.select('optimize');
      store.select('security');
      
      store.deselect('optimize');
      
      expect(store.getSelectedIds()).not.toContain('optimize');
      expect(store.getSelectedIds()).toContain('security');
      expect(store.getCount()).toBe(1);
    });

    it('should handle deselecting non-selected agent', () => {
      store.select('optimize');
      store.deselect('security'); // Not selected
      
      expect(store.getSelectedIds()).toContain('optimize');
      expect(store.getCount()).toBe(1);
    });
  });

  describe('toggling agents', () => {
    it('should select if not selected', () => {
      store.toggle('optimize');
      expect(store.isSelected('optimize')).toBe(true);
    });

    it('should deselect if selected', () => {
      store.select('optimize');
      store.toggle('optimize');
      expect(store.isSelected('optimize')).toBe(false);
    });
  });

  describe('clearing selections', () => {
    it('should remove all selections', () => {
      store.select('optimize');
      store.select('security');
      store.select('performance');
      
      store.clear();
      
      expect(store.getSelectedIds()).toEqual([]);
      expect(store.hasSelections()).toBe(false);
      expect(store.getCount()).toBe(0);
    });
  });

  describe('command generation', () => {
    it('should generate npx command for single agent', () => {
      store.select('optimize');
      const command = store.generateCommand(agents);
      expect(command).toBe('npx io7@latest --install optimize');
    });

    it('should generate npx command for multiple agents', () => {
      store.select('optimize');
      store.select('security');
      store.select('performance');
      
      const command = store.generateCommand(agents);
      expect(command).toBe('npx io7@latest --install optimize,security-audit,perf-optimizer');
    });

    it('should add --local flag when installing locally', () => {
      store.select('optimize');
      store.select('security');
      
      const command = store.generateCommand(agents, true);
      expect(command).toBe('npx io7@latest --install optimize,security-audit --local');
    });

    it('should return empty string when no selections', () => {
      const command = store.generateCommand(agents);
      expect(command).toBe('');
    });

    it('should handle missing agents gracefully', () => {
      store.select('non-existent');
      const command = store.generateCommand(agents);
      expect(command).toBe('');
    });
  });

  describe('events', () => {
    it('should emit change event when selecting', () => {
      const listener = vi.fn();
      store.addEventListener('change', listener);
      
      store.select('optimize');
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            selectedIds: ['optimize'],
            count: 1,
          },
        })
      );
    });

    it('should emit change event when deselecting', () => {
      const listener = vi.fn();
      store.select('optimize');
      store.addEventListener('change', listener);
      
      store.deselect('optimize');
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            selectedIds: [],
            count: 0,
          },
        })
      );
    });

    it('should emit change event when clearing', () => {
      const listener = vi.fn();
      store.select('optimize');
      store.select('security');
      store.addEventListener('change', listener);
      
      store.clear();
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            selectedIds: [],
            count: 0,
          },
        })
      );
    });

    it('should remove event listener', () => {
      const listener = vi.fn();
      store.addEventListener('change', listener);
      store.removeEventListener('change', listener);
      
      store.select('optimize');
      
      expect(listener).not.toHaveBeenCalled();
    });
  });
});