# Agent Marketplace Frontend

## Overview
Web component-based marketplace for Claude Code subagents. Users can browse, select, and install agent packages.

## Tech Stack
- **Framework**: Vanilla TypeScript Web Components (no framework)
- **Build**: Vite
- **Testing**: Vitest + happy-dom
- **Styling**: Shadow DOM + CSS

## Architecture
```
src/
├── components/       # Web components (Option 2 - moderate separation)
│   ├── cards/       # Agent display components
│   ├── builder/     # Pack builder & command generation
│   ├── modal/       # Source viewer modal
│   └── shared/      # Reusable components (badges, buttons)
├── data/            # Static agent data (will be API later)
├── store/           # State management (selections, UI state)
├── types/           # TypeScript interfaces
└── test-utils/      # Test helpers for web components
```

## Key Features
- Browse 100+ AI agents
- Multi-select to build custom packs
- View agent source code (transparency)
- Copy npx install commands
- Report issues via GitHub

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run typecheck    # Run TypeScript type checking
npm run lint         # Run ESLint to check code quality
npm run lint:fix     # Auto-fix ESLint issues
```

## Design Principles
- **Modular**: Small, focused components
- **Type-safe**: Strict TypeScript
- **Event-driven**: Components communicate via custom events
- **No dependencies**: Pure web components, no framework
- **Transparent**: Users can inspect agent code before installing

## Implementation Guidelines
- **SIMPLICITY FIRST**: Complexity is an anti-pattern, especially for MVP
- **Do the simplest thing that works**: Avoid over-engineering
- **YAGNI**: Don't add features/abstractions until actually needed
- **Flat is better than nested**: Avoid deep hierarchies
- **Explicit over implicit**: Clear, readable code over clever tricks
- **One responsibility per component**: Each component does ONE thing well
- **Minimal state**: Only store what's absolutely necessary
- **Direct solutions**: Solve problems directly, avoid indirection

## TypeScript Guidelines
- ALWAYS use TypeScript; avoid type assertions at all costs

## Development Workflow
- Run `npm run lint` and `npm run typecheck` after all major edits
- Run `npm test` frequently to ensure tests continue to pass, especially after big changes
- Use `npm run lint:fix` to auto-fix formatting issues

## Testing Guidelines
- Tests should focus on testing *behavior*, NOT implementation details such as CSS classes or DOM elements

## Styling Guidelines
- We use CSS modules for individual component CSS. This is where CSS for components should go -- in a $COMPONENT.module.css file.