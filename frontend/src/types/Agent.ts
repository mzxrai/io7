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
  icon?: string;
  isPopular?: boolean;
}


export interface AgentSource {
  name: string;
  package: string;
  yaml: string;
  prompt: string;
}