import { agentStore } from '../../store/agents';
import { selectionStore } from '../../store/selection';
import '../shared/CopyButton';
import styles from './CommandBox.module.css';

export class CommandBox extends HTMLElement {
  private storeListener: (() => void) | null = null;
  private agentStoreListener: (() => void) | null = null;
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

    this.agentStoreListener = () => this.render();
    agentStore.addEventListener('agents-updated', this.agentStoreListener);
  }

  private cleanupEventListeners(): void {
    if (this.storeListener) {
      selectionStore.removeEventListener('change', this.storeListener);
      this.storeListener = null;
    }

    if (this.agentStoreListener) {
      agentStore.removeEventListener('agents-updated', this.agentStoreListener);
      this.agentStoreListener = null;
    }

    // Remove copy button listener if it exists
    const copyBtn = this.querySelector(`.${styles.copyButton}`) as HTMLButtonElement;
    copyBtn?.removeEventListener('click', this.handleCopyClick);
  }

  public render(): void {
    const selectedCount = selectionStore.getSelectedIds().length;
    const command = selectionStore.generateCommand(agentStore.getAgents(), this.isLocal);

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
      // Use <wbr> tags for line break opportunities - these don't get copied
      const displayCommand = command
        .replace(/,/g, ',<wbr>')  // Add word break opportunity after commas
        .replace(/ /g, ' <wbr>'); // Add word break opportunity after spaces

      content = `
        <div class="${styles.commandContainer}">
          <div class="${styles.commandDisplay}">
            <code class="${styles.commandText}">${displayCommand}</code>
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

  private handleCopyClick = async (event: Event): Promise<void> => {
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