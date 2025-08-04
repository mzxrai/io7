import { selectionStore } from '../../store/selection';
import { CommandBox } from './CommandBox';
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
    // Re-render to show/hide checkbox based on selection
    this.render();
    this.setupEventListeners();
    // Force re-render of command with current isLocal state
    this.updateCommandBox();
  };

  private updateCommandBox(): void {
    const commandBox = this.querySelector<CommandBox>('command-box');
    if (commandBox) {
      // Update the CommandBox by setting the isLocal property
      commandBox.isLocal = this.isLocal;

      // Trigger re-render
      commandBox.render();
    }
  }

  private render(): void {
    // Apply host styles
    this.className = styles.host;

    const hasSelection = selectionStore.getSelectedIds().length > 0;

    this.innerHTML = `
      <div class="${styles.container}">
        <div class="${styles.header}">
          <h2 class="${styles.heading}">Your Agent Pack</h2>
        </div>
        
        <div class="${styles.content}">
          <div class="${styles.section}">
            <div class="${styles.label}">Install Command</div>
            <command-box></command-box>
          </div>
          
          ${hasSelection ? `
            <div class="${styles.toggleContainer}">
              <input 
                type="checkbox" 
                class="${styles.toggle}" 
                id="local-toggle"
                ${this.isLocal ? 'checked' : ''}
              />
              <label for="local-toggle" class="${styles.toggleLabel}">
                Install for single project
              </label>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('pack-builder', PackBuilder);