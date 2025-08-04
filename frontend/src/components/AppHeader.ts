import { replaceIcons } from '@utils/icons';
import styles from './AppHeader.module.css';

export class AppHeader extends HTMLElement {
  connectedCallback(): void {
    this.render();
  }

  private render(): void {
    // Apply host styles
    this.className = styles.host;

    this.innerHTML = `
      <div class="${styles.header}">
        <div class="${styles.logoSection}">
          <span class="${styles.logo}">io7</span>
          <span class="${styles.subtitle}">Agent Registry for Claude Code</span>
        </div>
        <nav class="${styles.navLinks}">
          <a href="#" class="${styles.navLink}">
            <span class="${styles.navIcon}" data-icon="file-text"></span>
            <span>Submit</span>
          </a>
          <a href="#" class="${styles.navLink}">
            <span class="${styles.navIcon}" data-icon="message-circle"></span>
            <span>Discord</span>
          </a>
          <a href="#" class="${styles.navLink}">
            <span class="${styles.navIcon}" data-icon="book-open"></span>
            <span>Docs</span>
          </a>
          <a href="#" class="${styles.navLink}">
            <span class="${styles.navIcon}" data-icon="github"></span>
            <span>GitHub</span>
          </a>
        </nav>
      </div>
    `;

    // Replace icon placeholders with responsive sizing
    replaceIcons(this);
  }
}

// Register the custom element
customElements.define('app-header', AppHeader);