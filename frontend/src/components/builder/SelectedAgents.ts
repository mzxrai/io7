import { selectionStore } from '../../store/selection';
import { agents } from '../../data/agents';

export class SelectedAgents extends HTMLElement {
  private shadow: ShadowRoot;
  private storeListener: ((event: Event) => void) | null = null;
  public agents = agents; // Allow override for testing

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback(): void {
    this.cleanupEventListeners();
  }

  private setupEventListeners(): void {
    this.cleanupEventListeners();
    
    this.storeListener = () => this.render();
    selectionStore.addEventListener('change', this.storeListener);
    
    // Handle chip remove clicks
    this.shadow.addEventListener('click', this.handleClick);
  }

  private cleanupEventListeners(): void {
    if (this.storeListener) {
      selectionStore.removeEventListener('change', this.storeListener);
      this.storeListener = null;
    }
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    // Handle remove button clicks
    if (target.classList.contains('remove-btn') || target.closest('.remove-btn')) {
      const btn = target.classList.contains('remove-btn') ? target : target.closest('.remove-btn');
      const agentId = btn?.getAttribute('data-agent-id');
      if (agentId) {
        selectionStore.deselect(agentId);
      }
    }
    
    // Handle clear all button
    if (target.classList.contains('clear-all-btn')) {
      selectionStore.clear();
    }
  };

  private render(): void {
    const selectedIds = selectionStore.getSelectedIds();
    const selectedAgents = selectedIds
      .map(id => this.agents.find(a => a.id === id))
      .filter(agent => agent !== undefined);

    let content = '';
    
    if (selectedAgents.length === 0) {
      content = `
        <div class="empty-state">
          No agents selected
        </div>
      `;
    } else {
      const chips = selectedAgents.map(agent => `
        <div class="agent-chip" data-agent-id="${agent!.id}">
          <span class="agent-icon">${agent!.icon}</span>
          <span class="agent-name">${agent!.name}</span>
          <button 
            class="remove-btn" 
            data-agent-id="${agent!.id}"
            aria-label="Remove ${agent!.name}"
            title="Remove ${agent!.name}"
          >
            ×
          </button>
        </div>
      `).join('');

      const countText = selectedAgents.length === 1 
        ? '1 agent selected' 
        : `${selectedAgents.length} agents selected`;

      content = `
        <div class="selected-container">
          <div class="header">
            <span class="selection-count">${countText}</span>
            ${selectedAgents.length > 1 ? `
              <button class="clear-all-btn" aria-label="Clear all selections">
                Clear all
              </button>
            ` : ''}
          </div>
          <div class="chips-container">
            ${chips}
          </div>
        </div>
      `;
    }

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .selected-container {
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .selection-count {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .clear-all-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #888;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-all-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.3);
        }

        .chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .agent-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          font-size: 13px;
          color: #fff;
          transition: all 0.2s;
        }

        .agent-chip:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .agent-icon {
          font-size: 16px;
        }

        .agent-name {
          color: #fff;
        }

        .remove-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          padding: 0;
          margin-left: 4px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          color: #aaa;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background: rgba(255, 67, 54, 0.2);
          border-color: rgba(255, 67, 54, 0.4);
          color: #ff4336;
        }

        .empty-state {
          padding: 24px;
          text-align: center;
          color: #666;
          font-size: 14px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }
      </style>
      ${content}
    `;
  }
}

// Register the custom element
customElements.define('selected-agents', SelectedAgents);