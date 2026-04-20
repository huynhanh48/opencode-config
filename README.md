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
- **SEO-aware frontend workflow** integrated directly into frontend commands
- **Error Resilience (Skip & Continue)** prevents token-drain from dead-end errors like bad images
- **Parallel Tool Calling** for multi-file high speed analysis
- **Custom tools** loaded from `~/.config/opencode/tools/`
- **Local plugin hooks** loaded from `~/.config/opencode/plugins/`
- **Public-safe / local-secret split** so you can publish the repo without leaking keys

## Enterprise-Grade Features (v2.0)

### 1. SEO-Guided Frontend Workflow
When using the `/frontend` command, the config routes work through SEO-focused instructions and review prompts:
- **`worker`** is prompted to load the `seo-optimizer` skill for public-facing page work.
- **`worker-impl`** & **`build`** preserve semantic HTML (h1→h2), descriptive `alt` text, and image dimensions to reduce CLS risk.
- **`worker-review`** is prompted to flag critical SEO gaps during review (metadata, Open Graph tags, schema, heading hierarchy).
- **Playwright MCP** can be used to verify the final *Rendered DOM* when a JS framework may alter metadata at runtime.

### 2. Guardrails & Token Optimization
AI agents can easily burn millions of tokens in endless loops. This config reduces that risk:
- **Graceful Image Failure:** If an image is broken or unsupported, the agent logs `[SKIP: <reason>]` and continues work immediately instead of halting and repeatedly trying to read it.
- **Max 1 Retry:** Faulty MCP Tool calls are limited to 1 retry.
- **Context Continuity:** `workflow_handoff` gives agents a compact, structured packet so fallback and continuation do not restart from scratch.
- **Secret File Protection:** Blocks access to `.env`, credentials, SSH keys, and other sensitive files.
- **Interactive Command Blocking:** Prevents agents from running `vim`, `ssh`, `npm init`, and other interactive commands that would hang.
- **Dangerous Command Prevention:** Blocks `rm -rf`, force pushes, and other destructive operations without confirmation.
- **Configuration Doctor:** `bun run doctor` validates config integrity, checks references, detects runtime drift, and checks for obvious secret leakage patterns.


## Clone & Install

```bash
git clone https://github.com/huynhanh48/opencode-config ~/.config/opencode
cd ~/.config/opencode && bun install
```

### What this does

- clones this repo into your global OpenCode config directory
- installs dependencies needed by local plugins and local custom tools
- keeps optional npm ecosystem plugins out of the default install path unless you opt into a profile
- uses Bun as the canonical dependency and lockfile workflow
- keeps `opencode.local.example.jsonc` minimal so fresh installs start with fewer failure points

## Config Layers

This repo is split into three config layers:

- `opencode.public.jsonc` → tracked **public-safe source of truth**
- `opencode.local.jsonc` → ignored **local override file** for secrets and personal plugins
- `opencode.jsonc` → generated **runtime config** used by OpenCode

This keeps GitHub safe while still letting you use local secrets and local plugin choices.

## After Install

### 1. Create your local override file

```bash
cp opencode.local.example.jsonc opencode.local.jsonc
```

### 2. Add your own Context7 credentials

This repo does **not** ship a real API key.

Edit `opencode.local.jsonc` and set your key:

```jsonc
{
  "mcp": {
    "context7": {
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_CONTEXT7_API_KEY"
      }
    }
  }
}
```

### 3. Generate the runtime config

```bash
bun run apply-local-config
```

Optional quick health check:

```bash
bun run doctor
```

Public-repo safety check without reading local overrides:

```bash
OPENCODE_DOCTOR_SKIP_LOCAL=1 bun run doctor
```

### 4. Restart OpenCode

Local plugins and local custom tools are loaded at startup.

### 5. Verify the setup

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
├── opencode.public.jsonc
├── opencode.local.example.jsonc
├── tui.json
├── AGENTS.md
├── instructions.md
├── package.json
├── .gitignore
├── scripts/
│   ├── config-utils.mjs
│   ├── sync-config.mjs
│   ├── reset-config.mjs
│   ├── apply-local-config.mjs
│   └── apply-profile.mjs
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

Local-only runtime layering:

```text
~/.config/opencode/
├── opencode.public.jsonc        # tracked public-safe config
├── opencode.local.example.jsonc # tracked example for local overrides
├── opencode.local.jsonc         # ignored local overrides with secrets
└── opencode.jsonc               # generated runtime config
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
- interactive bash guard for commands likely to hang or require TTY input
- dangerous bash guard for destructive shell patterns
- extra compaction context so continuation summaries preserve teamwork state

## Profiles

Profiles are optional config snippets under `profiles/`.

They are **not** auto-enabled.

Use them when you want to extend the base config.

OpenCode does **not** automatically inspect `profiles/` and choose one for you at runtime.

If you want to use a profile, you must merge its `plugin` list into your effective config, usually through `opencode.local.jsonc`.

This repo also ships a helper command so you do not need to merge by hand.

### Apply a profile with the helper

```bash
bun run apply-profile observability
```

This merges the selected profile into `opencode.local.jsonc` and regenerates `opencode.jsonc`.

List profiles with:

```bash
bun run apply-profile --list
```

### Example: enable a profile manually

If `profiles/observability.jsonc` contains:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "opencode-helicone-session",
    "opencode-sentry-monitor"
  ]
}
```

then you manually copy the plugin names into `opencode.local.jsonc`:

```jsonc
{
  "plugin": [
    "opencode-helicone-session",
    "opencode-sentry-monitor"
  ]
}
```

You can also combine multiple profiles by merging their plugin arrays yourself, or by running `bun run apply-profile` multiple times.

### Available profiles

| Profile | Purpose |
|---|---|
| `core.jsonc` | baseline profile with no extra npm plugins |
| `context-efficiency.jsonc` | placeholder profile for future verified context plugins |
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

- do **not** commit real API keys into `opencode.public.jsonc`
- keep secrets inside `opencode.local.jsonc`
- run `bun run reset-config` before committing if your local runtime config contains overrides
- keep `node_modules/` out of git
- local plugin/tools need `bun install`
- npm plugins declared in `plugin` are resolved by OpenCode at startup
- ecosystem listing does not always guarantee npm availability; this repo keeps the default path conservative to avoid install failures

## Helper Commands

```bash
bun run sync-config         # rebuild opencode.jsonc from public + local
bun run apply-local-config  # validate local overrides exist, then rebuild runtime config
bun run apply-profile NAME  # merge a profile into opencode.local.jsonc and rebuild runtime config
bun run doctor              # validate config integrity, references, runtime drift, and public-safe state
bun run reset-config        # restore opencode.jsonc to the public-safe base
```

## Lockfile Strategy

This repo uses **Bun as the canonical package manager** for local plugin/tool dependencies.

- use `bun install`
- commit `bun.lock`
- ignore `package-lock.json`

## Recommended First Use

After installing:

1. copy `opencode.local.example.jsonc` to `opencode.local.jsonc`
2. add your Context7 key
3. run `bun run apply-local-config`
4. start OpenCode
5. run a simple task with `worker`
6. test a frontend task using `frontend`
7. test a long task and verify fallback/handoff behavior

## License

Use, fork, and adapt freely for your own OpenCode setup.
