import styles from './AgentStats.module.css';

export class AgentStats extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['downloads', 'upvotes', 'votes', 'last-updated', 'agent-id'];
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
      stats.push(`<div class="${styles.stat}">⬇️ ${this.formatNumber(downloads)}</div>`);
    }

    // Only show upvotes if votes > 100
    if (votes > 100 && !isNaN(votes) && !isNaN(upvotes)) {
      stats.push(`<div class="${styles.stat}">👍 ${upvotes}% (${votes})</div>`);
    }

    // Show last updated if provided
    if (lastUpdated) {
      stats.push(`<div class="${styles.stat}">Updated ${lastUpdated}</div>`);
    }

    // Show view source button if agent-id provided
    const viewSourceButton = agentId
      ? `<button class="${styles.viewSourceBtn}">View Source</button>`
      : '';

    // Apply host styles
    this.className = styles.host;

    this.innerHTML = `
      <div class="${styles.stats}">
        ${stats.join('')}
        ${viewSourceButton}
      </div>
    `;

    // Add event listener for view source button
    if (agentId) {
      const button = this.querySelector(`.${styles.viewSourceBtn}`);
      button?.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('view-source', {
          detail: { agentId },
          bubbles: true,
          composed: true,
        }));
      });
    }
  }
}

// Register the custom element
customElements.define('agent-stats', AgentStats);