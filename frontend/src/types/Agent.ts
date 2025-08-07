export interface Agent {
  id: string;
  name: string;
  display_name?: string;
  description: string;
  display_description?: string;
  model?: string;
  tools?: string[];
  stats: {
    downloads: number;
    upvotes: number;
    downvotes: number;
  };
  metadata?: {
    category: string;
    tags: string[];
  };
  content: string;
  last_updated?: string;
  // Frontend-specific fields (computed/derived)
  isPopular?: boolean;
}


export interface AgentSource {
  name: string;
  package: string;
  yaml: string;
  prompt: string;
}