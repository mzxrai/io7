# Agent Marketplace Implementation Plan

## Reference Design
- **REFERENCE-FILE.html** - Contains the original HTML/CSS mockup that serves as our design reference
- All styling, layout, and functionality decisions should match this reference file
- Component structure is derived from analyzing the HTML structure in this file

## ✅ Completed

### Foundation
- [x] Set up Vite with TypeScript (vanilla-ts template)
- [x] Create folder structure (Option 2 - moderate separation)
- [x] Configure TypeScript with path aliases
- [x] Set up Vitest for testing with happy-dom
- [x] Create test utilities for Web Components
- [x] Update CLAUDE.md with implementation guidelines

### Data Layer
- [x] Extract agent data from REFERENCE-FILE.html
- [x] Create `agents.ts` with agent metadata
- [x] Create `agentSources.ts` with agent YAML/prompts
- [x] Define TypeScript types (Agent, AgentSource, etc.)

### State Management
- [x] TDD: Create SelectionStore with tests
- [x] Implement selection/deselection logic
- [x] Add command generation with comma-separated agents
- [x] Support global (default) vs local installation flags
- [x] Implement event system for selection changes

### Components (Shared)
- [x] TDD: Create Badge component
  - Variants: default, popular, stat
  - Icon support
  - Shadow DOM styling
- [x] TDD: Create CopyButton component
  - Click to copy functionality
  - Success feedback
  - Disabled state support

### Components (Cards)
- [x] TDD: Create AgentStats component
  - Conditional rendering (downloads > 100, votes > 100)
  - Number formatting (12.4k, 1.2M)
  - View Source button with event emission
- [x] TDD: Create AgentCard component
  - Checkbox integration with SelectionStore
  - Popular badge (using Badge component)
  - Stats row (using AgentStats component)
  - Click to select/deselect
  - View source event handling

## 📝 TODO

### Components (Builder)
- [x] TDD: Create CommandBox component
  - Display generated npx command
  - Copy button integration
  - Empty state handling
  - Command format: `npx io7@latest --install agent1,agent2`
  - Support for --local flag (project-level install)

- [x] TDD: Create SelectedAgents component
  - Display selected agent chips/tags
  - Remove agent on chip click
  - Empty state message
  - Clear all button for multiple selections

- [x] TDD: Create PackBuilder component
  - Container for CommandBox and SelectedAgents
  - Sticky positioning
  - Subscribe to SelectionStore changes
  - Local/Global installation toggle

### Components (Modal)
- [ ] TDD: Create SourceModal component
  - Display agent YAML and prompt
  - Syntax highlighting
  - Copy source functionality
  - Close on overlay click

### Components (Main)
- [ ] Create AgentGrid component
  - Grid layout for agent cards
  - Responsive design

- [ ] Create App component
  - Main layout (header, grid, sidebar)
  - Wire up all components
  - Handle modal events

### Final Steps
- [ ] Update index.html to use App component
- [ ] Update main.ts to bootstrap the app
- [ ] Add global styles (dark theme, gradients)
- [ ] Test full user flow:
  - Select multiple agents
  - View agent source
  - Copy installation command
  - Clear selections

### Nice to Have (Post-MVP)
- [ ] Search/filter functionality
- [ ] Category filtering
- [ ] Sorting options (downloads, rating, updated)
- [ ] Keyboard navigation
- [ ] Loading states
- [ ] Error handling
- [ ] Report issue functionality

## Testing Checklist
- [x] Badge component tests passing
- [x] CopyButton component tests passing
- [x] SelectionStore tests passing
- [x] AgentStats component tests passing
- [x] AgentCard component tests passing
- [x] CommandBox component tests passing
- [x] SelectedAgents component tests passing
- [x] PackBuilder component tests passing
- [ ] SourceModal component tests passing
- [ ] Integration tests for full flow
- [x] TypeScript compilation clean
- [ ] Build successful

## Architecture Notes

Following Option 2 (Moderate Separation):
```
src/
├── components/
│   ├── cards/       ✅ AgentStats, AgentCard
│   ├── builder/     ✅ CommandBox, SelectedAgents, PackBuilder
│   ├── modal/       ⏳ SourceModal
│   └── shared/      ✅ Badge, CopyButton
├── data/            ✅ agents.ts, agentSources.ts
├── store/           ✅ selection.ts
└── types/           ✅ Agent.ts, Stats.ts, Events.ts
```

## Key Principles Maintained
- ✅ Simplicity first - no over-engineering
- ✅ TDD for all components
- ✅ Single responsibility per component
- ✅ Event-driven communication
- ✅ Pure Web Components (no framework)
- ✅ TypeScript with no type assertions
- ✅ Direct solutions, minimal abstraction