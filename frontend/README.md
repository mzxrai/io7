# io7

CLI for installing Claude Code subagents. Browse the registry at [io7.dev](https://io7.dev).

## Usage

```bash
npx io7@latest --install code-architect
```

## What are subagents?

Subagents are specialized assistants that Claude Code can delegate tasks to. Each has specific expertise and runs in its own context.

## Examples

```bash
# Install one agent
npx io7@latest --install code-architect

# Install multiple
npx io7@latest --install clerk-auth-implementation-engineer,stripe-integrator

# Install to current project
npx io7@latest --install react-debugger --local
```

## Options

- `--install` - Agent names to install (comma-separated)
- `--local` - Install to `.claude/agents/` instead of `~/.claude/agents/`
- `--help` - Show help

## Browse agents

Visit [io7.dev](https://io7.dev) to browse available agents.

## Submit an agent

Have an idea for a new subagent? [Submit your idea](https://github.com/mzxrai/io7/issues/new?template=agent-submission.yml)

## License

MIT