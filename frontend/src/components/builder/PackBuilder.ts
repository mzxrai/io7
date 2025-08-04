import { selectionStore } from '../../store/selection';
import './CommandBox';
import './SelectedAgents';

export class PackBuilder extends HTMLElement {
  private shadow: ShadowRoot;
  private isLocal: boolean = false;

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
    // Handle local toggle change
    this.shadow.addEventListener('change', this.handleToggleChange);
    
    // Update command when selection changes
    selectionStore.addEventListener('change', this.handleSelectionChange);
  }

  private cleanupEventListeners(): void {
    this.shadow.removeEventListener('change', this.handleToggleChange);
    selectionStore.removeEventListener('change', this.handleSelectionChange);
  }

  private handleToggleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.classList.contains('local-toggle')) {
      this.isLocal = target.checked;
      this.updateCommandBox();
    }
  };

  private handleSelectionChange = (): void => {
    // Force re-render of command with current isLocal state
    this.updateCommandBox();
  };

  private updateCommandBox(): void {
    const commandBox = this.shadow.querySelector('command-box') as any;
    if (commandBox) {
      // Update the CommandBox by setting the isLocal property
      commandBox.isLocal = this.isLocal;
      
      // Trigger re-render
      if (commandBox.render) {
        commandBox.render();
      }
    }
  }

  private render(): void {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          position: sticky;
          top: 20px;
          z-index: 10;
        }

        .pack-builder-container {
          background: linear-gradient(135deg, rgba(10, 10, 10, 0.95), rgba(20, 20, 20, 0.95));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.5),
            0 0 80px rgba(147, 51, 234, 0.1);
        }

        .builder-heading {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .builder-heading::before {
          content: '🚀';
          font-size: 20px;
        }

        .section {
          margin-bottom: 20px;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .local-toggle-container {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .local-toggle {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .local-toggle-label {
          font-size: 13px;
          color: #aaa;
          cursor: pointer;
          user-select: none;
        }

        .local-toggle:checked + .local-toggle-label {
          color: #fff;
        }

        .toggle-hint {
          font-size: 11px;
          color: #666;
          margin-left: auto;
        }

        .command-section {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 16px;
        }

        .selected-section {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 16px;
        }
      </style>
      
      <div class="pack-builder-container">
        <h2 class="builder-heading">Agent Pack Builder</h2>
        
        <div class="local-toggle-container">
          <input 
            type="checkbox" 
            class="local-toggle" 
            id="local-toggle"
            ${this.isLocal ? 'checked' : ''}
          />
          <label for="local-toggle" class="local-toggle-label">
            Install to project (./.claude/agents/)
          </label>
          <span class="toggle-hint">
            ${this.isLocal ? 'Project-level' : 'Global (~/.claude/agents/)'}
          </span>
        </div>
        
        <div class="section command-section">
          <div class="section-label">Installation Command</div>
          <command-box></command-box>
        </div>
        
        <div class="section selected-section">
          <div class="section-label">Selected Agents</div>
          <selected-agents></selected-agents>
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('pack-builder', PackBuilder);