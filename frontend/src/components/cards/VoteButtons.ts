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

  static get observedAttributes(): string[] {
    return ['agent-id', 'upvotes', 'downvotes'];
  }

  connectedCallback(): void {
    this.loadVoteState();
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback(): void {
    this.cleanupEventListeners();
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void {
    this.agentId = this.getAttribute('agent-id');
    this.currentUpvotes = parseInt(this.getAttribute('upvotes') || '0');
    this.currentDownvotes = parseInt(this.getAttribute('downvotes') || '0');
    this.loadVoteState();
    this.render();
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

  private setupEventListeners(): void {
    const buttons = this.querySelectorAll('button');
    if (buttons[0]) buttons[0].addEventListener('click', this.handleUpvote);
    if (buttons[1]) buttons[1].addEventListener('click', this.handleDownvote);
  }

  private cleanupEventListeners(): void {
    const buttons = this.querySelectorAll('button');
    if (buttons[0]) buttons[0].removeEventListener('click', this.handleUpvote);
    if (buttons[1]) buttons[1].removeEventListener('click', this.handleDownvote);
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
    this.render();
    this.setupEventListeners();

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
    this.render();
    this.setupEventListeners();

    // Send to API
    await this.sendVote(newState);
  };

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
      this.render();
      this.setupEventListeners();
    } finally {
      this.isLoading = false;
    }
  }

  private render(): void {
    // Apply host styles
    this.className = styles.host;

    this.innerHTML = `
      <div class="${styles.buttonGroup}">
        <button 
          class="${styles.voteButton} ${this.voteState === 'upvoted' ? styles.upvoted : ''}"
          aria-label="Upvote"
          title="Upvote"
          ${this.isLoading ? 'disabled' : ''}
        >
          <span class="${styles.icon}" data-icon="thumbs-up"></span>
        </button>
        
        <button 
          class="${styles.voteButton} ${this.voteState === 'downvoted' ? styles.downvoted : ''}"
          aria-label="Downvote"
          title="Downvote"
          ${this.isLoading ? 'disabled' : ''}
        >
          <span class="${styles.icon}" data-icon="thumbs-down"></span>
        </button>
      </div>
    `;

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
  }
}

// Register the custom element
customElements.define('vote-buttons', VoteButtons);