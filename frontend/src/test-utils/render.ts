/**
 * Helper utilities for testing Web Components (without Shadow DOM)
 */

export function createTestElement(html: string): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstElementChild as HTMLElement;
}

export async function fixture<T extends HTMLElement>(html: string): Promise<T> {
  const element = createTestElement(html) as T;
  document.body.appendChild(element);
  // Wait for custom element to be defined and rendered
  if ('updateComplete' in element && typeof element.updateComplete === 'function') {
    await element.updateComplete();
  }
  await nextFrame();
  return element;
}

export function cleanup() {
  document.body.innerHTML = '';
}

export async function nextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

export function dispatchCustomEvent(
  element: HTMLElement,
  eventName: string,
  detail?: any
): void {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
    composed: true,
  });
  element.dispatchEvent(event);
}

// Updated for no Shadow DOM - now just uses regular querySelector
export function queryShadow<T extends HTMLElement>(
  element: HTMLElement,
  selector: string
): T | null {
  // For backward compatibility, just use regular querySelector
  return element.querySelector<T>(selector);
}

export function queryShadowAll<T extends HTMLElement>(
  element: HTMLElement,
  selector: string
): NodeListOf<T> {
  // For backward compatibility, just use regular querySelectorAll
  return element.querySelectorAll<T>(selector);
}

// Deprecated - no longer needed
export function getShadowRoot(element: HTMLElement): ShadowRoot | null {
  return null;
}