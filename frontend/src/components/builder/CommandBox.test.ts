import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { fixture, cleanup, queryShadow } from '@test-utils/render';
import { selectionStore } from '@store/selection';
import './CommandBox';

describe('CommandBox', () => {
  beforeEach(() => {
    selectionStore.clear();
  });

  afterEach(() => {
    cleanup();
    selectionStore.clear();
  });

  describe('rendering', () => {
    it('should show empty state when no agents selected', async () => {
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      const emptyState = queryShadow(el, '.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('Select agents to generate command');
    });

    it('should show single agent command', async () => {
      selectionStore.select('optimize');
      
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      const command = queryShadow(el, '.command-text');
      expect(command?.textContent).toBe('npx io7@latest --install optimize');
      
      const label = queryShadow(el, '.command-label');
      expect(label?.textContent).toContain('Install command');
    });

    it('should show multi-agent pack command', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');
      
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      const command = queryShadow(el, '.command-text');
      expect(command?.textContent).toBe('npx io7@latest --install optimize,security-audit');
      
      const label = queryShadow(el, '.command-label');
      expect(label?.textContent).toContain('Create pack with 2 agents');
    });

    it('should include CopyButton component', async () => {
      selectionStore.select('optimize');
      
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      const copyButton = queryShadow(el, 'copy-button');
      expect(copyButton).toBeTruthy();
      expect(copyButton?.getAttribute('value')).toBe('npx io7@latest --install optimize');
    });

    it('should not render CopyButton when no selection', async () => {
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      const copyButton = queryShadow(el, 'copy-button');
      expect(copyButton).toBeFalsy(); // No CopyButton in empty state
    });
  });

  describe('reactivity', () => {
    it('should update when selection changes', async () => {
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      let command = queryShadow(el, '.command-text');
      expect(command).toBeFalsy(); // Empty state
      
      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      command = queryShadow(el, '.command-text');
      expect(command?.textContent).toBe('npx io7@latest --install optimize');
      
      selectionStore.select('security');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      command = queryShadow(el, '.command-text');
      expect(command?.textContent).toBe('npx io7@latest --install optimize,security-audit');
    });

    it('should return to empty state when all deselected', async () => {
      selectionStore.select('optimize');
      
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      let command = queryShadow(el, '.command-text');
      expect(command).toBeTruthy();
      
      selectionStore.clear();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      command = queryShadow(el, '.command-text');
      expect(command).toBeFalsy();
      
      const emptyState = queryShadow(el, '.empty-state');
      expect(emptyState).toBeTruthy();
    });
  });

  describe('command generation', () => {
    it('should handle agents with proper packages', async () => {
      // Mock agents data
      const mockAgents = [
        { id: 'optimize', name: 'Optimizer', package: 'optimize' },
        { id: 'security', name: 'Security', package: 'security-audit' }
      ];

      // Pass agents via attribute
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      (el as any).agents = mockAgents;

      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 10));

      const command = queryShadow(el, '.command-text');
      expect(command?.textContent).toBe('npx io7@latest --install optimize');
    });

    it('should show agent count in label for multi-selection', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');
      selectionStore.select('performance');
      
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      const label = queryShadow(el, '.command-label');
      expect(label?.textContent).toContain('3 agents');
    });
  });
});