import {
  createElement,
  Download,
  TrendingUp,
  FileText,
  MessageCircle,
  BookOpen,
  Github,
  Star,
  Package,
  Code,
  AlertCircle,
  Check,
  Copy,
  X,
  ChevronRight,
  ExternalLink,
} from 'lucide';

// Map of icon names to Lucide icon components
const iconMap = {
  'download': Download,
  'trending-up': TrendingUp,
  'file-text': FileText,
  'message-circle': MessageCircle,
  'book-open': BookOpen,
  'github': Github,
  'star': Star,
  'package': Package,
  'code': Code,
  'alert-circle': AlertCircle,
  'check': Check,
  'copy': Copy,
  'x': X,
  'chevron-right': ChevronRight,
  'external-link': ExternalLink,
} as const;

export type IconName = keyof typeof iconMap;

/**
 * Create a single Lucide icon element
 */
export function createIcon(name: IconName, size = 16): SVGElement {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon map`);
    return document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  }

  const icon = createElement(IconComponent);
  icon.setAttribute('width', String(size));
  icon.setAttribute('height', String(size));
  return icon;
}

/**
 * Replace all data-icon placeholders in a container with Lucide SVG icons
 * @param container - The container element to search within
 * @param size - Icon size in pixels (default: 16 on desktop, 20 on mobile)
 */
export function replaceIcons(container: HTMLElement, size?: number): void {
  // Auto-detect size based on viewport if not provided
  if (!size) {
    const isMobile = window.innerWidth <= 640;
    size = isMobile ? 20 : 16;
  }
  // Find all elements with data-icon attribute
  const placeholders = container.querySelectorAll('[data-icon]');

  placeholders.forEach(placeholder => {
    const iconName = placeholder.getAttribute('data-icon') as IconName;
    if (iconName && iconMap[iconName]) {
      const icon = createIcon(iconName, size);
      placeholder.appendChild(icon);
    }
  });
}

