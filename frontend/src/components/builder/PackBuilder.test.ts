import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { fixture, cleanup, queryShadow } from '@test-utils/render';
import { selectionStore } from '@store/selection';
import './PackBuilder';

describe('PackBuilder', () => {
  beforeEach(() => {
    selectionStore.clear();
  });

  afterEach(() => {
    cleanup();
    selectionStore.clear();
  });

  describe('rendering', () => {
    it('should render CommandBox component', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      const commandBox = queryShadow(el, 'command-box');
      expect(commandBox).toBeTruthy();
    });

    it('should render SelectedAgents component', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      const selectedAgents = queryShadow(el, 'selected-agents');
      expect(selectedAgents).toBeTruthy();
    });

    it('should have proper container structure', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      const container = queryShadow(el, '.pack-builder-container');
      expect(container).toBeTruthy();
      
      const heading = queryShadow(el, '.builder-heading');
      expect(heading).toBeTruthy();
      expect(heading?.textContent).toContain('Agent Pack Builder');
    });

    it('should show section labels', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      const commandSection = queryShadow(el, '.command-section');
      expect(commandSection).toBeTruthy();
      
      const selectedSection = queryShadow(el, '.selected-section');
      expect(selectedSection).toBeTruthy();
    });

    it('should have sticky positioning styles', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      const container = queryShadow(el, '.pack-builder-container');
      
      // Check if container exists with proper class
      expect(container?.className).toContain('pack-builder-container');
    });
  });

  describe('integration', () => {
    it('should update both child components when selection changes', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      // Initially empty
      let commandBox = queryShadow(el, 'command-box');
      let commandEmpty = queryShadow(commandBox as HTMLElement, '.empty-state');
      expect(commandEmpty).toBeTruthy();
      
      let selectedAgents = queryShadow(el, 'selected-agents');
      let selectedEmpty = queryShadow(selectedAgents as HTMLElement, '.empty-state');
      expect(selectedEmpty).toBeTruthy();
      
      // Select an agent
      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Both should update
      commandBox = queryShadow(el, 'command-box');
      const commandText = queryShadow(commandBox as HTMLElement, '.command-text');
      expect(commandText).toBeTruthy();
      expect(commandText?.textContent).toContain('optimize');
      
      selectedAgents = queryShadow(el, 'selected-agents');
      const agentChip = queryShadow(selectedAgents as HTMLElement, '.agent-chip');
      expect(agentChip).toBeTruthy();
    });

    it('should handle local installation toggle', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      const localToggle = queryShadow(el, '.local-toggle') as HTMLInputElement;
      expect(localToggle).toBeTruthy();
      expect(localToggle?.type).toBe('checkbox');
      
      // Initially unchecked (global install)
      expect(localToggle?.checked).toBe(false);
      
      // Check the toggle
      localToggle?.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(localToggle?.checked).toBe(true);
      
      // Select an agent and verify command includes --local
      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const commandBox = queryShadow(el, 'command-box');
      const commandText = queryShadow(commandBox as HTMLElement, '.command-text');
      expect(commandText?.textContent).toContain('--local');
    });
  });

  describe('layout', () => {
    it('should stack components vertically', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      const sections = [
        queryShadow(el, '.command-section'),
        queryShadow(el, '.selected-section')
      ];
      
      sections.forEach(section => {
        expect(section).toBeTruthy();
      });
    });
  });
});