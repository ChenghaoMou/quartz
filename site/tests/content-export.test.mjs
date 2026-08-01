import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import {
  checkContent,
  collectReferences,
  exportContent,
  parseMarkdown,
} from "../scripts/lib/content-export.mjs"

function config(root) {
  return {
    root,
    vault: path.join(root, "vault"),
    output: path.join(root, "content"),
    staticContent: path.join(root, "static"),
    manifest: path.join(root, "manifest.json"),
    publishField: "publish",
    publicFrontmatter: ["title", "description", "published", "type", "status", "tags"],
    copiedAssetExtensions: [".png"],
  }
}

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "quartz-export-test-"))
  await fs.mkdir(path.join(root, "vault"), { recursive: true })
  await fs.mkdir(path.join(root, "static"), { recursive: true })
  await fs.writeFile(path.join(root, "static", "index.md"), "static")
  return root
}

test("parses frontmatter and finds local references", () => {
  const parsed = parseMarkdown("---\ntitle: Hello\n---\nSee [[World]] and ![[image.png]].")
  assert.equal(parsed.frontmatter.title, "Hello")
  assert.deepEqual(collectReferences(parsed.body), {
    noteTargets: ["World"],
    assets: ["image.png"],
  })
})

test("exports only published notes and strips private fields", async (t) => {
  const root = await fixture()
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.writeFile(
    path.join(root, "vault", "public.md"),
    "---\ntitle: Public\ndescription: Visible\npublished: 2026-01-01\ntype: note\nstatus: in-progress\npublish: true\nprivate-key: secret\n---\nHello.",
  )
  await fs.writeFile(path.join(root, "vault", "private.md"), "---\npublish: false\n---\nNope.")

  const manifest = await exportContent(config(root))
  const output = await fs.readFile(path.join(root, "content", "public.md"), "utf8")
  assert.match(output, /publish: true/)
  assert.doesNotMatch(output, /private-key|secret/)
  assert.equal(manifest.files["private.md"], undefined)
  assert.deepEqual(await checkContent(config(root)), { files: 2 })
})

test("rejects a public note that links to an unpublished note", async (t) => {
  const root = await fixture()
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.writeFile(
    path.join(root, "vault", "public.md"),
    "---\ntitle: Public\ndescription: Visible\npublished: 2026-01-01\ntype: essay\npublish: true\n---\nSee [[private]].",
  )
  await fs.writeFile(
    path.join(root, "vault", "private.md"),
    "---\ntitle: Private\npublish: false\n---\nNope.",
  )

  await assert.rejects(exportContent(config(root)), /links to unpublished note/)
})

test("copies assets referenced by published notes", async (t) => {
  const root = await fixture()
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.writeFile(path.join(root, "vault", "plot.png"), "pixels")
  await fs.writeFile(
    path.join(root, "vault", "public.md"),
    "---\ntitle: Public\ndescription: Visible\npublished: 2026-01-01\ntype: essay\npublish: true\n---\n![[plot.png]]",
  )
  await exportContent(config(root))
  assert.equal(await fs.readFile(path.join(root, "content", "plot.png"), "utf8"), "pixels")
})
