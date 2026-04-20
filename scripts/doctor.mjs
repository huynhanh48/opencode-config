#!/usr/bin/env node

import { access, readFile, stat } from "node:fs/promises"
import { constants } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "jsonc-parser"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const paths = {
  publicConfig: path.join(ROOT, "opencode.public.jsonc"),
  runtimeConfig: path.join(ROOT, "opencode.jsonc"),
  localConfig: path.join(ROOT, "opencode.local.jsonc"),
  localExampleConfig: path.join(ROOT, "opencode.local.example.jsonc"),
  packageJson: path.join(ROOT, "package.json"),
  pluginsDir: path.join(ROOT, "plugins"),
  promptsDir: path.join(ROOT, "prompts"),
  scriptsDir: path.join(ROOT, "scripts"),
}

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value)

const readJsoncFile = async (filePath, fallback = null) => {
  try {
    return parse(await readFile(filePath, "utf8"))
  } catch (error) {
    if (error?.code === "ENOENT") return fallback
    throw error
  }
}

const readJsonFile = async (filePath, fallback = null) => {
  try {
    return JSON.parse(await readFile(filePath, "utf8"))
  } catch (error) {
    if (error?.code === "ENOENT") return fallback
    throw error
  }
}

const fileExists = async (filePath) => {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

const isReadable = async (filePath) => {
  try {
    await access(filePath, constants.R_OK)
    return true
  } catch {
    return false
  }
}

const mergeConfig = (base, override, key = "") => {
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

const stableStringify = (value) => JSON.stringify(value, null, 2)

const extractFileReference = (value) => {
  if (typeof value !== "string") return null
  const match = value.match(/^\{file:(.+)\}$/)
  return match ? match[1] : null
}

const scanForSecrets = (value, label, issues, currentPath = "") => {
  if (!isObject(value)) return

  const secretPatterns = [/api[_-]?key/i, /secret/i, /token/i, /password/i, /auth/i, /credential/i]

  for (const [key, childValue] of Object.entries(value)) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key
    if (
      secretPatterns.some((pattern) => pattern.test(key)) &&
      typeof childValue === "string" &&
      childValue.trim() &&
      !childValue.includes("YOUR_") &&
      !childValue.includes("example") &&
      !childValue.includes("placeholder")
    ) {
      issues.push(`Possible secret in ${label}: ${fullPath}`)
    }

    scanForSecrets(childValue, label, issues, fullPath)
  }
}

const checkConfigIntegrity = async () => {
  console.log("🔍 Checking config integrity...")
  const issues = []
  const requiredFiles = [paths.publicConfig, paths.runtimeConfig, paths.packageJson, paths.localExampleConfig]

  for (const filePath of requiredFiles) {
    if (!(await fileExists(filePath))) {
      issues.push(`Missing required file: ${path.relative(ROOT, filePath)}`)
      continue
    }

    if (!(await isReadable(filePath))) {
      issues.push(`Unreadable file: ${path.relative(ROOT, filePath)}`)
    }
  }

  for (const [label, filePath] of [
    ["public config", paths.publicConfig],
    ["runtime config", paths.runtimeConfig],
    ["local example config", paths.localExampleConfig],
  ]) {
    try {
      await readJsoncFile(filePath)
    } catch (error) {
      issues.push(`Failed to parse ${label}: ${error.message}`)
    }
  }

  try {
    const packageJson = await readJsonFile(paths.packageJson)
    if (!packageJson?.scripts) {
      issues.push("package.json missing scripts section")
    }
  } catch (error) {
    issues.push(`Failed to parse package.json: ${error.message}`)
  }

  return issues
}

const checkRuntimeDrift = async () => {
  console.log("🔍 Checking runtime config drift...")
  const issues = []
  const skipLocal = process.env.OPENCODE_DOCTOR_SKIP_LOCAL === "1"
  const publicConfig = await readJsoncFile(paths.publicConfig)
  const runtimeConfig = await readJsoncFile(paths.runtimeConfig)
  const localConfig = skipLocal ? {} : (await readJsoncFile(paths.localConfig, {})) ?? {}
  const hasLocalConfig = skipLocal ? false : await fileExists(paths.localConfig)

  if (!publicConfig || !runtimeConfig) {
    issues.push("Cannot check drift: missing config files")
    return issues
  }

  if (skipLocal) {
    if (stableStringify(runtimeConfig) !== stableStringify(publicConfig)) {
      issues.push("Runtime config differs from the public-safe base while OPENCODE_DOCTOR_SKIP_LOCAL=1 is active.")
    }

    scanForSecrets(publicConfig, "public config", issues)
    scanForSecrets(runtimeConfig, "runtime config", issues)
    return issues
  }

  const expectedRuntime = mergeConfig(publicConfig, localConfig)

  if (stableStringify(runtimeConfig) !== stableStringify(expectedRuntime)) {
    issues.push("Runtime config differs from the expected merged config. Run 'bun run sync-config' or 'bun run reset-config'.")
  }

  if (!hasLocalConfig && stableStringify(runtimeConfig) !== stableStringify(publicConfig)) {
    issues.push("Runtime config differs from the public-safe base while no local override exists.")
  }

  scanForSecrets(publicConfig, "public config", issues)
  scanForSecrets(runtimeConfig, "runtime config", issues)

  return issues
}

const checkConfigReferences = async () => {
  console.log("🔍 Checking config references...")
  const issues = []
  const skipLocal = process.env.OPENCODE_DOCTOR_SKIP_LOCAL === "1"
  const publicConfig = await readJsoncFile(paths.publicConfig)
  const localConfig = skipLocal ? {} : (await readJsoncFile(paths.localConfig, {})) ?? {}

  if (!publicConfig) {
    issues.push("Cannot inspect config references: missing public config")
    return issues
  }

  const effectiveConfig = mergeConfig(publicConfig, localConfig)

  const referencedFiles = [
    ...(Array.isArray(effectiveConfig.instructions) ? effectiveConfig.instructions : []),
    ...Object.values(effectiveConfig.agent ?? {})
      .map((agentConfig) => extractFileReference(agentConfig?.prompt))
      .filter(Boolean),
  ]

  for (const fileReference of referencedFiles) {
    const resolvedPath = path.resolve(ROOT, fileReference.replace(/^\.\//, ""))
    if (!(await fileExists(resolvedPath))) {
      issues.push(`Missing referenced file: ${fileReference}`)
    }
  }

  return issues
}

const checkPluginSafety = async () => {
  console.log("🔍 Checking plugin safety...")
  const issues = []
  const teamworkPlugin = path.join(paths.pluginsDir, "teamwork.ts")

  if (!(await fileExists(teamworkPlugin))) {
    issues.push("Missing teamwork plugin")
    return issues
  }

  try {
    const content = await readFile(teamworkPlugin, "utf8")
    const requiredPatterns = [/SECRET_FILE_PATTERNS/, /INTERACTIVE_BASH_PATTERNS/, /DANGEROUS_BASH_PATTERNS/, /tool\.execute\.before/]

    for (const pattern of requiredPatterns) {
      if (!pattern.test(content)) {
        issues.push(`Teamwork plugin missing required pattern: ${pattern}`)
      }
    }
  } catch (error) {
    issues.push(`Failed to read teamwork plugin: ${error.message}`)
  }

  return issues
}

const checkScripts = async () => {
  console.log("🔍 Checking scripts...")
  const issues = []

  for (const scriptName of ["apply-local-config.mjs", "apply-profile.mjs", "sync-config.mjs", "reset-config.mjs", "config-utils.mjs", "doctor.mjs"]) {
    const scriptPath = path.join(paths.scriptsDir, scriptName)
    if (!(await fileExists(scriptPath))) {
      issues.push(`Missing required script: ${scriptName}`)
      continue
    }

    if (!(await isReadable(scriptPath))) {
      issues.push(`Unreadable script: ${scriptName}`)
    }
  }

  try {
    const packageJson = await readJsonFile(paths.packageJson)
    for (const scriptName of ["apply-local-config", "apply-profile", "sync-config", "doctor", "reset-config"]) {
      if (!packageJson?.scripts?.[scriptName]) {
        issues.push(`Missing package.json script: ${scriptName}`)
      }
    }
  } catch (error) {
    issues.push(`Failed to check package.json scripts: ${error.message}`)
  }

  return issues
}

const checkPrompts = async () => {
  console.log("🔍 Checking prompts...")
  const issues = []

  for (const promptName of ["worker.txt", "worker-impl.txt", "worker-impl-backup.txt", "worker-review.txt"]) {
    const promptPath = path.join(paths.promptsDir, promptName)
    if (!(await fileExists(promptPath))) {
      issues.push(`Missing required prompt: ${promptName}`)
      continue
    }

    try {
      const content = await readFile(promptPath, "utf8")
      if (content.length < 100) {
        issues.push(`Prompt file suspiciously short: ${promptName}`)
      }
    } catch (error) {
      issues.push(`Failed to read prompt '${promptName}': ${error.message}`)
    }
  }

  return issues
}

const main = async () => {
  console.log("🏥 OpenCode Doctor - Configuration Health Check\n")

  const allIssues = []
  const checks = [
    ["Config Integrity", checkConfigIntegrity],
    ["Runtime Drift", checkRuntimeDrift],
    ["Config References", checkConfigReferences],
    ["Plugin Safety", checkPluginSafety],
    ["Scripts", checkScripts],
    ["Prompts", checkPrompts],
  ]

  for (const [label, check] of checks) {
    const issues = await check()
    allIssues.push(...issues.map((issue) => `[${label}] ${issue}`))
  }

  console.log("\n📋 Summary:")
  if (allIssues.length === 0) {
    console.log("✅ All checks passed! Configuration is healthy.")
    process.exit(0)
  }

  console.log(`❌ Found ${allIssues.length} issue(s):`)
  for (const issue of allIssues) {
    console.log(`  • ${issue}`)
  }
  console.log("\n💡 Run 'bun run doctor' after fixes, and use 'bun run sync-config' or 'bun run reset-config' when runtime config drifts.")
  process.exit(1)
}

main().catch((error) => {
  console.error("💥 Doctor script failed:", error)
  process.exit(1)
})
