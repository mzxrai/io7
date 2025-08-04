export interface AgentSelectionEvent extends CustomEvent {
  detail: {
    agentId: string;
    selected: boolean;
  };
}

export interface ViewSourceEvent extends CustomEvent {
  detail: {
    agentId: string;
  };
}

export interface CopyCommandEvent extends CustomEvent {
  detail: {
    command: string;
  };
}

export interface ReportIssueEvent extends CustomEvent {
  detail: {
    agentId: string;
    agentName: string;
    packageName: string;
  };
}

export interface ModalStateEvent extends CustomEvent {
  detail: {
    open: boolean;
    modalId?: string;
  };
}

// Event name constants
export const EVENTS = {
  AGENT_SELECTED: 'agent-selected',
  VIEW_SOURCE: 'agent-view-source',
  COPY_COMMAND: 'copy-command',
  REPORT_ISSUE: 'report-issue',
  MODAL_OPEN: 'modal-open',
  MODAL_CLOSE: 'modal-close',
} as const;