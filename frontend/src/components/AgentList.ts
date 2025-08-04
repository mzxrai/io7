import { agents } from '../data/agents';
import './cards/AgentCard';
import styles from './AgentList.module.css';

export class AgentList extends HTMLElement {
  public agents = agents; // Allow override for testing

  connectedCallback(): void {
    this.render();
  }

  public render(): void {
    // Apply host styles
    this.className = styles.host;

    if (this.agents.length === 0) {
      this.renderEmptyState();
      return;
    }

    const agentCards = this.agents.map(agent => `
      <agent-card
        agent-id="${agent.id}"
        name="${agent.name}"
        description="${agent.description}"
        downloads="${agent.downloads || 0}"
        votes="${agent.votes || 0}"
        ${agent.isPopular ? 'is-popular="true"' : ''}
      ></agent-card>
    `).join('');

    this.innerHTML = `
      <div class="${styles.listWrapper}">
        <div class="${styles.listHeader}">
          <h2 class="${styles.listTitle}">Available Agents</h2>
        </div>
        <div class="${styles.agentListContainer}">
          ${agentCards}
        </div>
      </div>
    `;
  }

  private renderEmptyState(): void {
    this.innerHTML = `
      <div class="${styles.listWrapper}">
        <div class="${styles.listHeader}">
          <h2 class="${styles.listTitle}">Available Agents</h2>
        </div>
        <div class="${styles.emptyState}">
          No agents available
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('agent-list', AgentList);