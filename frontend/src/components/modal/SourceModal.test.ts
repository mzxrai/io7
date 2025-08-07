import { beforeEach, describe, expect, it, vi } from 'vitest';
import { agentStore } from '../../store/agents';
import { createMockAgent } from '../../test-utils/fixtures';
import './SourceModal';
import type { SourceModal } from './SourceModal';

describe('SourceModal', () => {
  let modal: SourceModal;
  let mockAgent: ReturnType<typeof createMockAgent>;

  beforeEach(() => {
    document.body.innerHTML = '';
    modal = document.createElement('source-modal') as SourceModal;
    document.body.appendChild(modal);

    // Set up mock agent in store
    mockAgent = createMockAgent({
      id: 'test-agent-1',
      name: 'test-agent',
      display_name: 'Test Agent',
      content: '---\nname: test-agent\n---\nThis is the agent content',
    });
    agentStore.setAgents([mockAgent]);
  });

  it('should be closed initially', () => {
    expect(modal.innerHTML).toBe('');
    expect(modal.className).toBe('');
  });

  it('should open modal when open() is called with valid agent id', () => {
    modal.open('test-agent-1');

    const backdrop = modal.querySelector('[role="dialog"]');
    expect(backdrop).toBeTruthy();

    const title = modal.querySelector('h2');
    expect(title?.textContent?.trim()).toBe('Test Agent');

    const codeBlock = modal.querySelector('pre code');
    expect(codeBlock?.textContent).toContain('This is the agent content');
  });

  it('should not open modal when agent id is invalid', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    modal.open('non-existent-id');

    expect(modal.innerHTML).toBe('');
    expect(consoleSpy).toHaveBeenCalledWith('Agent with id non-existent-id not found');

    consoleSpy.mockRestore();
  });

  it('should close modal when close button is clicked', () => {
    modal.open('test-agent-1');

    const closeButton = modal.querySelector('[aria-label="Close modal"]') as HTMLButtonElement;
    expect(closeButton).toBeTruthy();

    closeButton.click();

    expect(modal.innerHTML).toBe('');
  });

  it('should close modal when backdrop is clicked', () => {
    modal.open('test-agent-1');

    // Click on the modal itself (which has the backdrop handler)
    modal.click();

    expect(modal.innerHTML).toBe('');
  });

  it('should close modal when ESC key is pressed', () => {
    modal.open('test-agent-1');

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escEvent);

    expect(modal.innerHTML).toBe('');
  });

  it('should not close modal when clicking inside modal content', () => {
    modal.open('test-agent-1');

    const modalContent = modal.querySelector('[role="dialog"]') as HTMLElement;
    expect(modalContent).toBeTruthy();

    const clickEvent = new MouseEvent('click', { bubbles: true });
    modalContent.dispatchEvent(clickEvent);

    // Modal should still be open
    expect(modal.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('should copy code to clipboard when copy button is clicked', async () => {
    // Mock clipboard API
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    modal.open('test-agent-1');

    const copyButton = modal.querySelector('[aria-label="Copy source code"]') as HTMLButtonElement;
    expect(copyButton).toBeTruthy();

    copyButton.click();

    expect(mockWriteText).toHaveBeenCalledWith(mockAgent.content);
  });

  it('should show feedback when code is copied', async () => {
    vi.useFakeTimers();

    // Mock clipboard API
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    modal.open('test-agent-1');

    const copyButton = modal.querySelector('[aria-label="Copy source code"]') as HTMLButtonElement;
    const originalText = copyButton.textContent;

    copyButton.click();

    // Wait for the promise to resolve
    await vi.waitFor(() => {
      expect(copyButton.textContent).toBe('Copied!');
    });

    // Verify it changes back after timeout
    vi.advanceTimersByTime(2000);
    await vi.waitFor(() => {
      expect(copyButton.textContent).toBe(originalText);
    });

    vi.useRealTimers();
  });

  it('should emit modal-closed event when closed', () => {
    const closedHandler = vi.fn();
    modal.addEventListener('modal-closed', closedHandler);

    modal.open('test-agent-1');
    modal.close();

    expect(closedHandler).toHaveBeenCalled();
  });

  it('should prevent body scroll when open', () => {
    modal.open('test-agent-1');
    expect(document.body.style.overflow).toBe('hidden');

    modal.close();
    expect(document.body.style.overflow).toBe('');
  });

  it('should escape HTML in code content', () => {
    const agentWithHtml = createMockAgent({
      id: 'html-agent',
      content: '<script>alert("XSS")</script>',
    });
    agentStore.setAgents([agentWithHtml]);

    modal.open('html-agent');

    const codeBlock = modal.querySelector('pre code');
    expect(codeBlock?.innerHTML).toContain('&lt;script&gt;');
    expect(codeBlock?.innerHTML).not.toContain('<script>');
  });
});