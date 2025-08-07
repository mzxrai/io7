import { createIcon } from '@utils/icons';
import './VoteButtons';
import styles from './AgentStats.module.css';

export class AgentStats extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['downloads', 'upvotes', 'downvotes', 'last-updated', 'agent-id', 'agent-name'];
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
    const downvotes = parseInt(this.getAttribute('downvotes') || '0');
    const lastUpdated = this.getAttribute('last-updated');
    const agentId = this.getAttribute('agent-id');
    const agentName = this.getAttribute('agent-name') || '';

    // Apply host styles
    this.className = styles.host;

    // Clear content
    this.innerHTML = '';

    // Create container
    const container = document.createElement('div');
    container.className = styles.stats;

    // Add vote buttons first (left side)
    if (agentId) {
      const voteButtons = document.createElement('vote-buttons');
      voteButtons.setAttribute('agent-id', agentId);
      voteButtons.setAttribute('upvotes', String(upvotes));
      voteButtons.setAttribute('downvotes', String(downvotes));
      container.appendChild(voteButtons);
    }

    // Add download stat if > 25
    if (!isNaN(downloads) && downloads > 25) {
      const stat = document.createElement('div');
      stat.className = styles.stat;
      stat.appendChild(createIcon('download', 14));
      stat.appendChild(document.createTextNode(` ${this.formatNumber(downloads)}`));
      container.appendChild(stat);
    }

    // Add last updated if provided
    if (lastUpdated) {
      const stat = document.createElement('div');
      stat.className = styles.stat;
      stat.textContent = `Updated ${lastUpdated}`;
      container.appendChild(stat);
    }

    // Add report issue link
    if (agentName) {
      const reportLink = document.createElement('a');
      reportLink.className = styles.reportIssue;
      reportLink.href = 'https://github.com/mzxrai/io7/issues/new?template=agent-issue.yml';
      reportLink.target = '_blank';
      reportLink.rel = 'noopener noreferrer';
      reportLink.textContent = 'Report Issue';
      reportLink.addEventListener('click', e => {
        e.stopPropagation();
      });
      container.appendChild(reportLink);
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