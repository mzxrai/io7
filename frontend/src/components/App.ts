import './AppHeader';
import './AgentList';
import './builder/PackBuilder';
import styles from './App.module.css';

export class App extends HTMLElement {
  connectedCallback(): void {
    this.render();
  }

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
    `;
  }
}

// Register the custom element
customElements.define('app-root', App);