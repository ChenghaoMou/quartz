import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import vm from "node:vm"
import { render } from "preact-render-to-string"
import { HomeFeed, NoteStatus } from "../plugins/personal-site/dist/components/index.js"
import { AliasRedirects } from "../plugins/safe-alias-redirects/dist/index.js"
import { Sidenotes } from "../plugins/sidenotes/dist/index.js"

const baseProps = {
  cfg: { locale: "en-GB" },
  fileData: { slug: "index", frontmatter: {} },
  allFiles: [],
}

test("home feed includes public essays and notes but not pages", () => {
  const Feed = HomeFeed()
  const html = render(
    Feed({
      ...baseProps,
      allFiles: [
        {
          slug: "public-note",
          dates: { published: new Date("2026-07-01") },
          frontmatter: {
            publish: true,
            type: "note",
            status: "in-progress",
            title: "Public note",
            description: "A thought in motion.",
          },
        },
        { slug: "about", frontmatter: { publish: true, type: "page", title: "About" } },
      ],
    }),
  )
  assert.match(html, /Public note/)
  assert.match(html, /in-progress/)
  assert.doesNotMatch(html, />About</)
})

test("note maturity renders only on notes", () => {
  const Status = NoteStatus()
  const html = render(
    Status({
      ...baseProps,
      fileData: { slug: "working", frontmatter: { type: "note", status: "evergreen" } },
    }),
  )
  assert.match(html, /evergreen/)
  assert.match(html, /maintained note/)
})

test("sidenotes emit semantic controls with deterministic ids", () => {
  const plugin = Sidenotes()
  const source = "A sentence^[A **useful** aside with [a source](https://example.com).]"
  const first = plugin.textTransform({}, source)
  const second = plugin.textTransform({}, source)
  assert.equal(first, second)
  assert.match(first, /<button class="sidenote-ref"/)
  assert.match(first, /aria-controls="sn-[a-f0-9]{7}-1"/)
  assert.match(first, /aria-pressed="false"/)
  assert.match(first, /<aside class="sidenote sidenote-numbered"/)
  assert.match(first, /<strong>useful<\/strong>/)
  assert.match(first, /rel="external noopener"/)
})

test("sidenotes number mixed syntaxes in source order", () => {
  const output = Sidenotes().textTransform(
    {},
    "Earlier^[first note]. Later [anchored text]^[second note].",
  )

  assert.match(output, /Earlier<button[^>]+>1<\/button>/)
  assert.match(
    output,
    /Later <span class="sidenote-anchor">anchored text<\/span><button[^>]+>2<\/button>/,
  )
})

test("clicking a sidenote reference targets and locates its controlled note", () => {
  const listeners = new Map()
  const documentListeners = new Map()
  const classList = (initial = []) => {
    const values = new Set(initial)
    return {
      add: (...names) => names.forEach((name) => values.add(name)),
      contains: (name) => values.has(name),
      remove: (...names) => names.forEach((name) => values.delete(name)),
      toggle: (name, force) => (force ? values.add(name) : values.delete(name)),
    }
  }
  let scrollOptions
  const note = {
    classList: classList(["sidenote"]),
    scrollIntoView: (options) => {
      scrollOptions = options
    },
  }
  const attributes = new Map([
    ["aria-controls", "sn-example-1"],
    ["aria-expanded", "false"],
    ["aria-pressed", "false"],
  ])
  const button = {
    classList: classList(["sidenote-ref"]),
    dataset: {},
    addEventListener: (type, listener) => listeners.set(type, listener),
    closest: (selector) => (selector === ".sidenote-ref" ? button : null),
    getAttribute: (name) => attributes.get(name),
    removeEventListener: (type, listener) => {
      if (listeners.get(type) === listener) listeners.delete(type)
    },
    setAttribute: (name, value) => attributes.set(name, value),
  }
  const document = {
    addEventListener: (type, listener) => documentListeners.set(type, listener),
    getElementById: () => note,
    querySelectorAll: (selector) => {
      if (selector === ".sidenote-ref") return [button]
      if (selector === ".sidenote.is-targeted") {
        return note.classList.contains("is-targeted") ? [note] : []
      }
      if (selector === ".sidenote-ref.is-targeted") {
        return button.classList.contains("is-targeted") ? [button] : []
      }
      return []
    },
  }
  const window = {
    matchMedia: (query) => ({
      addEventListener: () => {},
      matches: query === "(min-width: 72rem)",
      removeEventListener: () => {},
    }),
  }

  const script = Sidenotes().externalResources().js[0].script
  vm.runInNewContext(script, { document, window })

  documentListeners.get("nav")()
  documentListeners.get("click")({ target: button })

  assert.equal(note.classList.contains("is-targeted"), true)
  assert.equal(button.classList.contains("is-targeted"), true)
  assert.equal(attributes.get("aria-pressed"), "true")
  assert.equal(scrollOptions.behavior, "smooth")
  assert.equal(scrollOptions.block, "nearest")
})

test("alias redirects never overwrite their canonical page", async (t) => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "quartz-alias-test-"))
  t.after(() => fs.rm(output, { recursive: true, force: true }))

  const plugin = AliasRedirects({ enableCaseRedirects: false })
  const content = [
    [
      {},
      {
        data: {
          slug: "colophon",
          aliases: ["colophon", "about", "about-this-site"],
        },
      },
    ],
    [{}, { data: { slug: "about", aliases: [] } }],
  ]

  for await (const _emitted of plugin.emit({ argv: { output } }, content)) {
    // Exhaust the emitter so redirect files are written.
  }

  await assert.rejects(fs.access(path.join(output, "colophon.html")))
  await assert.rejects(fs.access(path.join(output, "about.html")))
  assert.match(
    await fs.readFile(path.join(output, "about-this-site.html"), "utf8"),
    /url=.\/colophon/,
  )
})
