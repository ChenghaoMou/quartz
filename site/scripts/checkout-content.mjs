import { existsSync, lstatSync } from "node:fs"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"
import process from "node:process"

const CONTENT_REMOTE = "https://codeberg.org/Chenghao2023/blog.git"
const root = resolve(import.meta.dirname, "../..")
const content = resolve(root, "content")

function runGit(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" })
  if (result.status !== 0) {
    process.stderr.write(result.stderr)
    process.exit(result.status ?? 1)
  }
  return result.stdout.trim()
}

if (existsSync(resolve(content, "index.md"))) {
  const revision = runGit(["-C", content, "rev-parse", "--short", "HEAD"])
  console.log(`Using existing content checkout (${revision}).`)
  process.exit(0)
}

if (existsSync(content) || lstatSync(content, { throwIfNoEntry: false })) {
  console.error("content exists but has no index.md; refusing to replace it automatically.")
  process.exit(1)
}

const result = spawnSync("git", ["clone", "--depth", "1", CONTENT_REMOTE, content], {
  cwd: root,
  stdio: "inherit",
})
if (result.status !== 0) process.exit(result.status ?? 1)

const revision = runGit(["-C", content, "rev-parse", "--short", "HEAD"])
console.log(`Checked out published content (${revision}).`)
