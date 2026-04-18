import { readJsoncFile, paths, syncRuntimeConfig } from "./config-utils.mjs"

const localConfig = await readJsoncFile(paths.localConfig, null)

if (!localConfig) {
  throw new Error("Missing opencode.local.jsonc. Copy opencode.local.example.jsonc first.")
}

await syncRuntimeConfig()

console.log("Applied local overrides from opencode.local.jsonc")
