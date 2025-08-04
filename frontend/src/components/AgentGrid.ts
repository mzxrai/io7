import { agents } from '../data/agents';
import './cards/AgentCard';

export class AgentGrid extends HTMLElement {
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  private render(): void {
    const agentCards = agents.map(agent => `
      <agent-card
        agent-id="${agent.id}"
        name="${agent.name}"
        description="${agent.description}"
        icon="${agent.icon}"
        downloads="${agent.downloads || 0}"
        votes="${agent.votes || 0}"
        ${agent.isPopular ? 'is-popular="true"' : ''}
      ></agent-card>
    `).join('');

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px;
        }

        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .grid-container {
            grid-template-columns: 1fr;
          }
        }

        @media (min-width: 1200px) {
          .grid-container {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      </style>
      
      <div class="grid-container">
        ${agentCards}
      </div>
    `;
  }
}

// Register the custom element
customElements.define('agent-grid', AgentGrid);