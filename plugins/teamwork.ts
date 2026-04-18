import type { Plugin } from "@opencode-ai/plugin"

const SECRET_FILE_PATTERN = /(^|\/)\.env(\..+)?$/

const teamworkPlugin: Plugin = async () => ({
  "tool.execute.before": async (input, output) => {
    if (!["read", "edit", "write"].includes(input.tool)) return

    const filePath =
      typeof output.args === "object" && output.args !== null && "filePath" in output.args
        ? String(output.args.filePath)
        : ""

    if (SECRET_FILE_PATTERN.test(filePath)) {
      throw new Error("Do not access .env files from agents. Use credentials or environment configuration instead.")
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
