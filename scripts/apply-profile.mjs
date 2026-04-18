import path from "node:path"
import { mergeConfig, paths, readJsoncFile, syncRuntimeConfig, writeJsonFile } from "./config-utils.mjs"

const profileArg = process.argv[2]

if (!profileArg || profileArg === "--list") {
  console.log("Available profiles:")
  console.log("- core")
  console.log("- context-efficiency")
  console.log("- typescript")
  console.log("- security")
  console.log("- observability")
  console.log("- orchestration")
  console.log("- memory-productivity")
  console.log("- sandbox")
  console.log("- research-web")
  console.log("- quality-of-life")
  process.exit(0)
}

const profileName = profileArg.endsWith(".jsonc") ? profileArg : `${profileArg}.jsonc`
const profilePath = path.join(paths.profilesDir, profileName)
const profileConfig = await readJsoncFile(profilePath, null)

if (!profileConfig) {
  throw new Error(`Profile not found: ${profileArg}`)
}

const existingLocal = (await readJsoncFile(paths.localConfig, {})) ?? {}
const mergedLocal = mergeConfig(existingLocal, profileConfig)

await writeJsonFile(paths.localConfig, mergedLocal)
await syncRuntimeConfig()

console.log(`Applied profile '${profileArg}' into opencode.local.jsonc and regenerated opencode.jsonc`)
