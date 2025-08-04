import styles from './CopyButton.module.css';

export class CopyButton extends HTMLElement {
  private timeoutId: number | null = null;

  static get observedAttributes(): string[] {
    return ['text', 'value', 'disabled'];
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    this.removeEventListeners();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void {
    this.render();
  }

  private render(): void {
    const text = this.getAttribute('text') || 'Copy';
    const isDisabled = this.hasAttribute('disabled');

    // Remove old event listeners before re-rendering
    this.removeEventListeners();

    // Apply host styles
    this.className = styles.host;

    this.innerHTML = `
      <button 
        class="${styles.button} ${isDisabled ? styles.disabled : ''}"
        ${isDisabled ? 'disabled' : ''}>
        ${text}
      </button>
    `;

    // Add event listeners after rendering
    this.addEventListeners();
  }

  private addEventListeners(): void {
    const button = this.querySelector('button');
    button?.addEventListener('click', this.handleClick);
  }

  private removeEventListeners(): void {
    const button = this.querySelector('button');
    button?.removeEventListener('click', this.handleClick);
  }

  private handleClick = async (): Promise<void> => {
    const value = this.getAttribute('value');
    const isDisabled = this.hasAttribute('disabled');

    if (!value || isDisabled) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      this.showSuccess();
      this.dispatchEvent(new CustomEvent('copy', {
        detail: { value },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  private showSuccess(): void {
    const button = this.querySelector('button');
    if (!button) return;

    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.classList.add(styles.success);

    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Reset after 2 seconds
    this.timeoutId = window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove(styles.success);
      this.timeoutId = null;
    }, 2000);
  }
}

// Register the custom element
customElements.define('copy-button', CopyButton);