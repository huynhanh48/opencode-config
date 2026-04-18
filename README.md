# opencode-config

Production-oriented global OpenCode config with:

- multi-agent teamwork (`worker`, `worker-impl`, `worker-impl-backup`, `worker-review`)
- continuity-aware fallback workflow
- local custom tools for handoff, frontend briefs, and clean-code checks
- local safety/compaction hooks
- optional plugin profiles for different use cases

## Highlights

- **Default agent = `worker`** for plan → delegate → verify workflows
- **Primary coder = `worker-impl`** using `openrouter/deepseek/deepseek-v3.2`
- **Cheap fallback coder = `worker-impl-backup`** using `opencode-go/glm-5`
- **Reviewer = `worker-review`** using `openai/gpt-5.4`
- **Custom tools** loaded from `~/.config/opencode/tools/`
- **Local plugin hooks** loaded from `~/.config/opencode/plugins/`
- **Profiles** to enable extra ecosystem plugins without bloating the base config
- **No default npm plugin dependency** in the base config, so fresh installs do not fail on missing community packages

## Clone & Install

```bash
git clone https://github.com/huynhanh48/opencode-config ~/.config/opencode
cd ~/.config/opencode && bun install
```

### What this does

- clones this repo into your global OpenCode config directory
- installs dependencies needed by local plugins and local custom tools
- keeps optional npm ecosystem plugins out of the default install path unless you opt into a profile

## After Install

### 1. Add your own Context7 credentials

This repo does **not** ship a real API key.

Use one of these approaches:

- configure Context7 with OpenCode's `/connect` flow
- or edit `opencode.jsonc` locally and uncomment:

```jsonc
"headers": {
  "CONTEXT7_API_KEY": "YOUR_CONTEXT7_API_KEY"
}
```

### 2. Restart OpenCode

Local plugins and local custom tools are loaded at startup.

### 3. Verify the setup

You should see or be able to use:

- primary agent: `worker`
- hidden subagents:
  - `worker-impl`
  - `worker-impl-backup`
  - `worker-review`
- custom tools:
  - `workflow_handoff`
  - `frontend_brief`
  - `clean_code_guard`

## Install Philosophy

This repo is split into:

- **core config** → stable defaults that should work for most users
- **local tools** → reusable agent capabilities
- **local plugin hooks** → safety, compaction continuity, guardrails
- **profiles** → optional ecosystem plugin bundles by use case

The goal is to keep the base config:

- powerful
- professional
- easy to fork
- low-hallucination
- minimal in default dependencies

## Directory Structure

```text
~/.config/opencode/
├── README.md
├── opencode.jsonc
├── tui.json
├── AGENTS.md
├── instructions.md
├── package.json
├── .gitignore
├── prompts/
│   ├── build.txt
│   ├── worker.txt
│   ├── worker-impl.txt
│   ├── worker-impl-backup.txt
│   └── worker-review.txt
├── instructions/
│   ├── agent-routing.md
│   ├── code-quality.md
│   ├── frontend-design.md
│   └── teamwork-continuation.md
├── tools/
│   ├── workflow_handoff.ts
│   ├── frontend_brief.ts
│   └── clean_code_guard.ts
├── plugins/
│   └── teamwork.ts
├── profiles/
│   ├── README.md
│   ├── core.jsonc
│   ├── context-efficiency.jsonc
│   ├── typescript.jsonc
│   ├── security.jsonc
│   ├── observability.jsonc
│   ├── orchestration.jsonc
│   ├── memory-productivity.jsonc
│   ├── sandbox.jsonc
│   ├── research-web.jsonc
│   └── quality-of-life.jsonc
└── skills/
```

## Core Architecture

### Agents

| Agent | Role | Model |
|---|---|---|
| `worker` | orchestrator / planner / delegator | `openai/gpt-5.4` |
| `worker-impl` | primary implementation | `openrouter/deepseek/deepseek-v3.2` |
| `worker-impl-backup` | cheap fallback implementation | `opencode-go/glm-5` |
| `worker-review` | read-only review | `openai/gpt-5.4` |
| `build` | direct implementation agent | `openai/gpt-5.4` |
| `plan` | analysis-only planner | `openai/gpt-5.4` |

### Fallback model behavior

This config does **not** rely on true engine-level automatic model switching between unrelated model IDs.

Instead, it uses a **workflow fallback**:

1. `worker` delegates to `worker-impl`
2. if implementation hits context/model/tool limits, a structured handoff is created
3. `worker` delegates continuation to `worker-impl-backup`

This is more explicit, more debuggable, and safer for long-running sessions.

## Custom Tools

### `workflow_handoff`

Creates a structured continuation packet containing:

- objective
- acceptance criteria
- active files
- completed work
- remaining work
- blockers
- verification state
- next step

### `frontend_brief`

Locks a design frame before frontend implementation:

- purpose
- audience
- tone
- visual direction
- memorable idea
- constraints

### `clean_code_guard`

Returns a compact checklist to reduce:

- unnecessary LOC
- duplicated logic
- over-abstraction
- unsafe shortening / code golf

## Local Plugin Hooks

`plugins/teamwork.ts` currently handles:

- `.env` access protection for `read` / `edit` / `write`
- extra compaction context so continuation summaries preserve teamwork state

## Profiles

Profiles are optional config snippets under `profiles/`.

They are **not** auto-enabled.

Use them when you want to extend the base config.

### Available profiles

| Profile | Purpose |
|---|---|
| `core.jsonc` | shell safety baseline |
| `context-efficiency.jsonc` | better context pruning + type injection |
| `typescript.jsonc` | TypeScript/Svelte-focused enhancement |
| `security.jsonc` | redaction/security-oriented plugins |
| `observability.jsonc` | monitor agent behavior and sessions |
| `orchestration.jsonc` | advanced orchestration/background agents |
| `memory-productivity.jsonc` | persistent memory + productivity tracking |
| `sandbox.jsonc` | sandboxes, devcontainers, worktrees |
| `research-web.jsonc` | web search / crawl workflows |
| `quality-of-life.jsonc` | notifications and markdown cleanup |

See `profiles/README.md` for details.

### Verified plugin policy

This repo only enables **verified-safe defaults** in the main config.

- The base config uses **local tools** and **local plugin hooks** by default.
- Optional profiles contain only plugins that were checked against npm at verification time.
- If an ecosystem item exists as a GitHub/community plugin but is not installable from npm, it is **not enabled by default** here.

## Included MCP / Tooling

### MCP

- `context7` — documentation lookup
- `playwright` — browser automation / UI verification

### LSP

- custom `tailwindcss` language server
- built-in TypeScript / ESLint / Pyright support from OpenCode ecosystem

### Formatters

- `prettier`
- `uv`

## Design Goals

This config optimizes for:

- **clean code** over noisy code
- **shorter code when readability improves**
- **no code golf**
- **explicit delegation** over opaque automation
- **continuity-aware teamwork**
- **targeted context retrieval** over dumping entire codebases
- **docs-first behavior** when APIs are uncertain

## Public Repo Notes

- do **not** commit real API keys into `opencode.jsonc`
- keep `node_modules/` out of git
- local plugin/tools need `bun install`
- npm plugins declared in `plugin` are resolved by OpenCode at startup
- ecosystem listing does not always guarantee npm availability; this repo keeps the default path conservative to avoid install failures

## Recommended First Use

After installing:

1. configure your own Context7 access
2. start OpenCode
3. run a simple task with `worker`
4. test a frontend task using `frontend`
5. test a long task and verify fallback/handoff behavior

## License

Use, fork, and adapt freely for your own OpenCode setup.
