import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'popular' | 'stat';

export class Badge extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['text', 'icon', 'variant', 'aria-label'];
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void {
    this.render();
  }

  private render(): void {
    const text = this.getAttribute('text') || '';
    const icon = this.getAttribute('icon');
    const variant = (this.getAttribute('variant') as BadgeVariant) || 'default';
    const ariaLabel = this.getAttribute('aria-label');

    // Apply host styles to the element itself
    this.className = styles.host;

    // Get the variant style - map 'default' to 'defaultVariant'
    const variantKey = variant === 'default' ? 'defaultVariant' : variant;
    const variantClass = styles[variantKey] || styles.defaultVariant;

    this.innerHTML = `
      <div class="${styles.badge} ${variantClass}" 
           ${variant === 'stat' ? 'role="status"' : ''}
           ${ariaLabel ? `aria-label="${ariaLabel}"` : ''}>
        ${icon ? `<span class="${styles.icon}">${icon}</span>` : ''}
        <span class="${styles.text}">${text}</span>
      </div>
    `;
  }

  // Stub for potential future use by test utilities
  get updateComplete(): Promise<boolean> | undefined {
    return Promise.resolve(true);
  }
}

// Register the custom element
customElements.define('agent-badge', Badge);