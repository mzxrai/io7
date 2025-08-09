import styles from './AppFooter.module.css';

export class AppFooter extends HTMLElement {
  connectedCallback(): void {
    this.render();
  }

  private render(): void {
    this.className = styles.host;

    this.innerHTML = `
      <footer class="${styles.footer}">
        <div class="${styles.content}">
          <a href="/terms" class="${styles.link}">Terms of Service</a>
          <span class="${styles.separator}">·</span>
          <span class="${styles.copyright}">© 2025 io7</span>
        </div>
      </footer>
    `;
  }
}

customElements.define('app-footer', AppFooter);