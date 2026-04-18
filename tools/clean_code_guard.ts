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
  description: "Return a concise clean-code checklist focused on simplicity, maintainability, and brevity without code golf.",
  args: {
    changeType: tool.schema.string().describe("Short description of the type of change"),
    riskAreas: tool.schema.string().describe("Risk areas, one per line or comma-separated")
  },
  async execute(args) {
    const riskAreas = normalizeList(args.riskAreas)

    return [
      "# Clean Code Guard",
      "",
      `Change type: ${args.changeType.trim()}`,
      "",
      "Checklist:",
      "- Is the behavior correct for the stated requirement?",
      "- Can any duplicated logic be removed without hiding intent?",
      "- Can built-in language features replace boilerplate safely?",
      "- Are names, control flow, and data flow still obvious after simplification?",
      "- Has error handling been preserved?",
      "- Did line-count reduction avoid code golf or cryptic one-liners?",
      "",
      formatSection("Risk Areas", riskAreas)
    ].join("\n")
  }
})
