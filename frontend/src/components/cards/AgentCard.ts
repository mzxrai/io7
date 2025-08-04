import { selectionStore } from '../../store/selection';
import '../shared/Badge';
import './AgentStats';

export class AgentCard extends HTMLElement {
  private shadow: ShadowRoot;
  private storeListener: ((event: Event) => void) | null = null;

  static get observedAttributes(): string[] {
    return [
      'agent-id', 'name', 'icon', 'category', 'description', 'package',
      'is-popular', 'downloads', 'upvotes', 'votes', 'last-updated'
    ];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
    this.syncWithStore();
  }

  disconnectedCallback(): void {
    this.cleanupEventListeners();
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void {
    this.render();
    this.setupEventListeners();
    this.syncWithStore();
  }

  private setupEventListeners(): void {
    // Clean up old listeners first
    this.cleanupEventListeners();

    // Checkbox change handler
    const checkbox = this.shadow.querySelector('input[type="checkbox"]');
    checkbox?.addEventListener('change', this.handleCheckboxChange);

    // Card click handler (for clicking anywhere on the card)
    const card = this.shadow.querySelector('.agent-card');
    card?.addEventListener('click', this.handleCardClick);

    // Listen to store changes
    this.storeListener = () => this.syncWithStore();
    selectionStore.addEventListener('change', this.storeListener);
  }

  private cleanupEventListeners(): void {
    const checkbox = this.shadow.querySelector('input[type="checkbox"]');
    checkbox?.removeEventListener('change', this.handleCheckboxChange);

    const card = this.shadow.querySelector('.agent-card');
    card?.removeEventListener('click', this.handleCardClick);

    if (this.storeListener) {
      selectionStore.removeEventListener('change', this.storeListener);
      this.storeListener = null;
    }
  }

  private handleCheckboxChange = (event: Event): void => {
    event.stopPropagation();
    const checkbox = event.target as HTMLInputElement;
    const agentId = this.getAttribute('agent-id');
    
    if (!agentId) return;

    if (checkbox.checked) {
      selectionStore.select(agentId);
    } else {
      selectionStore.deselect(agentId);
    }

    this.updateSelectedClass();
    this.emitSelectionEvent(checkbox.checked);
  };

  private handleCardClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    // Don't toggle if clicking on checkbox, stats, or their children
    if (
      target.closest('input[type="checkbox"]') ||
      target.closest('.checkbox-wrapper') ||
      target.closest('agent-stats') ||
      target.tagName === 'AGENT-STATS'
    ) {
      return;
    }

    const agentId = this.getAttribute('agent-id');
    if (!agentId) return;

    selectionStore.toggle(agentId);
    this.syncWithStore();
    this.emitSelectionEvent(selectionStore.isSelected(agentId));
  };

  private syncWithStore(): void {
    const agentId = this.getAttribute('agent-id');
    if (!agentId) return;

    const checkbox = this.shadow.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = selectionStore.isSelected(agentId);
    }

    this.updateSelectedClass();
  }

  private updateSelectedClass(): void {
    const agentId = this.getAttribute('agent-id');
    if (!agentId) return;

    const card = this.shadow.querySelector('.agent-card');
    const isSelected = selectionStore.isSelected(agentId);
    
    if (isSelected) {
      card?.classList.add('selected');
    } else {
      card?.classList.remove('selected');
    }
  }

  private emitSelectionEvent(selected: boolean): void {
    const agentId = this.getAttribute('agent-id');
    if (!agentId) return;

    this.dispatchEvent(new CustomEvent('agent-selected', {
      detail: { agentId, selected },
      bubbles: true,
      composed: true
    }));
  }

  private render(): void {
    const agentId = this.getAttribute('agent-id') || '';
    const name = this.getAttribute('name') || '';
    const icon = this.getAttribute('icon') || '';
    const category = this.getAttribute('category') || '';
    const description = this.getAttribute('description') || '';
    const packageName = this.getAttribute('package') || '';
    const isPopular = this.getAttribute('is-popular') === 'true';
    
    // Stats attributes
    const downloads = this.getAttribute('downloads') || '';
    const upvotes = this.getAttribute('upvotes') || '';
    const votes = this.getAttribute('votes') || '';
    const lastUpdated = this.getAttribute('last-updated') || '';

    const popularBadge = isPopular 
      ? '<agent-badge text="Popular" variant="popular"></agent-badge>'
      : '';

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .agent-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .agent-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .agent-card.selected {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .checkbox-wrapper {
          position: absolute;
          top: 20px;
          right: 20px;
        }

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #fff;
        }

        .agent-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .agent-icon {
          font-size: 32px;
          line-height: 1;
        }

        .agent-info {
          flex: 1;
        }

        .agent-name {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .agent-category {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .agent-description {
          color: #999;
          font-size: 14px;
          line-height: 1.5;
          margin-right: 40px;
        }
      </style>
      <div class="agent-card">
        <div class="checkbox-wrapper">
          <input type="checkbox" 
                 id="checkbox-${agentId}" 
                 data-package="${packageName}">
        </div>
        <div class="agent-header">
          <div class="agent-icon">${icon}</div>
          <div class="agent-info">
            <div class="agent-name">
              ${name}
              ${popularBadge}
            </div>
            <div class="agent-category">${category}</div>
          </div>
        </div>
        <div class="agent-description">${description}</div>
        <agent-stats
          downloads="${downloads}"
          upvotes="${upvotes}"
          votes="${votes}"
          last-updated="${lastUpdated}"
          agent-id="${agentId}">
        </agent-stats>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('agent-card', AgentCard);