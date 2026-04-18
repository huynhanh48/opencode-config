import { readJsoncFile, paths, writeJsonFile } from "./config-utils.mjs"

const baseConfig = await readJsoncFile(paths.publicConfig)

if (!baseConfig) {
  throw new Error("Missing opencode.public.jsonc")
}

await writeJsonFile(paths.runtimeConfig, baseConfig)

console.log("Reset opencode.jsonc to public-safe base config")
