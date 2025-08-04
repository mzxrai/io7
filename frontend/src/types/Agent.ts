export interface Agent {
  id: string;
  name: string;
  package: string;
  category: AgentCategory;
  description: string;
  icon: string;
  downloads: number;
  upvotes?: number;
  votes?: number;
  lastUpdated: string;
  isPopular?: boolean;
  yaml?: string;
  prompt?: string;
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