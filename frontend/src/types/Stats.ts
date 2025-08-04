export interface StatItem {
  icon?: string;
  value: string | number;
  label?: string;
  type?: 'downloads' | 'upvotes' | 'updated' | 'version';
}

export interface CTALink {
  icon: string;
  text: string;
  href: string;
  action?: () => void;
}