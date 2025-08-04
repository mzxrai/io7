export class CopyButton extends HTMLElement {
  private shadow: ShadowRoot;
  private timeoutId: number | null = null;

  static get observedAttributes(): string[] {
    return ['text', 'value', 'disabled'];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
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

    this.shadow.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        .copy-button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #999;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
          letter-spacing: -0.2px;
        }

        .copy-button:hover:not(.copy-button--disabled) {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
          color: #fff;
        }

        .copy-button--success {
          background: rgba(0, 255, 0, 0.1);
          border-color: rgba(0, 255, 0, 0.3);
          color: #0f0;
        }

        .copy-button--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>
      <button 
        class="copy-button ${isDisabled ? 'copy-button--disabled' : ''}"
        ${isDisabled ? 'disabled' : ''}>
        ${text}
      </button>
    `;

    // Add event listeners after rendering
    this.addEventListeners();
  }

  private addEventListeners(): void {
    const button = this.shadow.querySelector('button');
    button?.addEventListener('click', this.handleClick);
  }

  private removeEventListeners(): void {
    const button = this.shadow.querySelector('button');
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
    const button = this.shadow.querySelector('button');
    if (!button) return;

    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.classList.add('copy-button--success');

    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Reset after 2 seconds
    this.timeoutId = window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('copy-button--success');
      this.timeoutId = null;
    }, 2000);
  }
}

// Register the custom element
customElements.define('copy-button', CopyButton);