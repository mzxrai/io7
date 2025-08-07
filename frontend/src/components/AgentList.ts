import { apiService } from '../services/api';
import { agentStore } from '../store/agents';
import { selectionStore } from '../store/selection';
import type { Agent } from '../types/Agent';
import './cards/AgentCard';
import styles from './AgentList.module.css';

export class AgentList extends HTMLElement {
  private isLoading = true;
  private error: string | null = null;

  async connectedCallback(): Promise<void> {
    await this.loadAgents();
    this.render();

    // Listen to selection changes to update button text
    selectionStore.addEventListener('change', () => {
      this.updateSelectAllButton();
    });
  }

  private updateSelectAllButton(): void {
    const selectAllBtn = this.querySelector('#select-all-btn') as HTMLButtonElement;
    if (selectAllBtn) {
      const agents = agentStore.getAgents();
      const allSelected = agents.length > 0 && agents.every(agent => selectionStore.isSelected(agent.id));
      selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
    }
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

    let content = '';

    if (this.isLoading) {
      content = `
        <div class="${styles.loadingState}">
          Loading agents...
        </div>
      `;
    } else if (this.error) {
      content = `
        <div class="${styles.errorState}">
          <p>Failed to load agents: ${this.error}</p>
          <button class="${styles.retryButton}" onclick="this.parentElement.parentElement.parentElement.retry()">
            Retry
          </button>
        </div>
      `;
    } else {
      const agents = agentStore.getAgents();
      if (agents.length === 0) {
        content = `
          <div class="${styles.emptyState}">
            No agents available
          </div>
        `;
      } else {
        const agentCards = agents.map(agent => `
          <agent-card
            agent-id="${agent.id}"
            name="${agent.display_name || agent.name}"
            category="${agent.metadata?.category || ''}"
            description="${agent.display_description || agent.description}"
            downloads="${agent.stats.downloads || 0}"
            upvotes="${agent.stats.upvotes || 0}"
            downvotes="${agent.stats.downvotes || 0}"
            tags="${agent.metadata?.tags?.join(',') || ''}"
            ${agent.isPopular ? 'is-popular="true"' : ''}
          ></agent-card>
        `).join('');

        content = `
          <div class="${styles.agentListContainer}">
            ${agentCards}
          </div>
        `;
      }
    }

    // Only show Select All button when agents are loaded successfully
    const agents = agentStore.getAgents();
    const showSelectAll = !this.isLoading && !this.error && agents.length > 0;
    const allSelected = showSelectAll && agents.every(agent => selectionStore.isSelected(agent.id));

    this.innerHTML = `
      <div class="${styles.listWrapper}">
        <div class="${styles.listHeader}">
          <h2 class="${styles.listTitle}">Available Subagents</h2>
          ${showSelectAll ? `
            <button class="${styles.selectAllButton}" id="select-all-btn">
              ${allSelected ? 'Deselect All' : 'Select All'}
            </button>
          ` : ''}
        </div>
        ${content}
      </div>
    `;

    // Add event listener for Select All button
    if (showSelectAll) {
      const selectAllBtn = this.querySelector('#select-all-btn');
      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', this.handleSelectAll);
      }
    }
  }

  private handleSelectAll = (): void => {
    const agents = agentStore.getAgents();
    const allSelected = agents.every(agent => selectionStore.isSelected(agent.id));

    if (allSelected) {
      // Deselect all
      agents.forEach(agent => {
        selectionStore.deselect(agent.id);
      });
    } else {
      // Select all
      agents.forEach(agent => {
        selectionStore.select(agent.id);
      });
    }
  };

  public async retry(): Promise<void> {
    await this.loadAgents();
    this.render();
  }
}

// Register the custom element
customElements.define('agent-list', AgentList);