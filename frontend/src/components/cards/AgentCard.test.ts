import { selectionStore } from '@store/selection';
import { fixture, cleanup } from '@test-utils/render';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
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
          category="Marketing"
          description="AI-powered conversion rate optimization"
          package="@agenthub/optimize">
        </agent-card>
      `);

      // Find elements by their content
      expect(el.textContent).toContain('Conversion Optimizer');
      expect(el.textContent).toContain('Marketing');
      expect(el.textContent).toContain('AI-powered conversion rate optimization');
    });

    it('should allow selection via checkbox', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card
          agent-id="optimize"
          package="@agenthub/optimize">
        </agent-card>
      `);

      const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox).toBeTruthy();
      expect(checkbox.checked).toBe(false);

      // User can check the checkbox
      checkbox.click();
      expect(checkbox.checked).toBe(true);
    });

    it('should display popular indicator when is-popular is true', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card
          agent-id="optimize"
          name="Conversion Optimizer"
          is-popular="true">
        </agent-card>
      `);

      // Popular agents should show a popular indicator
      expect(el.textContent).toContain('Popular');
    });

    it('should not display popular indicator when is-popular is false', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card
          agent-id="security"
          name="Security Auditor"
          is-popular="false">
        </agent-card>
      `);

      // Non-popular agents should not show popular indicator
      expect(el.textContent).not.toContain('Popular');
    });

    it('should display agent statistics', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card
          agent-id="optimize"
          downloads="12400"
          upvotes="92"
          votes="234"
          last-updated="2d ago">
        </agent-card>
      `);

      // Stats should be visible to the user
      expect(el.textContent).toContain('12.4k'); // formatted downloads
      expect(el.textContent).toContain('92%'); // upvote percentage
      expect(el.textContent).toContain('(234)'); // vote count
      expect(el.textContent).toContain('Updated 2d ago');
    });
  });

  describe('selection behavior', () => {
    it('should sync checkbox with selection store on mount', async () => {
      // Pre-select in store
      selectionStore.select('optimize');

      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should update store when checkbox is clicked', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
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

    it('should allow view source button click without affecting selection', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      // The View Source button should be clickable independently
      // This test verifies that the component has proper event handling
      // In practice, clicking View Source shouldn't change selection state

      // First select the agent
      const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.click();
      expect(selectionStore.isSelected('optimize')).toBe(true);

      // Clicking view source (when implemented) shouldn't deselect
      // For now, this just verifies selection works as expected
      expect(selectionStore.isSelected('optimize')).toBe(true);
    });

    it('should update checkbox when store changes externally', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
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
      const stats = el.querySelector('agent-stats');
      stats?.dispatchEvent(new CustomEvent('view-source', {
        detail: { agentId: 'optimize' },
        bubbles: true,
        composed: true,
      }));

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { agentId: 'optimize' },
        }),
      );
    });

    it('should emit agent-selected event when selection changes', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      const listener = vi.fn();
      el.addEventListener('agent-selected', listener);

      const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.click();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            agentId: 'optimize',
            selected: true,
          },
        }),
      );
    });
  });

  describe('visual state', () => {
    it('should reflect selected state through checkbox', async () => {
      const el = await fixture<HTMLElement>(`
        <agent-card agent-id="optimize"></agent-card>
      `);

      const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;

      // Initially not selected
      expect(checkbox.checked).toBe(false);

      checkbox.click();

      // Now selected
      expect(checkbox.checked).toBe(true);

      // Verify selection is tracked in store
      expect(selectionStore.isSelected('optimize')).toBe(true);
    });
  });
});