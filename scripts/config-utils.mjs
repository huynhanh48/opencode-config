import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "jsonc-parser"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export const paths = {
  root: ROOT,
  publicConfig: path.join(ROOT, "opencode.public.jsonc"),
  runtimeConfig: path.join(ROOT, "opencode.jsonc"),
  localConfig: path.join(ROOT, "opencode.local.jsonc"),
  profilesDir: path.join(ROOT, "profiles"),
}

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value)

export const readJsoncFile = async (filePath, fallback = null) => {
  try {
    const raw = await readFile(filePath, "utf8")
    return parse(raw)
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return fallback
    }

    throw error
  }
}

export const writeJsonFile = async (filePath, data) => {
  await writeFile(filePath, `${JSON.stringify(data, null, 4)}\n`, "utf8")
}

export const mergeConfig = (base, override, key = "") => {
  if (key === "plugin" && Array.isArray(base) && Array.isArray(override)) {
    return [...new Set([...base, ...override])]
  }

  if (Array.isArray(override)) return [...override]
  if (isObject(base) && isObject(override)) {
    const merged = { ...base }

    for (const [childKey, childValue] of Object.entries(override)) {
      merged[childKey] = childKey in base ? mergeConfig(base[childKey], childValue, childKey) : childValue
    }

    return merged
  }

  return override
}

export const syncRuntimeConfig = async () => {
  const baseConfig = await readJsoncFile(paths.publicConfig)

  if (!baseConfig) {
    throw new Error("Missing opencode.public.jsonc")
  }

  const localConfig = (await readJsoncFile(paths.localConfig, {})) ?? {}
  const runtimeConfig = mergeConfig(baseConfig, localConfig)

  await writeJsonFile(paths.runtimeConfig, runtimeConfig)

  return runtimeConfig
}
