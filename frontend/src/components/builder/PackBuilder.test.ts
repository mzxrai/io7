import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { fixture, cleanup } from '@test-utils/render';
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
    it('should display pack builder interface', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      // Should show title and sections
      expect(el.textContent).toContain('Your Agent Pack');
      expect(el.textContent).toContain('Install Command');
      expect(el.textContent).toContain('Selected Agents');
      
      // Should show empty state initially
      expect(el.textContent).toContain('Select agents to generate command');
      expect(el.textContent).toContain('No agents selected');
    });
  });

  describe('integration', () => {
    it('should update display when agents are selected', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      // Initially shows empty states
      expect(el.textContent).toContain('Select agents to generate command');
      expect(el.textContent).toContain('No agents selected');
      
      // Select an agent
      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should show the command and selected agent
      expect(el.textContent).toContain('npx io7@latest --install optimize');
      expect(el.textContent).toContain('Conversion Optimizer');
    });

    it('should toggle between local and global installation', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      // Select an agent first
      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Initially shows global install (default)
      expect(el.textContent).toContain('~/.claude/agents/');
      expect(el.textContent).toContain('npx io7@latest --install optimize');
      expect(el.textContent).not.toContain('--local');
      
      // Find and click the local installation toggle
      // Look for clickable element near "Install to project" text
      const labels = el.querySelectorAll('label');
      const localLabel = Array.from(labels).find(label => 
        label.textContent?.includes('Install to project')
      );
      localLabel?.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should now show local install
      expect(el.textContent).toContain('./.claude/agents/');
      expect(el.textContent).toContain('--local');
    });
  });

});