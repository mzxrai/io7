export interface Agent {
  id: string;
  name: string;
  description: string;
  model?: string;
  tools?: string[];
  stats: {
    downloads: number;
    upvotes: number;
    votes: number;
  };
  content: string;
  last_updated?: string;
  // Frontend-specific fields (computed/derived)
  package?: string;
  category?: AgentCategory;
  icon?: string;
  isPopular?: boolean;
}

export type AgentCategory =
  | 'Marketing'
  | 'Security'
  | 'Infrastructure'
  | 'Accessibility'
  | 'Database'
  | 'Architecture'
  | 'Quality'
  | 'Documentation';

export interface AgentSource {
  name: string;
  package: string;
  yaml: string;
  prompt: string;
}