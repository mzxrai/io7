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

  async post<T>(endpoint: string, data: any): Promise<T> {
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

  // Future endpoints could be added here:
  // async fetchStats(): Promise<Stats> { ... }
  // async updateAgent(agent: Agent): Promise<Agent> { ... }

  private enrichAgentWithFrontendData(agent: Agent): Agent {
    return {
      ...agent,
      // Add frontend-specific computed fields
      package: this.generatePackageName(agent.name),
      category: this.determineCategory(agent.name, agent.description),
      icon: this.getAgentIcon(agent.name),
      isPopular: agent.stats.downloads > 10000 || agent.stats.upvotes > 90,
    };
  }

  private enrichAgentsWithFrontendData(agents: Agent[]): Agent[] {
    return agents.map(agent => this.enrichAgentWithFrontendData(agent));
  }

  private generatePackageName(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private determineCategory(name: string, description: string): string {
    const text = (name + ' ' + description).toLowerCase();
    
    if (text.includes('security') || text.includes('vulnerability') || text.includes('audit')) {
      return 'Security';
    }
    if (text.includes('performance') || text.includes('optimization') || text.includes('optimize')) {
      return 'Infrastructure';
    }
    if (text.includes('database') || text.includes('query') || text.includes('schema')) {
      return 'Database';
    }
    if (text.includes('accessibility') || text.includes('a11y') || text.includes('wcag')) {
      return 'Accessibility';
    }
    if (text.includes('test') || text.includes('quality') || text.includes('qa')) {
      return 'Quality';
    }
    if (text.includes('documentation') || text.includes('docs') || text.includes('readme')) {
      return 'Documentation';
    }
    if (text.includes('api') || text.includes('architecture') || text.includes('design')) {
      return 'Architecture';
    }
    if (text.includes('marketing') || text.includes('conversion') || text.includes('optimize')) {
      return 'Marketing';
    }
    
    return 'Infrastructure'; // Default category
  }

  private getAgentIcon(name: string): string {
    const iconMap: Record<string, string> = {
      'security': '🔒',
      'performance': '⚡',
      'optimization': '📈', 
      'database': '🗄️',
      'accessibility': '♿',
      'test': '🧪',
      'documentation': '📚',
      'api': '🔌',
      'code': '💻',
    };

    const lowerName = name.toLowerCase();
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(keyword)) {
        return icon;
      }
    }
    
    return '🤖'; // Default icon
  }
}

export const apiService = ApiService.getInstance();