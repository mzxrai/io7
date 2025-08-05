import { selectionStore } from '../../store/selection';
import '../shared/Badge';
import './AgentStats';
import styles from './AgentCard.module.css';

export class AgentCard extends HTMLElement {
  private storeListener: (() => void) | null = null;

  static get observedAttributes(): string[] {
    return [
      'agent-id', 'name', 'category', 'description', 'package',
      'is-popular', 'downloads', 'upvotes', 'votes', 'last-updated', 'tags',
    ];
  }

  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
    this.syncWithStore();
  }

  disconnectedCallback(): void {
    this.cleanupEventListeners();
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void {
    this.render();
    this.setupEventListeners();
    this.syncWithStore();
  }

  private setupEventListeners(): void {
    // Clean up old listeners first
    this.cleanupEventListeners();

    // Checkbox change handler
    const checkbox = this.querySelector(`.${styles.checkbox}`) as HTMLInputElement;
    checkbox?.addEventListener('change', this.handleCheckboxChange);

    // Card click handler - attach to host element for full coverage
    this.addEventListener('click', this.handleCardClick);

    // Add touch support for iOS devices
    this.addEventListener('touchend', this.handleTouchEnd, { passive: false });

    // Listen to store changes
    this.storeListener = () => this.syncWithStore();
    selectionStore.addEventListener('change', this.storeListener);
  }

  private cleanupEventListeners(): void {
    const checkbox = this.querySelector(`.${styles.checkbox}`) as HTMLInputElement;
    checkbox?.removeEventListener('change', this.handleCheckboxChange);

    // Remove click handler from host element
    this.removeEventListener('click', this.handleCardClick);

    // Remove touch handler
    this.removeEventListener('touchend', this.handleTouchEnd);

    if (this.storeListener) {
      selectionStore.removeEventListener('change', this.storeListener);
      this.storeListener = null;
    }
  }

  private handleCheckboxChange = (event: Event): void => {
    event.stopPropagation();
    const checkbox = event.target as HTMLInputElement;
    const agentId = this.getAttribute('agent-id');

    if (!agentId) return;

    if (checkbox.checked) {
      selectionStore.select(agentId);
    } else {
      selectionStore.deselect(agentId);
    }

    this.updateSelectedClass();
    this.emitSelectionEvent(checkbox.checked);
  };

  private handleCardClick = (event: Event): void => {
    const target = event.target as HTMLElement;

    // Don't toggle if clicking on checkbox or view source button
    if (
      target.closest(`.${styles.checkbox}`) ||
      target.closest(`.${styles.checkboxWrapper}`) ||
      target.closest('button') ||
      target.tagName === 'BUTTON'
    ) {
      return;
    }

    const agentId = this.getAttribute('agent-id');
    if (!agentId) return;

    selectionStore.toggle(agentId);
    this.syncWithStore();
    this.emitSelectionEvent(selectionStore.isSelected(agentId));
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    // Prevent the click event from firing after touch
    event.preventDefault();

    const target = event.target as HTMLElement;

    // Don't toggle if touching checkbox or view source button
    if (
      target.closest(`.${styles.checkbox}`) ||
      target.closest(`.${styles.checkboxWrapper}`) ||
      target.closest('button') ||
      target.tagName === 'BUTTON'
    ) {
      return;
    }

    const agentId = this.getAttribute('agent-id');
    if (!agentId) return;

    selectionStore.toggle(agentId);
    this.syncWithStore();
    this.emitSelectionEvent(selectionStore.isSelected(agentId));
  };

  private syncWithStore(): void {
    const agentId = this.getAttribute('agent-id');
    if (!agentId) return;

    const checkbox = this.querySelector(`.${styles.checkbox}`) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = selectionStore.isSelected(agentId);
    }

    this.updateSelectedClass();
  }

  private updateSelectedClass(): void {
    const agentId = this.getAttribute('agent-id');
    if (!agentId) return;

    const isSelected = selectionStore.isSelected(agentId);

    if (isSelected) {
      this.classList.add('selected');
    } else {
      this.classList.remove('selected');
    }
  }

  private emitSelectionEvent(selected: boolean): void {
    const agentId = this.getAttribute('agent-id');
    if (!agentId) return;

    this.dispatchEvent(new CustomEvent('agent-selected', {
      detail: { agentId, selected },
      bubbles: true,
      composed: true,
    }));
  }

  private render(): void {
    const agentId = this.getAttribute('agent-id') || '';
    const name = this.getAttribute('name') || '';
    const category = this.getAttribute('category') || '';
    const description = this.getAttribute('description') || '';
    const packageName = this.getAttribute('package') || '';
    const isPopular = this.getAttribute('is-popular') === 'true';
    const tagsAttr = this.getAttribute('tags') || '';
    const tags = tagsAttr ? tagsAttr.split(',') : [];

    // Stats attributes
    const downloads = this.getAttribute('downloads') || '';
    const upvotes = this.getAttribute('upvotes') || '';
    const votes = this.getAttribute('votes') || '';
    const lastUpdated = this.getAttribute('last-updated') || '';

    const popularBadge = isPopular
      ? '<agent-badge text="Popular" variant="popular"></agent-badge>'
      : '';

    const tagBadges = tags.map(tag =>
      `<agent-badge text="${tag.trim()}" variant="default"></agent-badge>`,
    ).join('');

    // Apply host styles
    this.className = `${styles.host} ${this.classList.contains('selected') ? 'selected' : ''}`;

    this.innerHTML = `
      <div class="${styles.card}">
        <div class="${styles.checkboxWrapper}">
          <input type="checkbox" 
                 class="${styles.checkbox}"
                 id="checkbox-${agentId}" 
                 data-package="${packageName}">
        </div>
        <div class="${styles.header}">
          <div class="${styles.info}">
            <div class="${styles.name}">
              ${name}
              ${popularBadge}
            </div>
            <div class="${styles.category}">${category}</div>
          </div>
        </div>
        <div class="${styles.description}">${description}</div>
        ${tags.length > 0 ? `<div class="${styles.tags}">${tagBadges}</div>` : ''}
        <agent-stats
          downloads="${downloads}"
          upvotes="${upvotes}"
          votes="${votes}"
          last-updated="${lastUpdated}"
          agent-id="${agentId}">
        </agent-stats>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('agent-card', AgentCard);