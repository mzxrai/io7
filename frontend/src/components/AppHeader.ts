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
          <span class="${styles.subtitle}">
            Subagent Registry for Claude Code | Built by <a href="https://github.com/mzxrai" target="_blank" rel="noopener noreferrer" class="${styles.designerLink}">@mzxrai</a>
          </span>
        </div>
        <nav class="${styles.navLinks}">
          <a href="https://github.com/mzxrai/io7/issues/new?template=agent-submission.yml" target="_blank" rel="noopener noreferrer" class="${styles.navLink}">
            <span class="${styles.navIcon}" data-icon="file-text"></span>
            <span>Request a Subagent</span>
          </a>
          <a href="https://github.com/mzxrai/io7" target="_blank" rel="noopener noreferrer" class="${styles.navLink}">
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