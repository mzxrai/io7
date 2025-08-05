import { selectionStore } from '@store/selection';
import { fixture, cleanup } from '@test-utils/render';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
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
      const el = await fixture<HTMLElement>('<pack-builder></pack-builder>');

      // Should show title and sections
      expect(el.textContent).toContain('Your Agent Pack');
      expect(el.textContent).toContain('Install Command');

      // Should show empty state initially
      expect(el.textContent).toContain('Select agents to build your pack');
    });

    it('should not show checkbox when no agents are selected', async () => {
      const el = await fixture<HTMLElement>('<pack-builder></pack-builder>');

      // Should not show the checkbox option initially
      expect(el.textContent).not.toContain('Install for single project');
    });
  });

  describe('integration', () => {
    it('should update display when agents are selected', async () => {
      const el = await fixture<HTMLElement>('<pack-builder></pack-builder>');

      // Initially shows empty state
      expect(el.textContent).toContain('Select agents to build your pack');

      // Select an agent
      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should show the command
      expect(el.textContent).toContain('npx io7@latest --install conversion-optimizer');
    });

    it('should show checkbox option when agents are selected', async () => {
      const el = await fixture<HTMLElement>('<pack-builder></pack-builder>');

      // Initially no checkbox option
      expect(el.textContent).not.toContain('Install for single project');

      // Select an agent
      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should now show the checkbox option
      expect(el.textContent).toContain('Install for single project');

      // Should show global install by default (no --local flag)
      expect(el.textContent).toContain('npx io7@latest --install conversion-optimizer');
      expect(el.textContent).not.toContain('--local');
    });
  });

});