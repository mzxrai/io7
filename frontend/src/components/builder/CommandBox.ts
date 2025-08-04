import { selectionStore } from '../../store/selection';
import { agents } from '../../data/agents';
import '../shared/CopyButton';
import styles from './CommandBox.module.css';

export class CommandBox extends HTMLElement {
  private storeListener: ((event: Event) => void) | null = null;
  public agents = agents; // Allow override for testing
  public isLocal: boolean = false; // Support local installation flag

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
  }

  private cleanupEventListeners(): void {
    if (this.storeListener) {
      selectionStore.removeEventListener('change', this.storeListener);
      this.storeListener = null;
    }
  }

  public render(): void {
    const selectedCount = selectionStore.getSelectedIds().length;
    const command = selectionStore.generateCommand(this.agents, this.isLocal);

    // Apply host styles
    this.className = styles.host;

    let content = '';
    
    if (selectedCount === 0) {
      content = `
        <div class="${styles.emptyState}">
          Select agents to generate command
        </div>
      `;
    } else {
      const label = selectedCount === 1 
        ? 'Install command'
        : `Create pack with ${selectedCount} agents`;

      content = `
        <div class="${styles.commandContainer}">
          <div class="${styles.commandLabel}">${label}</div>
          <div class="${styles.commandDisplay}">
            <code class="${styles.commandText}">${command}</code>
            <copy-button value="${command}" ${selectedCount === 0 ? 'disabled="true"' : ''}></copy-button>
          </div>
        </div>
      `;
    }

    this.innerHTML = content;
  }
}

// Register the custom element
customElements.define('command-box', CommandBox);