import { syncRuntimeConfig } from "./config-utils.mjs"

await syncRuntimeConfig()

console.log("Synced opencode.jsonc from opencode.public.jsonc + opencode.local.jsonc")
