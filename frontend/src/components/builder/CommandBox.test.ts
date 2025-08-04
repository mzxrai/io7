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
      
      // Look for empty state by content
      const divs = el.querySelectorAll('div');
      const emptyState = Array.from(divs).find(div => 
        div.textContent?.includes('Select agents to generate command')
      );
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('Select agents to generate command');
    });

    it('should show single agent command', async () => {
      selectionStore.select('optimize');
      
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      // Find command text by looking for the specific content
      const divs = el.querySelectorAll('div');
      const command = Array.from(divs).find(div => 
        div.textContent === 'npx io7@latest --install optimize'
      );
      expect(command?.textContent).toBe('npx io7@latest --install optimize');
      
      // Find label
      const label = Array.from(divs).find(div => 
        div.textContent?.includes('Install command')
      );
      expect(label?.textContent).toContain('Install command');
    });

    it('should show multi-agent pack command', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');
      
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      // Find command text
      const divs = el.querySelectorAll('div');
      const command = Array.from(divs).find(div => 
        div.textContent === 'npx io7@latest --install optimize,security-audit'
      );
      expect(command?.textContent).toBe('npx io7@latest --install optimize,security-audit');
      
      // Find label
      const label = Array.from(divs).find(div => 
        div.textContent?.includes('Create pack with 2 agents')
      );
      expect(label?.textContent).toContain('Create pack with 2 agents');
    });

    it('should include CopyButton component', async () => {
      selectionStore.select('optimize');
      
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      const copyButton = el.querySelector('copy-button');
      expect(copyButton).toBeTruthy();
      expect(copyButton?.getAttribute('value')).toBe('npx io7@latest --install optimize');
    });

    it('should not render CopyButton when no selection', async () => {
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      const copyButton = el.querySelector('copy-button');
      expect(copyButton).toBeFalsy(); // No CopyButton in empty state
    });
  });

  describe('reactivity', () => {
    it('should update when selection changes', async () => {
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      // Initially empty
      let divs = el.querySelectorAll('div');
      let command = Array.from(divs).find(div => 
        div.textContent?.includes('npx io7@latest')
      );
      expect(command).toBeFalsy(); // Empty state
      
      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      divs = el.querySelectorAll('div');
      command = Array.from(divs).find(div => 
        div.textContent === 'npx io7@latest --install optimize'
      );
      expect(command?.textContent).toBe('npx io7@latest --install optimize');
      
      selectionStore.select('security');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      divs = el.querySelectorAll('div');
      command = Array.from(divs).find(div => 
        div.textContent === 'npx io7@latest --install optimize,security-audit'
      );
      expect(command?.textContent).toBe('npx io7@latest --install optimize,security-audit');
    });

    it('should return to empty state when all deselected', async () => {
      selectionStore.select('optimize');
      
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      let divs = el.querySelectorAll('div');
      let command = Array.from(divs).find(div => 
        div.textContent?.includes('npx io7@latest')
      );
      expect(command).toBeTruthy();
      
      selectionStore.clear();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      divs = el.querySelectorAll('div');
      command = Array.from(divs).find(div => 
        div.textContent?.includes('npx io7@latest')
      );
      expect(command).toBeFalsy();
      
      const emptyState = Array.from(divs).find(div => 
        div.textContent?.includes('Select agents to generate command')
      );
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

      const divs = el.querySelectorAll('div');
      const command = Array.from(divs).find(div => 
        div.textContent === 'npx io7@latest --install optimize'
      );
      expect(command?.textContent).toBe('npx io7@latest --install optimize');
    });

    it('should show agent count in label for multi-selection', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');
      selectionStore.select('performance');
      
      const el = await fixture<HTMLElement>(`<command-box></command-box>`);
      
      const divs = el.querySelectorAll('div');
      const label = Array.from(divs).find(div => 
        div.textContent?.includes('3 agents')
      );
      expect(label?.textContent).toContain('3 agents');
    });
  });
});