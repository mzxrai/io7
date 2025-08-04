import { selectionStore } from '@store/selection';
import { fixture, cleanup } from '@test-utils/render';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
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
      const el = await fixture<HTMLElement>('<command-box></command-box>');

      expect(el.textContent).toContain('Select agents to build your pack');
    });

    it('should show single agent command', async () => {
      selectionStore.select('optimize');

      const el = await fixture<HTMLElement>('<command-box></command-box>');

      // Text should be clean
      expect(el.textContent).toContain('npx io7@latest --install optimize');
      expect(el.textContent).toContain('Copy Install Command');
    });

    it('should show multi-agent pack command', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');

      const el = await fixture<HTMLElement>('<command-box></command-box>');

      // Text should be clean
      expect(el.textContent).toContain('npx io7@latest --install optimize,security-audit');
      expect(el.textContent).toContain('Copy Install Command');
    });

    it('should provide copy functionality when agents selected', async () => {
      selectionStore.select('optimize');

      const el = await fixture<HTMLElement>('<command-box></command-box>');

      // Copy button should be available with the command
      expect(el.textContent).toContain('Copy');
      expect(el.textContent).toContain('npx io7@latest --install optimize');

      // Verify the copy button has the clean command (without zero-width spaces)
      const copyBtn = el.querySelector('button[data-command]');
      expect(copyBtn?.getAttribute('data-command')).toBe('npx io7@latest --install optimize');
    });
  });

  describe('reactivity', () => {
    it('should update when selection changes', async () => {
      const el = await fixture<HTMLElement>('<command-box></command-box>');

      // Initially shows empty state
      expect(el.textContent).toContain('Select agents to build your pack');
      expect(el.textContent).not.toContain('npx io7@latest');

      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Shows single agent command
      expect(el.textContent).toContain('npx io7@latest --install optimize');
      expect(el.textContent).toContain('Copy Install Command');

      selectionStore.select('security');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Shows multi-agent command
      expect(el.textContent).toContain('npx io7@latest --install optimize,security-audit');
      expect(el.textContent).toContain('Copy Install Command');
    });

    it('should return to empty state when all deselected', async () => {
      selectionStore.select('optimize');

      const el = await fixture<HTMLElement>('<command-box></command-box>');

      // Initially shows command
      expect(el.textContent).toContain('npx io7@latest --install optimize');

      selectionStore.clear();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Back to empty state
      expect(el.textContent).toContain('Select agents to build your pack');
      expect(el.textContent).not.toContain('npx io7@latest');
    });
  });

  describe('command generation', () => {
    it('should handle agents with proper packages', async () => {
      // Mock agents data
      const mockAgents = [
        { id: 'optimize', name: 'Optimizer', package: 'optimize' },
        { id: 'security', name: 'Security', package: 'security-audit' },
      ];

      // Pass agents via attribute
      const el = await fixture<HTMLElement>('<command-box></command-box>');
      (el as any).agents = mockAgents;

      selectionStore.select('optimize');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Text should be clean
      expect(el.textContent).toContain('npx io7@latest --install optimize');
    });

    it('should show command for multi-agent selection', async () => {
      selectionStore.select('optimize');
      selectionStore.select('security');
      selectionStore.select('performance');

      const el = await fixture<HTMLElement>('<command-box></command-box>');

      // Text should be clean
      expect(el.textContent).toContain('npx io7@latest --install optimize,security-audit,perf-optimizer');
      expect(el.textContent).toContain('Copy Install Command');
    });
  });
});