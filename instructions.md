# OpenCode — Agent Working Instructions
<!-- Source: https://opencode.ai/docs/agents / Anthropic prompt engineering guide 2025 -->
<!-- File này hướng dẫn agent cách làm việc hiệu quả với context, tools và workflow -->

## How to Read Context
- Start every task by reading `AGENTS.md` in the project root (if present) for project-specific rules.
- Read only the files DIRECTLY relevant to the task — do not scan the whole codebase.
- Use targeted searches (grep/glob) before opening files to minimise context usage.

## Workflow: Think → Plan → Act → Verify
<!-- Source: Builder.io "How to use AI coding agents" 2025 -->
1. **Think** — Understand the full requirement before writing a single line. Re-read if needed.
2. **Plan** — For tasks >20 lines of change: outline steps mentally or use `/plan` agent.
3. **Act** — Implement changes in small, atomic steps. Commit one logical change at a time.
4. **Verify** — After each step, check: does this break anything? Run lint/tests if available.

## Context Window Management
<!-- Source: Anthropic context engineering guide - https://anthropic.com -->
- Prefer **targeted reads** over full-file reads when possible.
- If a file is >500 lines, read only the sections needed.
- Do NOT dump entire file trees into context — use targeted listing then drill down selectively.
- When the conversation gets long, prefer compaction or a compact handoff packet over asking the user to restate progress.
- When delegation is likely, preserve a compact handoff packet instead of relying on raw transcript continuity.
- Treat compaction summaries as working state that must include objective, acceptance criteria, active files, blockers, verification, and next step.

## MCP Tools — When to Use
| Tool | When |
|------|------|
| `context7` | Looking up library docs, versions, API signatures |
| `playwright` | Browser automation, E2E testing, UI verification |

- Prefer local project knowledge first; when external library behavior is uncertain, call MCP early instead of guessing.
- Call MCP tools in parallel when fetching independent pieces of info.

## LSP Intelligence
- TypeScript/JS errors from LSP diagnostics are FACTS — treat them as blockers.
- Python errors from Pyright are WARNINGS — investigate before dismissing.
- ESLint warnings can be deferred unless they are errors (exit code ≠ 0).

## Communication Style
- **Vietnamese preferred** when user writes in Vietnamese.
- Lead with the result/answer, then explanation (bottom-line up front).
- Use code blocks for all code, commands, and file paths.
- Use tables for comparisons, options lists.
- Use bullet lists for steps, never prose paragraphs for instructions.

## Teamwork & Continuity
- Use `workflow_handoff` for complex multi-agent coordination.
- When passing work between agents, preserve: objective, acceptance criteria, active files, completed vs remaining tasks, blockers, verification state.
- For non-trivial changes, request `worker-review` for code quality assurance.
- Balance brevity with clarity — avoid code golf but eliminate unnecessary verbosity.
- If implementation stalls because of context or model constraints, continue with the backup implementation path from the handoff packet instead of restarting discovery.

## Anti-Patterns to Avoid
- ❌ Guessing an import path — verify it exists first.
- ❌ Running migrations or schema changes without warning.
- ❌ Commenting out code instead of deleting it (unless intentional).
- ❌ Creating a new file when the right fix is editing an existing one.
- ❌ Over-engineering — solve the stated problem, not hypothetical future ones.
- ❌ **Halting the session because an image is invalid** — skip it and continue.
- ❌ Retrying a failed tool call more than once without changed input.

## Error Recovery Protocol
<!-- Classify errors BEFORE reacting. Wrong classification = wasted tokens. -->
- **Image / media read error** (`"does not represent a valid image"`, `"unsupported image type"`): skip immediately, log `[SKIP: invalid image <path>]`, continue — **never halt for a bad image**.
- **MCP tool error**: retry once with simplified input. If retry fails → skip the tool step and continue without it.
- **Missing optional file**: note it, skip, continue.
- **Context overrun**: trigger compaction instead of stopping — treat compacted state as the new source of truth.
- **Classify first**: recoverable → skip+log+continue. Fatal (compile error, missing required dep, destructive op) → stop+report clearly.
- Max **1 retry** per tool call. After one retry fails, treat as skippable or escalate explicitly.
