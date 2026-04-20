import type { Plugin } from "@opencode-ai/plugin"

const SECRET_FILE_PATTERNS = [
  /(^|\/)\.env(\..+)?$/,
  /(^|\/)opencode\.local\.jsonc$/,
  /(^|\/)\.?secret/i,
  /(^|\/)credentials?\.(json|yml|yaml|toml|ini)$/i,
  /(^|\/)config\.(local|private|secret)\./i,
  /(^|\/)\.?aws\/credentials$/i,
  /(^|\/)\.?npmrc$/,
  /(^|\/)\.?git-credentials$/,
  /(^|\/)\.?netrc$/,
  /(^|\/)\.?dockercfg$/,
  /(^|\/)\.?docker\/config\.json$/,
  /(^|\/)\.?kube\/config$/,
  /(^|\/)\.?ssh\/(id_[^\/]+|config)$/,
]

const INTERACTIVE_BASH_PATTERNS = [
  /^\s*(vi|vim|nvim|nano|pico|less|more|man|top|htop|watch|tmux|screen)\b/,
  /\btail\s+-[fF]\b/,
  /\b(ssh|sftp|ftp)\s+[^-]/,
  /\bgit\s+(add|checkout|reset|rebase)\s+-i\b/,
  /\bgit\s+commit\b(?!.*\s(-m|--message)\b)/,
  /\bgit\s+commit\s+--amend\b/,
  /\bgh\s+auth\s+login\b/,
  /\b(npm|pnpm|yarn|bun)\s+(init|create|login|adduser|whoami)\b/,
  /\bnpx\s+create-[^\s]+/,
  /\bdocker\s+(run|exec|attach)\s+.*\s-it\b/,
  /\bdocker\s+compose\s+up\b(?!.*\s-d\b)/,
  /\bmysql\s+(-p|--password)/,
  /\bpsql\s+.*\s(-W|--password)/,
  /\bpython\s+-i\b/,
  /\bnode\s+(-i|--interactive)\b/,
  /\bbash\s+-i\b/,
  /\bzsh\s+-i\b/,
]

const DANGEROUS_BASH_PATTERNS = [
  /\brm\s+.*\s-([rf]+|.*[rf].*)\b/,
  /\brm\s+.*\s--(recursive|force)/,
  /\bgit\s+reset\s+.*\s--hard\b/,
  /\bgit\s+clean\s+.*\s-([fdx]+|.*[fdx].*)\b/,
  /\bgit\s+push\b.*\s--force(?!-with-lease)\b/,
  /\bgit\s+push\b.*\s-f\b/,
  /\bsudo\b/,
  /\bdd\s+.*\sif=.*\sof=/,
  /\bmv\s+.*\s\/dev\/null/,
  /\b:\s*>/,
  /\b>\s*\/dev\/\w+\s*2>&1/,
  /\bcurl\s+.*\s\|.*\s(sh|bash|zsh)\b/,
  /\bwget\s+.*\s-O-\s*\|.*\s(sh|bash|zsh)\b/,
]

const HANG_PRONE_PATTERNS = [
  /\bsleep\s+\d+\b/,
  /\bwhile\s+true/,
  /\bfor\s+\(;;\)/,
  /\b(npm|pnpm|yarn|bun)\s+run\s+(dev|start|serve|watch)\b/,
  /\b(next|vite|webpack)\s+(dev|serve|watch)\b/,
  /\bpython\s+-m\s+http\.server\b/,
  /\bping\b/,
  /\btelnet\s+/,
  /\bnc\s+.*\s-l/,
]

const getStringArg = (args: unknown, key: string) =>
  typeof args === "object" && args !== null && key in args ? String((args as Record<string, unknown>)[key]) : ""

const teamworkPlugin: Plugin = async () => ({
  "tool.execute.before": async (input, output) => {
    // File access guard
    if (["read", "edit", "write"].includes(input.tool)) {
      const filePath = getStringArg(output.args, "filePath").trim()

      if (SECRET_FILE_PATTERNS.some((pattern) => pattern.test(filePath))) {
        throw new Error(`Blocked access to secret file: ${filePath}. Use environment variables or secure configuration instead.`)
      }

      // Additional safety: block access to system directories
      const normalizedPath = filePath.toLowerCase()
      if (
        normalizedPath.includes('/etc/') ||
        normalizedPath.includes('/usr/') ||
        normalizedPath.includes('/var/') ||
        normalizedPath.includes('/sys/') ||
        normalizedPath.includes('/proc/') ||
        normalizedPath.includes('/dev/')
      ) {
        throw new Error(`Blocked access to system directory: ${filePath}. Stay within project workspace.`)
      }

      return
    }

    // Bash command guard
    if (input.tool !== "bash") return

    const command = getStringArg(output.args, "command").trim()

    if (!command) return

    // Check for interactive commands
    if (INTERACTIVE_BASH_PATTERNS.some((pattern) => pattern.test(command))) {
      throw new Error("Blocked interactive shell command. Use non-interactive flags, scripts, or deterministic alternatives.")
    }

    // Check for dangerous commands
    if (DANGEROUS_BASH_PATTERNS.some((pattern) => pattern.test(command))) {
      throw new Error("Blocked dangerous shell command. Ask the user for explicit confirmation and prefer safer alternatives.")
    }

    // Check for hang-prone commands
    if (HANG_PRONE_PATTERNS.some((pattern) => pattern.test(command))) {
      throw new Error("Blocked hang-prone shell command. Use timeouts or non-blocking alternatives.")
    }

    // Additional safety: block commands with pipes to shell
    if (/\|\s*(sh|bash|zsh|python|node|ruby|perl)\b/.test(command)) {
      throw new Error("Blocked command with pipe to interpreter. Use explicit scripts or safer patterns.")
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
