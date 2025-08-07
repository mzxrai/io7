import './AppHeader';
import './AgentList';
import './builder/PackBuilder';
import './modal/SourceModal';
import styles from './App.module.css';
import type { SourceModal } from './modal/SourceModal';

export class App extends HTMLElement {
  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback(): void {
    this.removeEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for view-source events from agent cards
    this.addEventListener('view-source', this.handleViewSource);
  }

  private removeEventListeners(): void {
    this.removeEventListener('view-source', this.handleViewSource);
  }

  private handleViewSource = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const { agentId } = customEvent.detail;

    const modal = this.querySelector('source-modal') as SourceModal;
    if (modal) {
      modal.open(agentId);
    }
  };

  private render(): void {
    // Apply host styles
    this.className = styles.host;

    this.innerHTML = `
      <app-header></app-header>
      
      <div class="${styles.container}">
        <div class="${styles.leftPanel}">
          <agent-list></agent-list>
        </div>
        
        <div class="${styles.rightPanel}">
          <pack-builder></pack-builder>
        </div>
      </div>
      
      <source-modal></source-modal>
    `;
  }
}

// Register the custom element
customElements.define('app-root', App);