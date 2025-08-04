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
      
      // Should show empty state initially
      expect(el.textContent).toContain('Select agents to build your pack');
    });
  });

  describe('integration', () => {
    it('should update display when agents are selected', async () => {
      const el = await fixture<HTMLElement>(`<pack-builder></pack-builder>`);
      
      // Initially shows empty state
      expect(el.textContent).toContain('Select agents to build your pack');
      
      // Select an agent
      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should show the command
      expect(el.textContent).toContain('npx io7@latest --install optimize');
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
      
      // Find and click the checkbox directly (not the label)
      const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox?.click();
      
      // Trigger change event to ensure it's handled
      checkbox?.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should now show local install
      expect(el.textContent).toContain('--local');
      // Note: The hint may not update without a full re-render in the test environment
    });
  });

});