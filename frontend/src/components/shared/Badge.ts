export type BadgeVariant = 'default' | 'popular' | 'stat';

export class Badge extends HTMLElement {
  private shadow: ShadowRoot;
  
  static get observedAttributes(): string[] {
    return ['text', 'icon', 'variant', 'aria-label'];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
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

    this.shadow.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        }

        .badge--default {
          background: rgba(255, 255, 255, 0.1);
          color: #999;
        }

        .badge--popular {
          background: linear-gradient(135deg, #fff 0%, #ccc 100%);
          color: #000;
        }

        .badge--stat {
          background: transparent;
          color: #666;
          padding: 0;
          font-size: 12px;
          font-weight: 500;
          text-transform: none;
        }

        .badge-icon {
          font-size: 12px;
          line-height: 1;
        }

        .badge-text {
          line-height: 1;
        }
      </style>
      <div class="badge badge--${variant}" 
           ${variant === 'stat' ? 'role="status"' : ''}
           ${ariaLabel ? `aria-label="${ariaLabel}"` : ''}>
        ${icon ? `<span class="badge-icon">${icon}</span>` : ''}
        <span class="badge-text">${text}</span>
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