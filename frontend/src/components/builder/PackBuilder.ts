import { selectionStore } from '../../store/selection';
import './CommandBox';
import './SelectedAgents';
import styles from './PackBuilder.module.css';

export class PackBuilder extends HTMLElement {
  private isLocal: boolean = false;

  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback(): void {
    this.cleanupEventListeners();
  }

  private setupEventListeners(): void {
    // Handle local toggle change
    this.addEventListener('change', this.handleToggleChange);
    
    // Update command when selection changes
    selectionStore.addEventListener('change', this.handleSelectionChange);
  }

  private cleanupEventListeners(): void {
    this.removeEventListener('change', this.handleToggleChange);
    selectionStore.removeEventListener('change', this.handleSelectionChange);
  }

  private handleToggleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.classList.contains(styles.toggle)) {
      this.isLocal = target.checked;
      this.updateCommandBox();
    }
  };

  private handleSelectionChange = (): void => {
    // Force re-render of command with current isLocal state
    this.updateCommandBox();
  };

  private updateCommandBox(): void {
    const commandBox = this.querySelector('command-box') as any;
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
    // Apply host styles
    this.className = styles.host;

    this.innerHTML = `
      <div class="${styles.container}">
        <div class="${styles.header}">
          <h2 class="${styles.heading}">Your Agent Pack</h2>
        </div>
        
        <div class="${styles.content}">
          <div class="${styles.toggleContainer}">
            <input 
              type="checkbox" 
              class="${styles.toggle}" 
              id="local-toggle"
              ${this.isLocal ? 'checked' : ''}
            />
            <label for="local-toggle" class="${styles.toggleLabel}">
              Install to project
            </label>
            <span class="${styles.hint}">
              ${this.isLocal ? './.claude/agents/' : '~/.claude/agents/'}
            </span>
          </div>
          
          <div class="${styles.section}">
            <div class="${styles.label}">Installation Command</div>
            <command-box></command-box>
          </div>
          
          <div class="${styles.section}">
            <div class="${styles.label}">Selected Agents</div>
            <selected-agents></selected-agents>
          </div>
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('pack-builder', PackBuilder);