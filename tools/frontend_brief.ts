import { tool } from "@opencode-ai/plugin"

const normalizeList = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)

export default tool({
  description: "Create a compact frontend design brief before UI implementation.",
  args: {
    purpose: tool.schema.string().describe("What the interface should achieve"),
    audience: tool.schema.string().describe("Who the interface is for"),
    tone: tool.schema.string().describe("Emotional or brand tone"),
    visualDirection: tool.schema.string().describe("Chosen visual direction"),
    memorableIdea: tool.schema.string().describe("One memorable design idea"),
    constraints: tool.schema.string().describe("Constraints, one per line or comma-separated")
  },
  async execute(args) {
    const constraints = normalizeList(args.constraints)

    return [
      "# Frontend Brief",
      "",
      `- Purpose: ${args.purpose.trim()}`,
      `- Audience: ${args.audience.trim()}`,
      `- Tone: ${args.tone.trim()}`,
      `- Visual direction: ${args.visualDirection.trim()}`,
      `- Memorable idea: ${args.memorableIdea.trim()}`,
      ...(constraints.length > 0
        ? ["- Constraints:", ...constraints.map((item) => `  - ${item}`)]
        : ["- Constraints: None"])
    ].join("\n")
  }
})
