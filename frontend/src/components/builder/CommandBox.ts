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
    
    // Remove copy button listener if it exists
    const copyBtn = this.querySelector(`.${styles.copyButton}`) as HTMLButtonElement;
    copyBtn?.removeEventListener('click', this.handleCopyClick);
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
          Select agents to build your pack
        </div>
      `;
    } else {
      content = `
        <div class="${styles.commandContainer}">
          <div class="${styles.commandDisplay}">
            <code class="${styles.commandText}">${command}</code>
          </div>
          <button class="${styles.copyButton}" data-command="${command}">
            Copy Install Command
          </button>
        </div>
      `;
    }

    this.innerHTML = content;
    
    // Add event listener for copy button if it exists
    if (selectedCount > 0) {
      const copyBtn = this.querySelector(`.${styles.copyButton}`) as HTMLButtonElement;
      copyBtn?.addEventListener('click', this.handleCopyClick);
    }
  }
  
  private handleCopyClick = async (event: Event): void => {
    const button = event.target as HTMLButtonElement;
    const command = button.getAttribute('data-command');
    
    if (command) {
      try {
        await navigator.clipboard.writeText(command);
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = 'Copy Install Command';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };
}

// Register the custom element
customElements.define('command-box', CommandBox);