import { tool } from "@opencode-ai/plugin"

const normalizeList = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)

const formatSection = (title: string, items: string[]) => {
  if (items.length === 0) return `## ${title}\n- None`
  return `## ${title}\n${items.map((item) => `- ${item}`).join("\n")}`
}

export default tool({
  description: "Create a structured handoff packet for delegation or fallback continuation.",
  args: {
    objective: tool.schema.string().describe("Overall objective to complete"),
    acceptanceCriteria: tool.schema.string().describe("Success conditions, one per line or comma-separated"),
    activeFiles: tool.schema.string().describe("Files currently in scope, one per line or comma-separated"),
    completedWork: tool.schema.string().describe("What is already done, one per line or comma-separated"),
    remainingWork: tool.schema.string().describe("What still needs to be done, one per line or comma-separated"),
    blockers: tool.schema.string().describe("Current blockers or limits, one per line or comma-separated"),
    verificationState: tool.schema.string().describe("Current verification status"),
    nextStep: tool.schema.string().describe("Recommended immediate next step")
  },
  async execute(args, context) {
    return [
      "# Workflow Handoff",
      "",
      `Agent: ${context.agent}`,
      `Directory: ${context.directory}`,
      `Worktree: ${context.worktree}`,
      "",
      "## Objective",
      args.objective.trim(),
      "",
      formatSection("Acceptance Criteria", normalizeList(args.acceptanceCriteria)),
      "",
      formatSection("Active Files", normalizeList(args.activeFiles)),
      "",
      formatSection("Completed Work", normalizeList(args.completedWork)),
      "",
      formatSection("Remaining Work", normalizeList(args.remainingWork)),
      "",
      formatSection("Blockers", normalizeList(args.blockers)),
      "",
      "## Verification State",
      args.verificationState.trim(),
      "",
      "## Recommended Next Step",
      args.nextStep.trim()
    ].join("\n")
  }
})
