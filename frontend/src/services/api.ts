import type { Agent } from '../types/Agent';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = this.getApiBaseUrl();
  }

  private getApiBaseUrl(): string {
    // Check if we're in development mode
    const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';

    if (isDev) {
      return 'http://localhost:3000';
    }

    // Production: Use environment variable or same origin
    return import.meta.env.VITE_API_BASE_URL || window.location.origin;
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to post to ${endpoint}:`, error);
      throw error;
    }
  }
}

export class ApiService {
  private static instance: ApiService;
  private client: ApiClient;

  private constructor() {
    this.client = new ApiClient();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async fetchAgents(): Promise<Agent[]> {
    const agents = await this.client.get<Agent[]>('/api/agents');
    return this.enrichAgentsWithFrontendData(agents);
  }

  // Example of additional endpoints for future use
  async fetchAgent(id: string): Promise<Agent> {
    const agent = await this.client.get<Agent>(`/api/agents/${id}`);
    return this.enrichAgentWithFrontendData(agent);
  }

  async voteForAgent(agentId: string, vote: 0 | 1): Promise<{ success: boolean; message: string }> {
    return await this.client.post<{ success: boolean; message: string }>(
      `/api/agents/${agentId}/vote`,
      { vote },
    );
  }

  // Future endpoints could be added here:
  // async fetchStats(): Promise<Stats> { ... }
  // async updateAgent(agent: Agent): Promise<Agent> { ... }

  private enrichAgentWithFrontendData(agent: Agent): Agent {
    return {
      ...agent,
      // Add frontend-specific computed fields
      isPopular: agent.stats.downloads > 10000 || agent.stats.upvotes > 90,
    };
  }

  private enrichAgentsWithFrontendData(agents: Agent[]): Agent[] {
    return agents.map(agent => this.enrichAgentWithFrontendData(agent));
  }
}

export const apiService = ApiService.getInstance();