import { agentStore } from '../../store/agents';
import type { Agent } from '../../types/Agent';
import styles from './SourceModal.module.css';

export class SourceModal extends HTMLElement {
  private isOpen = false;
  private currentAgent: Agent | null = null;

  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback(): void {
    this.removeEventListeners();
  }

  private setupEventListeners(): void {
    // Close on backdrop click
    this.addEventListener('click', this.handleBackdropClick);

    // Close on ESC key
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private removeEventListeners(): void {
    this.removeEventListener('click', this.handleBackdropClick);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleBackdropClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target === this || target.classList.contains(styles.backdrop)) {
      this.close();
    }
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  };

  public open(agentId: string): void {
    const agent = agentStore.getAgentById(agentId);
    if (!agent) {
      console.error(`Agent with id ${agentId} not found`);
      return;
    }

    this.currentAgent = agent;
    this.isOpen = true;
    this.render();

    // Focus management
    const closeButton = this.querySelector(`.${styles.closeButton}`) as HTMLButtonElement;
    closeButton?.focus();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  public close(): void {
    this.isOpen = false;
    this.currentAgent = null;
    this.render();

    // Restore body scroll
    document.body.style.overflow = '';

    // Emit close event
    this.dispatchEvent(new CustomEvent('modal-closed', {
      bubbles: true,
      composed: true,
    }));
  }

  private handleCopyCode = (): void => {
    if (!this.currentAgent?.content) return;

    navigator.clipboard.writeText(this.currentAgent.content).then(() => {
      // Show feedback
      const copyButton = this.querySelector(`.${styles.copyButton}`) as HTMLButtonElement;
      if (copyButton) {
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        copyButton.classList.add(styles.copied);

        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.classList.remove(styles.copied);
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy code:', err);
    });
  };

  private render(): void {
    if (!this.isOpen || !this.currentAgent) {
      this.innerHTML = '';
      this.className = '';
      return;
    }

    // Apply host styles
    this.className = styles.host;

    // Escape HTML in code content
    const escapedContent = this.escapeHtml(this.currentAgent.content);

    this.innerHTML = `
      <div class="${styles.backdrop}">
        <div class="${styles.modal}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="${styles.header}">
            <h2 id="modal-title" class="${styles.title}">
              ${this.currentAgent.display_name || this.currentAgent.name}
            </h2>
            <div class="${styles.actions}">
              <button class="${styles.copyButton}" aria-label="Copy source code">
                Copy to Clipboard
              </button>
              <button class="${styles.closeButton}" aria-label="Close modal">
                ✕
              </button>
            </div>
          </div>
          
          <div class="${styles.content}">
            <pre class="${styles.codeBlock}"><code>${escapedContent}</code></pre>
          </div>
        </div>
      </div>
    `;

    // Attach event handlers
    const closeButton = this.querySelector(`.${styles.closeButton}`);
    closeButton?.addEventListener('click', () => this.close());

    const copyButton = this.querySelector(`.${styles.copyButton}`);
    copyButton?.addEventListener('click', this.handleCopyCode);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Register the custom element
customElements.define('source-modal', SourceModal);