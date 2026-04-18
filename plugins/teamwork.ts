import type { Plugin } from "@opencode-ai/plugin"

const SECRET_FILE_PATTERN = /(^|\/)\.env(\..+)?$/
const INTERACTIVE_BASH_PATTERNS = [
  /^\s*(vi|vim|nvim|nano|pico|less|more|man|top|htop|watch)\b/,
  /\btail\s+-[fF]\b/,
  /\bssh\b/,
  /\bsftp\b/,
  /\bftp\b/,
  /\bgit\s+(add|checkout|reset)\s+-i\b/,
  /\bgit\s+rebase\s+-i\b/,
  /\bnpm\s+init\b/,
  /\bpnpm\s+create\b/,
  /\bnpx\s+create-[^\s]+/,
]
const DANGEROUS_BASH_PATTERNS = [
  /\brm\s+-rf\b/,
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\s+-fdx\b/,
  /\bgit\s+push\b.*\s--force(?!-with-lease)\b/,
]

const getStringArg = (args: unknown, key: string) =>
  typeof args === "object" && args !== null && key in args ? String((args as Record<string, unknown>)[key]) : ""

const teamworkPlugin: Plugin = async () => ({
  "tool.execute.before": async (input, output) => {
    if (["read", "edit", "write"].includes(input.tool)) {
      const filePath = getStringArg(output.args, "filePath")

      if (SECRET_FILE_PATTERN.test(filePath)) {
        throw new Error("Do not access .env files from agents. Use credentials or environment configuration instead.")
      }

      return
    }

    if (input.tool !== "bash") return

    const command = getStringArg(output.args, "command")

    if (INTERACTIVE_BASH_PATTERNS.some((pattern) => pattern.test(command))) {
      throw new Error("Blocked interactive shell command. Use non-interactive flags or a deterministic alternative instead.")
    }

    if (DANGEROUS_BASH_PATTERNS.some((pattern) => pattern.test(command))) {
      throw new Error("Blocked dangerous shell command. Ask the user first and prefer a safer alternative.")
    }
  },
  "experimental.session.compacting": async (_input, output) => {
    output.context.push(`
## Teamwork Continuation Context

Preserve the following state in the compacted summary:
- Current objective
- Acceptance criteria
- Active files
- Completed work vs remaining work
- Blockers or limits encountered
- Verification state
- Immediate next step
- Whether a fallback handoff to a backup implementation agent is active
`)
  }
})

export default teamworkPlugin
