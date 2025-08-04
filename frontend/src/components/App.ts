import './AgentGrid';
import './builder/PackBuilder';

export class App extends HTMLElement {
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
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .app-container {
          display: flex;
          gap: 30px;
          max-width: 1600px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .header {
          text-align: center;
          padding: 60px 20px 40px;
          background: linear-gradient(180deg, rgba(147, 51, 234, 0.1) 0%, transparent 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .header h1 {
          font-size: 48px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #fff 0%, #9333ea 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header p {
          font-size: 18px;
          color: #888;
          margin: 16px 0 0;
        }

        .main-content {
          flex: 1;
          min-width: 0;
        }

        .sidebar {
          width: 380px;
          flex-shrink: 0;
        }

        @media (max-width: 1024px) {
          .app-container {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            position: static;
          }

          .header h1 {
            font-size: 36px;
          }
        }

        .footer {
          text-align: center;
          padding: 40px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin-top: 80px;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 20px;
        }

        .footer-link {
          color: #888;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-link:hover {
          color: #fff;
        }

        .footer-copy {
          color: #666;
          font-size: 12px;
        }
      </style>
      
      <div class="header">
        <h1>io7 Agent Marketplace</h1>
        <p>Browse and install AI agents for Claude Code</p>
      </div>

      <div class="app-container">
        <div class="main-content">
          <agent-grid></agent-grid>
        </div>
        
        <div class="sidebar">
          <pack-builder></pack-builder>
        </div>
      </div>

      <div class="footer">
        <div class="footer-links">
          <a href="https://github.com/io7/agents" class="footer-link">GitHub</a>
          <a href="https://docs.io7.dev" class="footer-link">Documentation</a>
          <a href="https://github.com/io7/agents/issues" class="footer-link">Report Issue</a>
        </div>
        <div class="footer-copy">
          © 2024 io7. Built with Web Components.
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('app-root', App);