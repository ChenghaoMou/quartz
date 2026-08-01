import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import YAML from "yaml"

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/
const WIKILINK = /(!?)\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g
const MARKDOWN_LINK = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g

export function parseMarkdown(source, file = "note.md") {
  const match = source.match(FRONTMATTER)
  if (!match) return { frontmatter: {}, body: source }
  let frontmatter
  try {
    frontmatter = YAML.parse(match[1]) ?? {}
  } catch (error) {
    throw new Error(`${file}: invalid YAML frontmatter (${error.message})`)
  }
  if (typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    throw new Error(`${file}: frontmatter must be a mapping`)
  }
  return { frontmatter, body: source.slice(match[0].length) }
}

function toPosix(value) {
  return value.split(path.sep).join("/")
}

function normaliseNoteTarget(value) {
  return decodeURIComponent(value).replace(/\\/g, "/").replace(/^\.\//, "").replace(/\.md$/i, "")
}

export function collectReferences(body) {
  const noteTargets = []
  const assets = []
  for (const match of body.matchAll(WIKILINK)) {
    const target = normaliseNoteTarget(match[2].trim())
    if (match[1] === "!" || path.posix.extname(target)) assets.push(target)
    else noteTargets.push(target)
  }
  for (const match of body.matchAll(MARKDOWN_LINK)) {
    const target = match[1]
    if (/^(?:[a-z]+:|#)/i.test(target)) continue
    const clean = target.split("#")[0].split("?")[0]
    if (!clean) continue
    if (/\.md$/i.test(clean)) noteTargets.push(normaliseNoteTarget(clean))
    else if (path.posix.extname(clean)) assets.push(decodeURIComponent(clean))
  }
  return { noteTargets, assets }
}

function validatePublishedNote(note) {
  const { frontmatter: fm, relative } = note
  const required = ["title", "description", "published", "type"]
  for (const field of required) {
    if (fm[field] === undefined || fm[field] === "")
      throw new Error(`${relative}: missing ${field}`)
  }
  if (!["essay", "note"].includes(fm.type))
    throw new Error(`${relative}: type must be essay or note`)
  if (fm.type === "note" && !["draft", "in-progress", "evergreen"].includes(fm.status)) {
    throw new Error(`${relative}: notes require status draft, in-progress, or evergreen`)
  }
  if (fm.tags !== undefined && !Array.isArray(fm.tags))
    throw new Error(`${relative}: tags must be a list`)
}

function publicMarkdown(note, config) {
  const fm = {}
  for (const key of config.publicFrontmatter) {
    if (note.frontmatter[key] !== undefined) fm[key] = note.frontmatter[key]
  }
  fm.publish = true
  return `---\n${YAML.stringify(fm).trimEnd()}\n---\n\n${note.body.replace(/^\s+/, "")}`
}

async function walk(root) {
  const files = []
  async function visit(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue
      const absolute = path.join(dir, entry.name)
      if (entry.isDirectory()) await visit(absolute)
      else files.push(absolute)
    }
  }
  try {
    await visit(root)
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`Vault not found: ${root}`)
    throw error
  }
  return files
}

function resolveNote(target, fromRelative, pathMap, basenameMap) {
  const fromDir = path.posix.dirname(toPosix(fromRelative))
  const candidates = [
    normaliseNoteTarget(target),
    normaliseNoteTarget(path.posix.join(fromDir, target)),
  ]
  for (const candidate of candidates) if (pathMap.has(candidate)) return pathMap.get(candidate)
  const basename = path.posix.basename(normaliseNoteTarget(target))
  const matches = basenameMap.get(basename) ?? []
  if (matches.length === 1) return matches[0]
  if (matches.length > 1) throw new Error(`${fromRelative}: ambiguous link [[${target}]]`)
  return undefined
}

function safeTarget(root, relative) {
  const resolved = path.resolve(root, relative)
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Reference escapes the vault: ${relative}`)
  }
  return resolved
}

async function copyTree(source, target) {
  for (const file of await walk(source)) {
    const relative = path.relative(source, file)
    const destination = path.join(target, relative)
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.copyFile(file, destination)
  }
}

async function hashFile(file) {
  return crypto
    .createHash("sha256")
    .update(await fs.readFile(file))
    .digest("hex")
}

export async function exportContent(config) {
  const vaultFiles = await walk(config.vault)
  const notes = []
  const pathMap = new Map()
  const basenameMap = new Map()

  for (const absolute of vaultFiles.filter((file) => file.toLowerCase().endsWith(".md"))) {
    const relative = toPosix(path.relative(config.vault, absolute))
    const parsed = parseMarkdown(await fs.readFile(absolute, "utf8"), relative)
    const note = {
      absolute,
      relative,
      ...parsed,
      published: parsed.frontmatter[config.publishField] === true,
    }
    notes.push(note)
    const key = normaliseNoteTarget(relative)
    pathMap.set(key, note)
    const basename = path.posix.basename(key)
    basenameMap.set(basename, [...(basenameMap.get(basename) ?? []), note])
  }

  const published = notes.filter((note) => note.published)
  published.forEach(validatePublishedNote)

  const assetCopies = new Map()
  for (const note of published) {
    const references = collectReferences(note.body)
    for (const target of references.noteTargets) {
      const linked = resolveNote(target, note.relative, pathMap, basenameMap)
      if (!linked) throw new Error(`${note.relative}: unresolved note link [[${target}]]`)
      if (!linked.published)
        throw new Error(`${note.relative}: links to unpublished note ${linked.relative}`)
    }
    for (const target of references.assets) {
      if (!config.copiedAssetExtensions.includes(path.posix.extname(target).toLowerCase())) {
        throw new Error(`${note.relative}: unsupported asset ${target}`)
      }
      const relative = toPosix(
        path.posix.normalize(path.posix.join(path.posix.dirname(note.relative), target)),
      )
      const absolute = safeTarget(config.vault, relative)
      try {
        const stat = await fs.stat(absolute)
        if (!stat.isFile()) throw new Error()
      } catch {
        throw new Error(`${note.relative}: missing asset ${target}`)
      }
      assetCopies.set(relative, absolute)
    }
  }

  const stageRoot = path.join(config.root, ".quartz-cache", `content-export-${process.pid}`)
  const stage = path.join(stageRoot, "content")
  await fs.rm(stageRoot, { recursive: true, force: true })
  await fs.mkdir(stage, { recursive: true })
  await copyTree(config.staticContent, stage)

  for (const note of published) {
    const target = path.join(stage, note.relative)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, publicMarkdown(note, config))
  }
  for (const [relative, absolute] of assetCopies) {
    const target = path.join(stage, relative)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.copyFile(absolute, target)
  }

  const outputFiles = await walk(stage)
  const files = {}
  for (const absolute of outputFiles.sort()) {
    files[toPosix(path.relative(stage, absolute))] = await hashFile(absolute)
  }
  const manifest = {
    version: 1,
    source: "curated-export",
    files,
  }

  const old = `${config.output}.previous-${process.pid}`
  await fs.rm(old, { recursive: true, force: true })
  try {
    await fs.rename(config.output, old)
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  try {
    await fs.rename(stage, config.output)
    await fs.mkdir(path.dirname(config.manifest), { recursive: true })
    await fs.writeFile(config.manifest, `${JSON.stringify(manifest, null, 2)}\n`)
    await fs.rm(old, { recursive: true, force: true })
    await fs.rm(stageRoot, { recursive: true, force: true })
  } catch (error) {
    await fs.rm(config.output, { recursive: true, force: true })
    try {
      await fs.rename(old, config.output)
    } catch {}
    throw error
  }
  return manifest
}

export async function checkContent(config) {
  let manifest
  try {
    manifest = JSON.parse(await fs.readFile(config.manifest, "utf8"))
  } catch {
    throw new Error(`Missing content manifest. Run npm run content:export.`)
  }
  const actualFiles = await walk(config.output)
  const actual = {}
  for (const absolute of actualFiles.sort()) {
    actual[toPosix(path.relative(config.output, absolute))] = await hashFile(absolute)
  }
  const expected = manifest.files ?? {}
  const changed = [...new Set([...Object.keys(actual), ...Object.keys(expected)])].filter(
    (file) => actual[file] !== expected[file],
  )
  if (changed.length)
    throw new Error(`Public content differs from its manifest: ${changed.join(", ")}`)
  return { files: Object.keys(actual).length }
}
