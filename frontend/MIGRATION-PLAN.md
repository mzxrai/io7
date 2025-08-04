# Shadow DOM to CSS Modules Migration Plan

## Overview
Migrate all components from Shadow DOM to CSS Modules for better debugging experience while maintaining style encapsulation.

## Migration Pattern
For each component:
1. Create a `.module.css` file with the component's styles
2. Remove `attachShadow()` call
3. Import styles from the CSS module
4. Update `innerHTML` to use the component itself (not shadow root)
5. Update selectors to use CSS module classes
6. Fix event listeners to work without shadow boundary
7. Update tests to work without Shadow DOM

## Components to Migrate

### ✅ Completed - ALL COMPONENTS MIGRATED! 🎉
- [x] `src/components/shared/Badge.ts` → `Badge.module.css`
- [x] `src/components/cards/AgentCard.ts` → `AgentCard.module.css`
- [x] `src/components/shared/CopyButton.ts` → `CopyButton.module.css`
- [x] `src/components/cards/AgentStats.ts` → `AgentStats.module.css`
- [x] `src/components/builder/CommandBox.ts` → `CommandBox.module.css`
- [x] `src/components/App.ts` → `App.module.css` ⚡ (Critical - had to be done to fix CSS module visibility)
- [x] `src/components/AgentList.ts` → `AgentList.module.css` ⚡ (Critical - had to be done to fix CSS module visibility)
- [x] `src/components/builder/SelectedAgents.ts` → `SelectedAgents.module.css`
- [x] `src/components/builder/PackBuilder.ts` → `PackBuilder.module.css`

### 🔧 In Progress
None! Migration complete!

### 📋 Pending
None! All components migrated!

#### Main Components
- [x] ~~`src/components/AgentGrid.ts`~~ → Deleted (unused component)

#### Modal Components (if any)
- [ ] Check `src/components/modal/` directory

## Test Files to Update
After migrating components, update their corresponding test files:

### Tests to Update
- [ ] `src/components/shared/Badge.test.ts` ✅ (may already work)
- [ ] `src/components/shared/CopyButton.test.ts`
- [ ] `src/components/cards/AgentCard.test.ts` 
- [ ] `src/components/cards/AgentStats.test.ts`
- [ ] `src/components/builder/CommandBox.test.ts`
- [ ] `src/components/builder/PackBuilder.test.ts`
- [ ] `src/components/builder/SelectedAgents.test.ts`
- [ ] `src/components/AgentList.test.ts`

## Configuration Changes
- [x] Created `vite.config.ts` with CSS Modules configuration
- [x] Added `src/global.d.ts` for CSS Module TypeScript declarations
- [x] Updated `src/test-utils/render.ts` to work without Shadow DOM

## ⚠️ CRITICAL DISCOVERY
**CSS Modules cannot penetrate Shadow DOM boundaries!** If a parent component uses Shadow DOM, all CSS Module styles for child components won't apply. This is why we had to migrate App and AgentList immediately - their Shadow DOM was blocking the CSS Module styles from reaching Badge, AgentStats, etc.

## Notes
- CSS Module classes are automatically scoped with unique hashes
- Use `styles.className` to access the hashed class names
- Host styles should be applied directly to the element (`this.className`)
- Child element styles use the imported styles object
- Tests now use regular `querySelector` instead of shadow-specific utilities
- **ALL components must be migrated** - mixing Shadow DOM and CSS Modules doesn't work

## Benefits After Migration
- ✅ Chrome DevTools element selector works perfectly
- ✅ Direct access to all elements in debugger
- ✅ Simpler testing (no shadow boundaries)
- ✅ Style encapsulation maintained via CSS Modules
- ✅ Better performance (no shadow root overhead)