export class AgentStats extends HTMLElement {
  private shadow: ShadowRoot;

  static get observedAttributes(): string[] {
    return ['downloads', 'upvotes', 'votes', 'last-updated', 'agent-id'];
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

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  private render(): void {
    const downloads = parseInt(this.getAttribute('downloads') || '0');
    const upvotes = parseInt(this.getAttribute('upvotes') || '0');
    const votes = parseInt(this.getAttribute('votes') || '0');
    const lastUpdated = this.getAttribute('last-updated');
    const agentId = this.getAttribute('agent-id');

    const stats: string[] = [];

    // Only show downloads if > 100
    if (downloads > 100 && !isNaN(downloads)) {
      stats.push(`<div class="stat">⬇️ ${this.formatNumber(downloads)}</div>`);
    }

    // Only show upvotes if votes > 100
    if (votes > 100 && !isNaN(votes) && !isNaN(upvotes)) {
      stats.push(`<div class="stat">👍 ${upvotes}% (${votes})</div>`);
    }

    // Show last updated if provided
    if (lastUpdated) {
      stats.push(`<div class="stat">Updated ${lastUpdated}</div>`);
    }

    // Show view source button if agent-id provided
    const viewSourceButton = agentId 
      ? `<button class="view-source-btn">View Source</button>`
      : '';

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .agent-stats {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .stat {
          font-size: 12px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .view-source-btn {
          margin-left: auto;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #666;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        }

        .view-source-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #999;
          border-color: rgba(255, 255, 255, 0.2);
        }
      </style>
      <div class="agent-stats">
        ${stats.join('')}
        ${viewSourceButton}
      </div>
    `;

    // Add event listener for view source button
    if (agentId) {
      const button = this.shadow.querySelector('.view-source-btn');
      button?.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('view-source', {
          detail: { agentId },
          bubbles: true,
          composed: true
        }));
      });
    }
  }
}

// Register the custom element
customElements.define('agent-stats', AgentStats);