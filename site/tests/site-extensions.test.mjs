import assert from "node:assert/strict"
import test from "node:test"
import { render } from "preact-render-to-string"
import { HomeFeed, NoteStatus } from "../plugins/personal-site/dist/components/index.js"
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
  assert.match(first, /<aside class="sidenote sidenote-numbered"/)
  assert.match(first, /<strong>useful<\/strong>/)
  assert.match(first, /rel="external noopener"/)
})
