import { createIcon, type IconName } from '@utils/icons';
import { apiService } from '../../services/api';
import styles from './VoteButtons.module.css';

type VoteState = 'upvoted' | 'downvoted' | null;

export class VoteButtons extends HTMLElement {
  private agentId: string | null = null;
  private currentUpvotes = 0;
  private currentDownvotes = 0;
  private voteState: VoteState = null;
  private isLoading = false;
  
  // Cache DOM references
  private upButton: HTMLButtonElement | null = null;
  private downButton: HTMLButtonElement | null = null;
  private isInitialized = false;

  static get observedAttributes(): string[] {
    return ['agent-id', 'upvotes', 'downvotes'];
  }

  connectedCallback(): void {
    this.loadVoteState();
    if (!this.isInitialized) {
      this.initialRender();
      this.isInitialized = true;
    } else {
      this.updateButtonStates();
    }
  }

  disconnectedCallback(): void {
    this.cleanupEventListeners();
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void {
    this.agentId = this.getAttribute('agent-id');
    this.currentUpvotes = parseInt(this.getAttribute('upvotes') || '0');
    this.currentDownvotes = parseInt(this.getAttribute('downvotes') || '0');
    this.loadVoteState();
    if (this.isInitialized) {
      this.updateButtonStates();
    }
  }

  private loadVoteState(): void {
    if (!this.agentId) return;

    const stored = localStorage.getItem(`vote_${this.agentId}`);
    if (stored === '1') {
      this.voteState = 'upvoted';
    } else if (stored === '0') {
      this.voteState = 'downvoted';
    } else {
      this.voteState = null;
    }
  }

  private saveVoteState(state: VoteState): void {
    if (!this.agentId) return;

    if (state === null) {
      localStorage.removeItem(`vote_${this.agentId}`);
    } else {
      const value = state === 'upvoted' ? '1' : '0';
      localStorage.setItem(`vote_${this.agentId}`, value);
    }
  }

  private cleanupEventListeners(): void {
    this.upButton?.removeEventListener('click', this.handleUpvote);
    this.downButton?.removeEventListener('click', this.handleDownvote);
  }

  private handleUpvote = async (e: Event): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    if (this.isLoading || !this.agentId) return;

    const previousState = this.voteState;
    const newState: VoteState = this.voteState === 'upvoted' ? null : 'upvoted';

    // Optimistic update
    this.updateCounts(previousState, newState);
    this.voteState = newState;
    this.updateButtonStates();

    // Send to API
    await this.sendVote(newState);
  };

  private handleDownvote = async (e: Event): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    if (this.isLoading || !this.agentId) return;

    const previousState = this.voteState;
    const newState: VoteState = this.voteState === 'downvoted' ? null : 'downvoted';

    // Optimistic update
    this.updateCounts(previousState, newState);
    this.voteState = newState;
    this.updateButtonStates();

    // Send to API
    await this.sendVote(newState);
  };

  private updateButtonStates(): void {
    if (!this.upButton || !this.downButton) return;
    
    // Update upvote button classes
    this.upButton.classList.toggle(styles.upvoted, this.voteState === 'upvoted');
    
    // Update downvote button classes
    this.downButton.classList.toggle(styles.downvoted, this.voteState === 'downvoted');
    
    // Update disabled state
    this.upButton.disabled = this.isLoading;
    this.downButton.disabled = this.isLoading;
  }

  private updateCounts(previousState: VoteState, newState: VoteState): void {
    // Remove previous vote
    if (previousState === 'upvoted') {
      this.currentUpvotes--;
    } else if (previousState === 'downvoted') {
      this.currentDownvotes--;
    }

    // Add new vote
    if (newState === 'upvoted') {
      this.currentUpvotes++;
    } else if (newState === 'downvoted') {
      this.currentDownvotes++;
    }
  }

  private async sendVote(state: VoteState): Promise<void> {
    if (!this.agentId) return;

    this.isLoading = true;

    try {
      if (state === null) {
        // For now, we can't remove votes via API, so just save locally
        this.saveVoteState(state);
      } else {
        const vote = state === 'upvoted' ? 1 : 0;
        await apiService.voteForAgent(this.agentId, vote);
        this.saveVoteState(state);
      }

      // Dispatch event for parent components
      this.dispatchEvent(new CustomEvent('vote-changed', {
        detail: {
          agentId: this.agentId,
          voteState: state,
          upvotes: this.currentUpvotes,
          downvotes: this.currentDownvotes,
        },
        bubbles: true,
        composed: true,
      }));
    } catch {
      // Silent error handling - no console logging needed
      // Revert optimistic update on error
      this.updateCounts(state, this.voteState);
      this.voteState = this.voteState === state ? null : this.voteState;
      this.updateButtonStates();
    } finally {
      this.isLoading = false;
    }
  }

  private initialRender(): void {
    // Apply host styles
    this.className = styles.host;

    this.innerHTML = `
      <div class="${styles.buttonGroup}">
        <button 
          class="${styles.voteButton}"
          aria-label="Upvote"
          title="Upvote"
          data-vote="up"
        >
          <span class="${styles.icon}" data-icon="thumbs-up"></span>
        </button>
        
        <button 
          class="${styles.voteButton}"
          aria-label="Downvote"
          title="Downvote"
          data-vote="down"
        >
          <span class="${styles.icon}" data-icon="thumbs-down"></span>
        </button>
      </div>
    `;

    // Cache button references
    this.upButton = this.querySelector('[data-vote="up"]');
    this.downButton = this.querySelector('[data-vote="down"]');

    // Replace icon placeholders
    const icons = this.querySelectorAll('[data-icon]');
    icons.forEach(iconEl => {
      const iconName = iconEl.getAttribute('data-icon');
      if (iconName) {
        const svg = createIcon(iconName as IconName, 14);
        svg.classList.add(styles.icon);
        iconEl.replaceWith(svg);
      }
    });
    
    // Attach event listeners once
    this.upButton?.addEventListener('click', this.handleUpvote);
    this.downButton?.addEventListener('click', this.handleDownvote);
    
    // Set initial state
    this.updateButtonStates();
  }
}

// Register the custom element
customElements.define('vote-buttons', VoteButtons);