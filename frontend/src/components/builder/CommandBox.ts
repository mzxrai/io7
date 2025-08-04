import { selectionStore } from '../../store/selection';
import { agents } from '../../data/agents';
import '../shared/CopyButton';

export class CommandBox extends HTMLElement {
  private shadow: ShadowRoot;
  private storeListener: ((event: Event) => void) | null = null;
  public agents = agents; // Allow override for testing
  public isLocal: boolean = false; // Support local installation flag

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback(): void {
    this.cleanupEventListeners();
  }

  private setupEventListeners(): void {
    this.cleanupEventListeners();
    
    this.storeListener = () => this.render();
    selectionStore.addEventListener('change', this.storeListener);
  }

  private cleanupEventListeners(): void {
    if (this.storeListener) {
      selectionStore.removeEventListener('change', this.storeListener);
      this.storeListener = null;
    }
  }

  public render(): void {
    const selectedCount = selectionStore.getSelectedIds().length;
    const command = selectionStore.generateCommand(this.agents, this.isLocal);

    let content = '';
    
    if (selectedCount === 0) {
      content = `
        <div class="empty-state">
          Select agents to generate command
        </div>
      `;
    } else {
      const label = selectedCount === 1 
        ? 'Install command'
        : `Create pack with ${selectedCount} agents`;

      content = `
        <div class="command-container">
          <div class="command-label">${label}</div>
          <div class="command-display">
            <code class="command-text">${command}</code>
            <copy-button value="${command}" ${selectedCount === 0 ? 'disabled="true"' : ''}></copy-button>
          </div>
        </div>
      `;
    }

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .command-container {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
        }

        .command-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .command-display {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          padding: 12px;
        }

        .command-text {
          flex: 1;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 14px;
          color: #fff;
          white-space: nowrap;
          overflow-x: auto;
        }

        .empty-state {
          padding: 24px;
          text-align: center;
          color: #666;
          font-size: 14px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }
      </style>
      ${content}
    `;
  }
}

// Register the custom element
customElements.define('command-box', CommandBox);