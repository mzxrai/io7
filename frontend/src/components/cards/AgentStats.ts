import { createIcon } from '@utils/icons';
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

    // Apply host styles
    this.className = styles.host;

    // Clear content
    this.innerHTML = '';

    // Create container
    const container = document.createElement('div');
    container.className = styles.stats;

    // Add download stat if > 100
    if (downloads > 100 && !isNaN(downloads)) {
      const stat = document.createElement('div');
      stat.className = styles.stat;
      stat.appendChild(createIcon('download', 14));
      stat.appendChild(document.createTextNode(` ${this.formatNumber(downloads)}`));
      container.appendChild(stat);
    }

    // Add upvote stat if votes > 100
    if (votes > 100 && !isNaN(votes) && !isNaN(upvotes)) {
      const stat = document.createElement('div');
      stat.className = styles.stat;
      stat.appendChild(createIcon('trending-up', 14));
      stat.appendChild(document.createTextNode(` ${upvotes}% (${votes})`));
      container.appendChild(stat);
    }

    // Add last updated if provided
    if (lastUpdated) {
      const stat = document.createElement('div');
      stat.className = styles.stat;
      stat.textContent = `Updated ${lastUpdated}`;
      container.appendChild(stat);
    }

    // Add view source button if agent-id provided
    if (agentId) {
      const button = document.createElement('button');
      button.className = styles.viewSourceBtn;
      button.textContent = 'View Source';
      button.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('view-source', {
          detail: { agentId },
          bubbles: true,
          composed: true,
        }));
      });
      container.appendChild(button);
    }

    this.appendChild(container);
  }
}

// Register the custom element
customElements.define('agent-stats', AgentStats);