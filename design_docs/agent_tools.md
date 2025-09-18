# AI SDK v5 Agents + MCP for Version Control CLI

This document specifies the architecture, directory layout, and execution flow for a version control CLI that uses AI SDK v5 agents, a modular tool system, and optional MCP integration. It is designed to run from a Node CLI and from the existing Next.js API routes.

## Goals
- Provide a clean separation between tools (capabilities), agents (reasoning + tool use), orchestration (routing, sessions, task graphs), and interfaces (CLI, web).
- Be AI SDK v5-native: tool calling, streaming, and agent composition.
- Support MCP both as a server (exposing our tools) and as a client (consuming external MCP servers).
- Enable deterministic fallbacks, observability, and testability for critical git actions.

## High-level Architecture
- Interfaces
  - CLI: `bin/kite` -> `src/cli/*` commands -> Orchestrator
  - Web: Next.js routes in `src/app/api/*` -> Orchestrator
  - Background: workers for long-running tasks (optional)
- Core
  - Tools: stateless, idempotent actions with typed inputs/outputs (git, repo analysis, fs, shell)
  - Agents: reasoning units that call tools, maintain short-term plan, and produce artifacts
  - Orchestrator: routing, task graphs, session/context, cancellation, retries
- Integrations
  - AI SDK v5: model registry, tool adapters, structured outputs
  - MCP: server exposing tools and/or client consuming external tool servers
  - Providers: OpenAI, Anthropic, etc.

## Directory Structure

```text
/Applications/Kite
  ├─ src/
  │  ├─ agents/
  │  │  ├─ plannerAgent.ts
  │  │  ├─ gitOperatorAgent.ts
  │  │  ├─ reviewerAgent.ts
  │  │  ├─ releaseAgent.ts
  │  │  └─ index.ts
  │  ├─ tools/
  │  │  ├─ git/
  │  │  │  ├─ checkout.ts
  │  │  │  ├─ diff.ts
  │  │  │  ├─ commit.ts
  │  │  │  ├─ branch.ts
  │  │  │  ├─ remote.ts
  │  │  │  └─ index.ts
  │  │  ├─ repo/
  │  │  │  ├─ scanRepo.ts
  │  │  │  ├─ summarize.ts
  │  │  │  ├─ semanticSearch.ts
  │  │  │  └─ index.ts
  │  │  ├─ system/
  │  │  │  ├─ fs.ts
  │  │  │  ├─ shell.ts
  │  │  │  ├─ secrets.ts
  │  │  │  └─ index.ts
  │  │  └─ registry.ts        # central tool registration for AI SDK v5 + MCP
  │  ├─ orchestrator/
  │  │  ├─ router.ts          # intent detection + agent selection
  │  │  ├─ taskGraph.ts       # multi-step workflows
  │  │  ├─ context.ts         # per-invocation context/session
  │  │  ├─ sessionStore.ts    # persistence (file/redis/kv)
  │  │  ├─ mcpBridge.ts       # bind tools to MCP server/client
  │  │  └─ index.ts
  │  ├─ cli/
  │  │  ├─ index.ts           # CLI entry (yargs/commander)
  │  │  └─ commands/
  │  │     ├─ init.ts
  │  │     ├─ status.ts
  │  │     ├─ smart-commit.ts
  │  │     ├─ split-commit.ts
  │  │     ├─ review.ts
  │  │     └─ release-notes.ts
  │  ├─ mcp/
  │  │  ├─ server.ts          # MCP server exposing our tools/resources
  │  │  └─ mcp.config.json    # server metadata
  │  ├─ web/                  # optional thin layer to call orchestrator from Next routes
  │  │  └─ api/
  │  │     └─ agents/invoke.ts
  │  ├─ config/
  │  │  ├─ providers.ts       # models, provider keys, rate limits
  │  │  ├─ tools.ts           # which tools are enabled + policies
  │  │  └─ agents.ts          # agent policy knobs, chains, routing
  │  ├─ lib/
  │  │  ├─ logger.ts
  │  │  ├─ types.ts
  │  │  └─ errors.ts
  │  └─ index.ts              # shared exports
  ├─ bin/
  │  └─ kite                  # node shim to run src/cli
  └─ design_docs/
     └─ agent_tools.md
```

Notes
- Keep tools pure and side-effect-scoped; do not embed model calls in tools.
- Agents orchestrate tools; no direct git commands inside agents.
- Orchestrator handles cancellations, retries, rate limits, and streaming events.

## Agents
- plannerAgent: Interprets user intent, builds a plan, and delegates to sub-agents.
- gitOperatorAgent: Executes git mutations safely (branching, commits, splits, rebases) via tools.
- reviewerAgent: Reviews diffs/PRs, suggests improvements, can call `git` and `repo` read-only tools.
- releaseAgent: Generates release notes, changelogs, and tags.

Agent shape (conceptual)
```ts
export interface Agent<Input, Output> {
  name: string;
  description: string;
  tools: Tool[];                  // registered tool adapters
  handle(input: Input, ctx: AgentContext): Promise<Output>;
}
```

AI SDK v5 binding (pseudo-code)
```ts
import { createModel, streamText } from "ai"; // Vercel AI SDK v5
import { tool } from "ai/tools";              // tool adapter concept

const model = createModel({ provider: "openai", model: "gpt-4.1" });

const gitDiffTool = tool({ name: "git.diff", schema: GitDiffSchema, execute: runGitDiff });

export async function gitOperatorAgentHandle(messages, ctx) {
  return streamText({
    model,
    messages,
    tools: [gitDiffTool, /* ...other tools */],
    // structured outputs as needed
  });
}
```

## Tools
- Each tool module exports:
  - name: string (namespace like `git.diff`)
  - description: string
  - inputSchema/outputSchema (zod/JSON Schema)
  - execute: (input, ctx) => Promise<output>
- Tools must be registered in `tools/registry.ts` for AI SDK v5 and MCP exposure.

Example tool signature (pseudo-code)
```ts
export const gitDiff = defineTool({
  name: "git.diff",
  description: "Get diff for path or entire repo",
  input: z.object({ path: z.string().optional(), staged: z.boolean().default(false) }),
  output: z.object({ unified: z.string(), files: z.array(z.string()) }),
  execute: async ({ path, staged }, ctx) => {
    // shell("git diff ...") safely via system/shell
    return { unified, files };
  }
});
```

## Orchestration
- router.ts
  - Classifies intent from CLI args or user message.
  - Selects agent and initial tool set.
  - Can short-circuit to a single tool when confidence is high.
- taskGraph.ts
  - Defines multi-step workflows (e.g., plan -> diff -> review -> commit).
  - Handles dependencies, retries, and partial results.
- context.ts / sessionStore.ts
  - Captures repo path, branch, environment, auth, and streaming sinks.
  - Persist minimal state for resuming operations.

## MCP Integration
Use cases
- Server: expose `git.*`, `repo.*`, and `system.*` tools to external LLM clients via MCP.
- Client: consume external MCP servers (e.g., code search, issue tracker) via `mcpBridge.ts` and register them as tools for agents.

Server skeleton (conceptual)
```ts
// src/mcp/server.ts
import { createMcpServer } from "@modelcontextprotocol/typescript-sdk";
import { registry } from "src/tools/registry";

const server = createMcpServer({
  name: "kite-vcs-tools",
  tools: registry.exportForMcp(),
  resources: [],
});

server.listen();
```

Client bridge (conceptual)
```ts
// src/orchestrator/mcpBridge.ts
export async function attachMcpToolsToAgent(agent, servers) {
  for (const s of servers) {
    const remoteTools = await s.listTools();
    agent.tools.push(...wrapAsAiSdkTools(remoteTools));
  }
}
```

## Interfaces
CLI
- `bin/kite` -> `src/cli/index.ts` (commander/yargs)
- Each command translates flags into a normalized `InvocationContext` and calls orchestrator.

Web (Next.js)
- Keep route handlers thin; use orchestrator directly. Example: `src/app/api/toolCalling/route.ts` can invoke `orchestrator/index.ts`.

## Data Flows
Smart Commit (split + message)
1) CLI parses: `kite smart-commit --scope src/tools/git --explain`
2) Router selects `plannerAgent` -> plan steps
3) `gitOperatorAgent` calls `git.diff`, `repo.summarize`, proposes a split plan
4) `reviewerAgent` validates, adjusts messages
5) `gitOperatorAgent` executes `git.commit` for each atomic change
6) Output streamed to CLI, with dry-run option by flag/policy

PR Review
1) Router -> `reviewerAgent`
2) Tools: `git.diff`, `repo.semanticSearch`
3) Structured review with inline suggestions

Release Notes
1) Router -> `releaseAgent`
2) Tools: `git.branch`, `git.log`, `repo.summarize`
3) Generates notes and optional tag creation

## Configuration
- `config/providers.ts`: model providers and default models per environment.
- `config/tools.ts`: allowed tool set per interface (CLI vs Web), safety limits.
- `config/agents.ts`: routing thresholds, max steps, review policies.

## Observability & Safety
- Structured logs: start/end of invocations, tool calls, durations, results truncated.
- Dry-run modes for mutating tools; explicit `--yes` or policy gate for writes.
- Rollback helpers for multi-step git operations.

## Testing Strategy
- Unit test tools with fixtures (no model calls).
- Contract test agent-tool schemas (zod schemas) and sample traces.
- E2E dry-run for CLI commands on a temp repo.

## Implementation Order (Recommended)
1) Tools foundation: `system/shell`, `git/*` read-only, `repo/scanRepo`
2) Tool registry + adapters for AI SDK v5
3) `gitOperatorAgent` minimal + router + CLI entry
4) `reviewerAgent` + `releaseAgent`
5) MCP server exposing tools; optional MCP client bridge
6) Next.js route adapters to orchestrator
7) Harden policies, logging, tests

## Command Map (initial)
- `kite init` — initialize repo context and config
- `kite status` — summarize working tree with AI explanation
- `kite smart-commit` — propose split commits and messages, optional auto-apply
- `kite split-commit` — split current staged changes into atomic commits
- `kite review` — review current branch or PR
- `kite release-notes` — draft notes from tags or commits range

## Notes on this repo
- You already have `src/app/api/toolCalling/route.ts`. Keep it as a thin adapter: parse request, call `orchestrator/index.ts`, return streamed output.
- Add `src/agents`, `src/orchestrator`, and expand `src/tools` following the structure above.
- If you prefer a separate CLI package later, this structure can be moved under `packages/cli` with minimal changes.
