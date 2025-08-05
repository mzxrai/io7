import type { Agent } from '../types/Agent';

class AgentStore extends EventTarget {
  private agents: Agent[] = [];

  setAgents(agents: Agent[]): void {
    this.agents = agents;
    this.dispatchEvent(new CustomEvent('agents-updated', {
      detail: { agents },
    }));
  }

  getAgents(): Agent[] {
    return this.agents;
  }

  getAgentById(id: string): Agent | undefined {
    return this.agents.find(agent => agent.id === id);
  }
}

// Singleton instance
export const agentStore = new AgentStore();