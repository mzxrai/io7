import { fixture, cleanup } from '@test-utils/render';
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import './VoteButtons';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    voteForAgent: vi.fn().mockResolvedValue({ success: true, message: 'Vote recorded successfully' }),
  },
}));

describe('VoteButtons', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset API mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should accept voting when rendered with agent-id', async () => {
      const { apiService } = await import('../../services/api');
      const el = await fixture<HTMLElement>(`
        <vote-buttons 
          agent-id="test-agent" 
          upvotes="10" 
          downvotes="5">
        </vote-buttons>
      `);

      // User can vote when agent-id is present
      const upvoteBtn = el.querySelector('button[aria-label="Upvote"]') as HTMLButtonElement;
      upvoteBtn.click();
      
      await vi.waitFor(() => {
        expect(apiService.voteForAgent).toHaveBeenCalled();
      });
    });

    it('should work with zero initial votes', async () => {
      const { apiService } = await import('../../services/api');
      const el = await fixture<HTMLElement>(`
        <vote-buttons 
          agent-id="test-agent" 
          upvotes="0" 
          downvotes="0">
        </vote-buttons>
      `);

      // User can still vote even when starting from zero
      const upvoteBtn = el.querySelector('button[aria-label="Upvote"]') as HTMLButtonElement;
      upvoteBtn.click();
      
      await vi.waitFor(() => {
        expect(apiService.voteForAgent).toHaveBeenCalledWith('test-agent', 1);
      });
    });
  });

  describe('voting behavior', () => {
    it('should submit upvote to API when user votes up', async () => {
      const { apiService } = await import('../../services/api');
      const el = await fixture<HTMLElement>(`
        <vote-buttons 
          agent-id="test-agent" 
          upvotes="10" 
          downvotes="5">
        </vote-buttons>
      `);

      // User clicks the upvote button (first button)
      const upvoteBtn = el.querySelector('button[aria-label="Upvote"]') as HTMLButtonElement;
      upvoteBtn.click();

      await vi.waitFor(() => {
        expect(apiService.voteForAgent).toHaveBeenCalledWith('test-agent', 1);
      });
      expect(localStorage.getItem('vote_test-agent')).toBe('1');
    });

    it('should submit downvote to API when user votes down', async () => {
      const { apiService } = await import('../../services/api');
      const el = await fixture<HTMLElement>(`
        <vote-buttons 
          agent-id="test-agent" 
          upvotes="10" 
          downvotes="5">
        </vote-buttons>
      `);

      // User clicks the downvote button
      const downvoteBtn = el.querySelector('button[aria-label="Downvote"]') as HTMLButtonElement;
      downvoteBtn.click();

      await vi.waitFor(() => {
        expect(apiService.voteForAgent).toHaveBeenCalledWith('test-agent', 0);
      });
      expect(localStorage.getItem('vote_test-agent')).toBe('0');
    });

    it('should switch from upvote to downvote', async () => {
      const { apiService } = await import('../../services/api');
      const el = await fixture<HTMLElement>(`
        <vote-buttons 
          agent-id="test-agent" 
          upvotes="10" 
          downvotes="5">
        </vote-buttons>
      `);

      const upvoteBtn = el.querySelector('button[aria-label="Upvote"]') as HTMLButtonElement;
      const downvoteBtn = el.querySelector('button[aria-label="Downvote"]') as HTMLButtonElement;
      
      // Upvote first
      upvoteBtn.click();
      await vi.waitFor(() => {
        expect(apiService.voteForAgent).toHaveBeenCalledWith('test-agent', 1);
      });

      // Clear mock to check next call
      vi.clearAllMocks();

      // Then downvote
      downvoteBtn.click();
      await vi.waitFor(() => {
        expect(apiService.voteForAgent).toHaveBeenCalledWith('test-agent', 0);
      });
    });

    it('should toggle vote off when clicking the same button twice', async () => {
      const el = await fixture<HTMLElement>(`
        <vote-buttons 
          agent-id="test-agent" 
          upvotes="10" 
          downvotes="5">
        </vote-buttons>
      `);

      const upvoteBtn = el.querySelector('button[aria-label="Upvote"]') as HTMLButtonElement;
      
      // First click - upvote
      upvoteBtn.click();
      await vi.waitFor(() => {
        expect(localStorage.getItem('vote_test-agent')).toBe('1');
      });

      // Second click - remove upvote
      upvoteBtn.click();
      await vi.waitFor(() => {
        expect(localStorage.getItem('vote_test-agent')).toBe(null);
      });
    });
  });

  describe('persistence', () => {
    it('should restore previous upvote from localStorage', async () => {
      // Set a previous upvote
      localStorage.setItem('vote_test-agent', '1');

      const el = await fixture<HTMLElement>(`
        <vote-buttons 
          agent-id="test-agent" 
          upvotes="10" 
          downvotes="5">
        </vote-buttons>
      `);

      const upvoteBtn = el.querySelector('button[aria-label="Upvote"]') as HTMLButtonElement;
      
      // Clicking it again should toggle it off
      upvoteBtn.click();
      await vi.waitFor(() => {
        expect(localStorage.getItem('vote_test-agent')).toBe(null);
      });
    });

    it('should restore previous downvote from localStorage', async () => {
      // Set a previous downvote
      localStorage.setItem('vote_test-agent', '0');

      const el = await fixture<HTMLElement>(`
        <vote-buttons 
          agent-id="test-agent" 
          upvotes="10" 
          downvotes="5">
        </vote-buttons>
      `);

      const downvoteBtn = el.querySelector('button[aria-label="Downvote"]') as HTMLButtonElement;
      
      // Clicking it again should toggle it off
      downvoteBtn.click();
      await vi.waitFor(() => {
        expect(localStorage.getItem('vote_test-agent')).toBe(null);
      });
    });
  });

  describe('events', () => {
    it('should emit vote-changed event with correct details', async () => {
      const el = await fixture<HTMLElement>(`
        <vote-buttons 
          agent-id="test-agent" 
          upvotes="10" 
          downvotes="5">
        </vote-buttons>
      `);

      const listener = vi.fn();
      el.addEventListener('vote-changed', listener);

      const upvoteBtn = el.querySelector('button[aria-label="Upvote"]') as HTMLButtonElement;
      upvoteBtn.click();

      await vi.waitFor(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: {
              agentId: 'test-agent',
              voteState: 'upvoted',
              upvotes: 11,
              downvotes: 5,
            },
          }),
        );
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.voteForAgent).mockRejectedValueOnce(new Error('Network error'));

      const el = await fixture<HTMLElement>(`
        <vote-buttons 
          agent-id="test-agent" 
          upvotes="10" 
          downvotes="5">
        </vote-buttons>
      `);

      const upvoteBtn = el.querySelector('button[aria-label="Upvote"]') as HTMLButtonElement;
      upvoteBtn.click();

      // Should still try to call API
      await vi.waitFor(() => {
        expect(apiService.voteForAgent).toHaveBeenCalled();
      });
    });
  });

  describe('edge cases', () => {
    it('should not submit votes when agent-id is missing', async () => {
      const el = await fixture<HTMLElement>(`
        <vote-buttons upvotes="10" downvotes="5"></vote-buttons>
      `);

      // Try to vote without agent-id
      el.click();

      // API should not be called without agent-id 
      const { apiService } = await import('../../services/api');
      expect(apiService.voteForAgent).not.toHaveBeenCalled();
    });

    it('should handle invalid vote counts gracefully', async () => {
      const el = await fixture<HTMLElement>(`
        <vote-buttons 
          agent-id="test-agent" 
          upvotes="not-a-number" 
          downvotes="invalid">
        </vote-buttons>
      `);

      // Component should still render despite invalid counts
      expect(el).toBeTruthy();
    });
  });
});