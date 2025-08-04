import type { Agent } from '../types/Agent';

export interface SelectionChangeEvent extends CustomEvent {
  detail: {
    selectedIds: string[];
    count: number;
  };
}

export class SelectionStore extends EventTarget {
  private selectedIds: Set<string>;

  constructor() {
    super();
    this.selectedIds = new Set();
  }

  // Selection methods
  select(agentId: string): void {
    if (!this.selectedIds.has(agentId)) {
      this.selectedIds.add(agentId);
      this.emitChange();
    }
  }

  deselect(agentId: string): void {
    if (this.selectedIds.delete(agentId)) {
      this.emitChange();
    }
  }

  toggle(agentId: string): void {
    if (this.selectedIds.has(agentId)) {
      this.deselect(agentId);
    } else {
      this.select(agentId);
    }
  }

  clear(): void {
    if (this.selectedIds.size > 0) {
      this.selectedIds.clear();
      this.emitChange();
    }
  }

  // Query methods
  isSelected(agentId: string): boolean {
    return this.selectedIds.has(agentId);
  }

  getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  hasSelections(): boolean {
    return this.selectedIds.size > 0;
  }

  getCount(): number {
    return this.selectedIds.size;
  }

  // Command generation
  generateCommand(agents: Agent[], isLocal: boolean = false): string {
    const selectedIds = this.getSelectedIds();
    
    if (selectedIds.length === 0) {
      return '';
    }

    // Get packages for selected agents
    const packages: string[] = [];
    for (const id of selectedIds) {
      const agent = agents.find(a => a.id === id);
      if (agent) {
        packages.push(agent.package);
      }
    }

    if (packages.length === 0) {
      return '';
    }

    // Build command with comma-separated agents
    const agentList = packages.join(',');
    const localFlag = isLocal ? ' --local' : '';
    
    return `npx io7@latest --install ${agentList}${localFlag}`;
  }

  // Event handling
  private emitChange(): void {
    const event = new CustomEvent('change', {
      detail: {
        selectedIds: this.getSelectedIds(),
        count: this.getCount(),
      },
    }) as SelectionChangeEvent;
    
    this.dispatchEvent(event);
  }
}

// Singleton instance for the app
export const selectionStore = new SelectionStore();