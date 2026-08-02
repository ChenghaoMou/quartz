import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import vm from "node:vm"
import { render } from "preact-render-to-string"
import YAML from "yaml"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { DeduplicateTitle } from "../plugins/deduplicate-title/dist/index.js"
import {
  AppearancePull,
  HomeFeed,
  HugeIcon,
  InteractionSounds,
  NoteStatus,
} from "../plugins/personal-site/dist/components/index.js"
import { AliasRedirects } from "../plugins/safe-alias-redirects/dist/index.js"
import { Sidenotes } from "../plugins/sidenotes/dist/index.js"

const baseProps = {
  cfg: { locale: "en-GB" },
  fileData: { slug: "index", frontmatter: {} },
  allFiles: [],
}

function transformRenderedTitle(tree, title) {
  const transformer = DeduplicateTitle().htmlPlugins({})[0]()
  transformer(tree, { data: { frontmatter: { title } } })
}

test("matching frontmatter and leading Markdown titles render only once", () => {
  const tree = {
    type: "root",
    children: [
      { type: "text", value: "\n" },
      {
        type: "element",
        tagName: "h1",
        properties: {},
        children: [
          { type: "text", value: "Colophon " },
          {
            type: "element",
            tagName: "em",
            properties: {},
            children: [{ type: "text", value: "notes" }],
          },
        ],
      },
      {
        type: "element",
        tagName: "p",
        properties: {},
        children: [{ type: "text", value: "The body remains." }],
      },
    ],
  }

  transformRenderedTitle(tree, "Colophon notes")

  assert.deepEqual(
    tree.children.filter((child) => child.type === "element").map((child) => child.tagName),
    ["p"],
  )
})

test("distinct or non-leading Markdown headings remain in the rendered note", () => {
  const distinct = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "h1",
        properties: {},
        children: [{ type: "text", value: "How this site works" }],
      },
    ],
  }
  transformRenderedTitle(distinct, "Colophon")
  assert.equal(distinct.children[0].tagName, "h1")

  const nonLeading = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "p",
        properties: {},
        children: [{ type: "text", value: "Introduction" }],
      },
      {
        type: "element",
        tagName: "h1",
        properties: {},
        children: [{ type: "text", value: "Colophon" }],
      },
    ],
  }
  transformRenderedTitle(nonLeading, "Colophon")
  assert.equal(nonLeading.children[1].tagName, "h1")
})

test("publishing policy keeps the external repository's private folders out of the build", async () => {
  const config = YAML.parse(await fs.readFile("quartz.config.yaml", "utf8"))
  const ignored = new Set(config.configuration.ignorePatterns)
  for (const pattern of [
    "private",
    "templates",
    ".obsidian",
    "4archives",
    "journal",
    "public",
    "boilerplates",
    "inbox",
    "highlights/Archive",
    "**/__order__.md",
  ]) {
    assert.equal(ignored.has(pattern), true, `missing ignored content pattern: ${pattern}`)
  }

  const plugin = (source) => config.plugins.find((candidate) => candidate.source === source)
  assert.equal(plugin("@quartz-community/remove-draft").enabled, true)
  assert.equal(plugin("@quartz-community/explicit-publish").enabled, false)
})

test("home feed includes writing from the external repository without publish flags", () => {
  const Feed = HomeFeed()
  const html = render(
    Feed({
      ...baseProps,
      allFiles: [
        {
          slug: "notes/public-note",
          dates: {
            created: new Date("2020-07-01"),
            published: new Date("2026-07-01"),
          },
          frontmatter: {
            title: "Public note",
            description: "A thought in motion.",
          },
        },
        { slug: "posts/index", frontmatter: { title: "Posts" } },
        { slug: "about", frontmatter: { publish: true, type: "page", title: "About" } },
      ],
    }),
  )
  assert.match(html, /Public note/)
  assert.match(html, /01 Jul 2020/)
  assert.doesNotMatch(html, />Posts</)
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

test("Hugeicons render as decorative, current-colour SVGs", () => {
  const html = render(HugeIcon({ icon: Search01Icon, class: "test-icon", size: 18 }))

  assert.match(html, /class="test-icon"/)
  assert.match(html, /viewBox="0 0 24 24"/)
  assert.match(html, /width="18"/)
  assert.match(html, /height="18"/)
  assert.match(html, /fill="none"/)
  assert.match(html, /aria-hidden="true"/)
  assert.match(html, /focusable="false"/)
  assert.match(html, /stroke="currentColor"/)
  assert.match(html, /stroke-width="1.5"/)
})

test("interaction sounds render an accessible persisted header control", async () => {
  const Sounds = InteractionSounds()
  const html = render(Sounds(baseProps))

  assert.match(html, /class="interaction-sounds"/)
  assert.match(html, /data-sound-toggle="true"/)
  assert.match(html, /data-sound-enabled="true"/)
  assert.match(html, /aria-label="Interaction sounds"/)
  assert.match(html, /aria-pressed="true"/)
  assert.match(html, /sound-icon-on/)
  assert.match(html, /sound-icon-off/)
  assert.match(Sounds.afterDOMLoaded, /interaction-sounds-enabled/)
  assert.doesNotMatch(Sounds.afterDOMLoaded, /\bimport\s*(?:\(|[{'"*])/)
  assert.doesNotMatch(Sounds.afterDOMLoaded, /\bReact\b/)

  const manifest = JSON.parse(await fs.readFile("site/plugins/personal-site/package.json", "utf8"))
  assert.equal(manifest.quartz.components.InteractionSounds.defaultPosition, "header")
  assert.equal(manifest.quartz.components.InteractionSounds.defaultPriority, 30)

  const config = YAML.parse(await fs.readFile("quartz.config.yaml", "utf8"))
  const registration = config.plugins.find(
    (candidate) => candidate.source?.name === "InteractionSounds",
  )
  assert.equal(registration.enabled, true)
  assert.equal(registration.layout.position, "header")
  assert.equal(registration.layout.priority, 30)
})

test("hover sounds stay in navigation chrome and out of reading surfaces", async () => {
  const source = await fs.readFile(
    "site/plugins/personal-site/src/client/interaction-sounds.ts",
    "utf8",
  )

  assert.match(source, /"\.site-brand"/)
  assert.match(source, /"\.home-links a"/)
  assert.match(source, /"\.breadcrumb-container a"/)
  assert.match(source, /"footer a"/)
  assert.doesNotMatch(source, /"\.feed-line a"/)
  assert.doesNotMatch(source, /"\.toc a"/)
  assert.doesNotMatch(source, /"\.backlinks a"/)
  assert.doesNotMatch(source, /"\.search-layout \.result-card"/)
  assert.doesNotMatch(source, /"\.search-layout \.tag-suggestion-item"/)
})

test("appearance events distinguish user changes from system changes", () => {
  const Appearance = AppearancePull()
  const script = Appearance.beforeDOMLoaded

  assert.match(script, /detail: \{ theme: resolved, source \}/)
  assert.match(script, /apply\(next, true, "user"\)/)
  assert.match(script, /apply\("system", true, "system"\)/)
})

test("sound control sits above the unchanged wide-screen pull switch", async () => {
  const headerStyles = await fs.readFile("site/styles/site/_header.scss", "utf8")
  const responsiveStyles = await fs.readFile("site/styles/site/_responsive.scss", "utf8")

  assert.match(
    headerStyles,
    /\.interaction-sounds \.sound-icon \{[^}]*width: 1rem;[^}]*height: 1rem;/s,
  )
  assert.match(
    headerStyles,
    /\.page-header > header > \.search > \.search-button svg \{[^}]*width: 1rem;[^}]*height: 1rem;/s,
  )
  assert.match(responsiveStyles, /grid-template-columns: minmax\(8rem, 1fr\) 3\.75rem 3\.75rem;/)
  assert.match(responsiveStyles, /grid-template-areas: "brand search theme";/)
  assert.match(
    responsiveStyles,
    /\.interaction-sounds \{[^}]*z-index: 4;[^}]*grid-area: theme;[^}]*width: 3\.75rem;/s,
  )
  assert.match(responsiveStyles, /\.appearance-pull-sidebar \{[^}]*top: calc\(100% \+ 0\.25rem\);/s)
})

test("collapsed TOC keeps a wrapped disclosure heading visible", async () => {
  const responsiveStyles = await fs.readFile("site/styles/site/_responsive.scss", "utf8")

  assert.match(responsiveStyles, /\.page \.toc \{[^}]*overflow-x: hidden;/s)
  assert.match(responsiveStyles, /\.page \.toc \.toc-content \{[^}]*overflow-x: hidden;/s)
  assert.match(
    responsiveStyles,
    /\.page \.toc:has\(button\.toc-header\.collapsed\) \{[^}]*flex: 0 0 auto;/s,
  )
  assert.match(
    responsiveStyles,
    /\.page \.toc button\.toc-header\.collapsed \+ \.toc-content \{[^}]*display: none;/s,
  )
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

test("sidenote targeting fades immediately and slowly", async () => {
  const supportingStyles = await fs.readFile("site/styles/site/_supporting.scss", "utf8")
  const responsiveStyles = await fs.readFile("site/styles/site/_responsive.scss", "utf8")

  assert.match(
    supportingStyles,
    /\.sidenote-ref\.is-targeted \{[^}]*animation: sidenote-ref-highlight 1800ms ease-out forwards;/s,
  )
  assert.match(
    supportingStyles,
    /\.sidenote\.is-targeted \{[^}]*animation: sidenote-highlight 1800ms ease-out forwards;/s,
  )
  assert.match(supportingStyles, /@keyframes sidenote-ref-highlight/)
  assert.match(supportingStyles, /@keyframes sidenote-highlight/)
  assert.match(
    supportingStyles,
    /\.sidenote \{[^}]*--sidenote-idle-background: var\(--paper-2\);[^}]*background: var\(--sidenote-idle-background\);/s,
  )
  assert.match(
    supportingStyles,
    /@keyframes sidenote-highlight \{.*?to \{[^}]*background: var\(--sidenote-idle-background\);/s,
  )
  assert.match(
    responsiveStyles,
    /@media \(min-width: 72rem\) \{.*?\.sidenote \{[^}]*--sidenote-idle-background: transparent;/s,
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
  let targetTimeout
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
    clearTimeout: () => {
      targetTimeout = undefined
    },
    matchMedia: (query) => ({
      addEventListener: () => {},
      matches: query === "(min-width: 72rem)",
      removeEventListener: () => {},
    }),
    setTimeout: (callback, delay) => {
      targetTimeout = { callback, delay }
      return 1
    },
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

  assert.equal(targetTimeout.delay, 1800)
  targetTimeout.callback()
  assert.equal(note.classList.contains("is-targeted"), false)
  assert.equal(button.classList.contains("is-targeted"), false)
  assert.equal(attributes.get("aria-pressed"), "false")

  documentListeners.get("click")({ target: button })
  documentListeners.get("click")({ target: { closest: () => null } })
  assert.equal(note.classList.contains("is-targeted"), false)
  assert.equal(button.classList.contains("is-targeted"), false)

  documentListeners.get("click")({ target: button })
  documentListeners.get("click")({ target: button })
  assert.equal(note.classList.contains("is-targeted"), false)
  assert.equal(button.classList.contains("is-targeted"), false)
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
