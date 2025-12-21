/**
 * Tufte-style Sidenotes Transformer
 *
 * Transforms inline markdown syntax into margin sidenotes inspired by Tufte CSS.
 * Supports three types of sidenotes:
 *
 * 1. Numbered sidenotes: ^[content] - displays superscript number inline, numbered content in margin
 * 2. Highlighted spans: [text]^[content] - highlights text, shows unnumbered content in margin
 * 3. Margin notes: {> content} - displays ⊕ symbol inline, unnumbered content in margin
 *
 * On wide screens (≥1100px), sidenotes float in the right margin.
 * On narrow screens, sidenotes are hidden until toggled via clicking the reference.
 */

import { JSResource } from "../../util/resources"
import { QuartzTransformerPlugin } from "../types"
// @ts-ignore
import sidenoteScript from "../../components/scripts/sidenotes.inline"

export interface Options {
  enableSidenotes: boolean
}

const defaultOptions: Options = {
  enableSidenotes: true,
}

// Patterns support one level of nested brackets for markdown links inside sidenotes
const nestedBracketContent = "(?:[^\\[\\]]|\\[[^\\]]*\\])+"
const highlightedSidenoteRegex = new RegExp(
  `\\[(${nestedBracketContent})\\]\\^\\[(${nestedBracketContent})\\]`,
  "g",
)
const numberedSidenoteRegex = new RegExp(`(?<!\\])\\^\\[(${nestedBracketContent})\\]`, "g")
const marginNoteRegex = /\{>\s*([^}]+)\}/g

interface SidenoteMatch {
  index: number
  length: number
  type: "highlighted" | "numbered" | "margin"
  text?: string
  content: string
}

export const Sidenotes: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "Sidenotes",
    textTransform(_ctx, src) {
      if (!opts.enableSidenotes) {
        return src
      }

      const matches: SidenoteMatch[] = []

      let match
      highlightedSidenoteRegex.lastIndex = 0
      while ((match = highlightedSidenoteRegex.exec(src)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: "highlighted",
          text: match[1],
          content: match[2],
        })
      }

      numberedSidenoteRegex.lastIndex = 0
      while ((match = numberedSidenoteRegex.exec(src)) !== null) {
        const overlaps = matches.some(
          (m) => match!.index >= m.index && match!.index < m.index + m.length,
        )
        if (!overlaps) {
          matches.push({
            index: match.index,
            length: match[0].length,
            type: "numbered",
            content: match[1],
          })
        }
      }

      marginNoteRegex.lastIndex = 0
      while ((match = marginNoteRegex.exec(src)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: "margin",
          content: match[1],
        })
      }

      matches.sort((a, b) => a.index - b.index)

      let result = src
      let sidenoteNum = 0
      let marginNoteNum = 0

      for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i]
        let replacement: string

        if (m.type === "highlighted") {
          const id = `hs-${i}`
          replacement = `<label for="${id}" class="sidenote-highlight">${m.text}</label><input type="checkbox" id="${id}" class="margin-toggle"/><span class="sidenote sidenote-unnumbered">${m.content}</span>`
        } else if (m.type === "numbered") {
          sidenoteNum = matches.slice(0, i + 1).filter((x) => x.type === "numbered").length
          const id = `sn-${sidenoteNum}`
          replacement = `<label for="${id}" class="margin-toggle sidenote-number" data-sidenote-num="${sidenoteNum}"></label><input type="checkbox" id="${id}" class="margin-toggle"/><span class="sidenote" data-sidenote-num="${sidenoteNum}">${m.content}</span>`
        } else {
          marginNoteNum = matches.slice(0, i + 1).filter((x) => x.type === "margin").length
          const id = `mn-${marginNoteNum}`
          replacement = `<label for="${id}" class="margin-toggle">&#8853;</label><input type="checkbox" id="${id}" class="margin-toggle"/><span class="marginnote">${m.content}</span>`
        }

        result = result.slice(0, m.index) + replacement + result.slice(m.index + m.length)
      }

      return result
    },
    externalResources() {
      if (!opts.enableSidenotes) {
        return { js: [], css: [] }
      }

      const js: JSResource[] = [
        {
          script: sidenoteScript,
          loadTime: "afterDOMReady",
          contentType: "inline",
        },
      ]

      return { js, css: [] }
    },
  }
}
