import { apiService } from '../services/api';
import { agentStore } from '../store/agents';
import type { Agent } from '../types/Agent';
import './cards/AgentCard';
import styles from './AgentList.module.css';

export class AgentList extends HTMLElement {
  private isLoading = true;
  private error: string | null = null;

  async connectedCallback(): Promise<void> {
    await this.loadAgents();
    this.render();
  }

  private async loadAgents(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;
      const agents = await apiService.fetchAgents();
      // Update the global agent store
      agentStore.setAgents(agents);
    } catch (error) {
      console.error('Failed to load agents:', error);
      this.error = error instanceof Error ? error.message : 'Failed to load agents';
      agentStore.setAgents([]);
    } finally {
      this.isLoading = false;
    }
  }

  // Allow override for testing
  public setAgents(agents: Agent[]): void {
    this.isLoading = false;
    this.error = null;
    agentStore.setAgents(agents);
    this.render();
  }

  public render(): void {
    // Apply host styles
    this.className = styles.host;

    if (this.isLoading) {
      this.renderLoadingState();
      return;
    }

    if (this.error) {
      this.renderErrorState();
      return;
    }

    const agents = agentStore.getAgents();
    if (agents.length === 0) {
      this.renderEmptyState();
      return;
    }

    const agentCards = agents.map(agent => `
      <agent-card
        agent-id="${agent.id}"
        name="${agent.name}"
        description="${agent.description}"
        downloads="${agent.stats.downloads || 0}"
        votes="${agent.stats.votes || 0}"
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

  private renderLoadingState(): void {
    this.innerHTML = `
      <div class="${styles.listWrapper}">
        <div class="${styles.listHeader}">
          <h2 class="${styles.listTitle}">Available Agents</h2>
        </div>
        <div class="${styles.loadingState}">
          Loading agents...
        </div>
      </div>
    `;
  }

  private renderErrorState(): void {
    this.innerHTML = `
      <div class="${styles.listWrapper}">
        <div class="${styles.listHeader}">
          <h2 class="${styles.listTitle}">Available Agents</h2>
        </div>
        <div class="${styles.errorState}">
          <p>Failed to load agents: ${this.error}</p>
          <button class="${styles.retryButton}" onclick="this.parentElement.parentElement.parentElement.retry()">
            Retry
          </button>
        </div>
      </div>
    `;
  }

  public async retry(): Promise<void> {
    await this.loadAgents();
    this.render();
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