import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { fixture, cleanup, queryShadow } from '@test-utils/render';
import { selectionStore } from '@store/selection';
import './AgentCard';
import '../shared/Badge';
import './AgentStats';

describe('AgentCard', () => {
  beforeEach(() => {
    // Clear selections before each test
    selectionStore.clear();
  });

  afterEach(() => {
    cleanup();
    selectionStore.clear();
  });

  describe('rendering', () => {
    it('should render agent basic info', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card
          agent-id="optimize"
          name="Conversion Optimizer"
          icon="📈"
          category="Marketing"
          description="AI-powered conversion rate optimization"
          package="@agenthub/optimize">
        </agent-card>
      `);

      const name = queryShadow(el, '.agent-name');
      expect(name?.textContent).toContain('Conversion Optimizer');

      const icon = queryShadow(el, '.agent-icon');
      expect(icon?.textContent).toBe('📈');

      const category = queryShadow(el, '.agent-category');
      expect(category?.textContent).toBe('Marketing');

      const description = queryShadow(el, '.agent-description');
      expect(description?.textContent).toContain('AI-powered conversion rate optimization');
    });

    it('should render checkbox with correct data-package', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card
          agent-id="optimize"
          package="@agenthub/optimize">
        </agent-card>
      `);

      const checkbox = queryShadow(el, 'input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox).toBeTruthy();
      expect(checkbox.getAttribute('data-package')).toBe('@agenthub/optimize');
    });

    it('should render popular badge when is-popular is true', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card
          agent-id="optimize"
          name="Conversion Optimizer"
          is-popular="true">
        </agent-card>
      `);

      const badge = queryShadow(el, 'agent-badge');
      expect(badge).toBeTruthy();
      expect(badge?.getAttribute('variant')).toBe('popular');
    });

    it('should not render popular badge when is-popular is false', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card
          agent-id="security"
          name="Security Auditor"
          is-popular="false">
        </agent-card>
      `);

      const badge = queryShadow(el, 'agent-badge');
      expect(badge).toBeFalsy();
    });

    it('should render agent-stats component', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card
          agent-id="optimize"
          downloads="12400"
          upvotes="92"
          votes="234"
          last-updated="2d ago">
        </agent-card>
      `);

      const stats = queryShadow(el, 'agent-stats');
      expect(stats).toBeTruthy();
      expect(stats?.getAttribute('downloads')).toBe('12400');
      expect(stats?.getAttribute('upvotes')).toBe('92');
      expect(stats?.getAttribute('votes')).toBe('234');
      expect(stats?.getAttribute('last-updated')).toBe('2d ago');
    });
  });

  describe('selection behavior', () => {
    it('should sync checkbox with selection store on mount', async () => {
      // Pre-select in store
      selectionStore.select('optimize');

      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      const checkbox = queryShadow(el, 'input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should update store when checkbox is clicked', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      const checkbox = queryShadow(el, 'input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      checkbox.click();
      expect(selectionStore.isSelected('optimize')).toBe(true);
      expect(checkbox.checked).toBe(true);

      checkbox.click();
      expect(selectionStore.isSelected('optimize')).toBe(false);
      expect(checkbox.checked).toBe(false);
    });

    it('should toggle selection when card is clicked (not checkbox)', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      // Click on the host element itself
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(selectionStore.isSelected('optimize')).toBe(true);
    });

    it('should not toggle when clicking on view source button area', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      // Simulate stats component with view source button
      const stats = queryShadow(el, 'agent-stats');
      stats?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Should not toggle selection
      expect(selectionStore.isSelected('optimize')).toBe(false);
    });

    it('should update checkbox when store changes externally', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      const checkbox = queryShadow(el, 'input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      // Change store externally
      selectionStore.select('optimize');
      
      // Wait for component to react
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('events', () => {
    it('should forward view-source event from agent-stats', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      const listener = vi.fn();
      el.addEventListener('view-source', listener);

      // Find and trigger the stats component's view source event
      const stats = queryShadow(el, 'agent-stats');
      stats?.dispatchEvent(new CustomEvent('view-source', {
        detail: { agentId: 'optimize' },
        bubbles: true,
        composed: true
      }));

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { agentId: 'optimize' }
        })
      );
    });

    it('should emit agent-selected event when selection changes', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      const listener = vi.fn();
      el.addEventListener('agent-selected', listener);

      const checkbox = queryShadow(el, 'input[type="checkbox"]') as HTMLInputElement;
      checkbox.click();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { 
            agentId: 'optimize',
            selected: true
          }
        })
      );
    });
  });

  describe('styling', () => {
    it('should add selected class when agent is selected', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      // Selected class is now on the host element
      expect(el.classList.contains('selected')).toBe(false);

      const checkbox = queryShadow(el, 'input[type="checkbox"]') as HTMLInputElement;
      checkbox.click();

      expect(el.classList.contains('selected')).toBe(true);
    });
  });
});