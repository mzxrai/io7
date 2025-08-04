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
      <div class="${styles.header}">
        <div style="display: flex; align-items: center;">
          <span class="${styles.logo}">io7</span>
          <span class="${styles.subtitle}">Agent Registry for Claude Code</span>
        </div>
        <nav class="${styles.navLinks}">
          <a href="#" class="${styles.navLink}">
            <span class="${styles.navIcon}">📝</span>
            <span>Submit</span>
          </a>
          <a href="#" class="${styles.navLink}">
            <span class="${styles.navIcon}">💬</span>
            <span>Discord</span>
          </a>
          <a href="#" class="${styles.navLink}">
            <span class="${styles.navIcon}">📚</span>
            <span>Docs</span>
          </a>
          <a href="#" class="${styles.navLink}">
            <span class="${styles.navIcon}">⭐</span>
            <span>GitHub</span>
          </a>
        </nav>
      </div>

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