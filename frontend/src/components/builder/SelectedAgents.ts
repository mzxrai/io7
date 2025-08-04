import { selectionStore } from '../../store/selection';
import { agents } from '../../data/agents';
import styles from './SelectedAgents.module.css';

export class SelectedAgents extends HTMLElement {
  private storeListener: ((event: Event) => void) | null = null;
  public agents = agents; // Allow override for testing

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
    this.addEventListener('click', this.handleClick);
  }

  private cleanupEventListeners(): void {
    if (this.storeListener) {
      selectionStore.removeEventListener('change', this.storeListener);
      this.storeListener = null;
    }
    this.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    // Handle remove button clicks
    if (target.classList.contains(styles.removeBtn) || target.closest(`.${styles.removeBtn}`)) {
      const btn = target.classList.contains(styles.removeBtn) ? target : target.closest(`.${styles.removeBtn}`);
      const agentId = btn?.getAttribute('data-agent-id');
      if (agentId) {
        selectionStore.deselect(agentId);
      }
    }
    
    // Handle clear all button
    if (target.classList.contains(styles.clearAllBtn)) {
      selectionStore.clear();
    }
  };

  private render(): void {
    // Apply host styles
    this.className = styles.host;

    const selectedIds = selectionStore.getSelectedIds();
    const selectedAgents = selectedIds
      .map(id => this.agents.find(a => a.id === id))
      .filter(agent => agent !== undefined);

    let content = '';
    
    if (selectedAgents.length === 0) {
      content = `
        <div class="${styles.emptyState}">
          No agents selected
        </div>
      `;
    } else {
      const chips = selectedAgents.map(agent => `
        <div class="${styles.agentChip}" data-agent-id="${agent!.id}">
          <span class="${styles.agentIcon}">${agent!.icon}</span>
          <span class="${styles.agentName}">${agent!.name}</span>
          <button 
            class="${styles.removeBtn}" 
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
        <div class="${styles.selectedContainer}">
          <div class="${styles.header}">
            <span class="${styles.selectionCount}">${countText}</span>
            ${selectedAgents.length > 1 ? `
              <button class="${styles.clearAllBtn}" aria-label="Clear all selections">
                Clear all
              </button>
            ` : ''}
          </div>
          <div class="${styles.chipsContainer}">
            ${chips}
          </div>
        </div>
      `;
    }

    this.innerHTML = content;
  }
}

// Register the custom element
customElements.define('selected-agents', SelectedAgents);