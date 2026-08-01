import crypto from "node:crypto"
import type { QuartzTransformerPlugin } from "@quartz-community/types"

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character)
}

function inlineMarkdown(value: string) {
  const escaped = escapeHtml(value)
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="external noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
}

function render(
  kind: "margin" | "numbered",
  anchor: string,
  note: string,
  id: string,
  number: number,
) {
  const marker = kind === "margin" ? "✦" : String(number)
  const label = kind === "margin" ? "Open margin note" : `Open sidenote ${number}`
  const className = `sidenote sidenote-${kind}`
  const reference = `<button class="sidenote-ref" type="button" aria-expanded="false" aria-pressed="false" aria-controls="${id}" aria-label="${label}">${marker}</button>`
  const aside = `<aside class="${className}" id="${id}" role="note"><span class="sidenote-number" aria-hidden="true">${marker}</span>${inlineMarkdown(note)}</aside>`
  return `${anchor ? `<span class="sidenote-anchor">${inlineMarkdown(anchor)}</span>` : ""}${reference}${aside}`
}

export const Sidenotes: QuartzTransformerPlugin = () => ({
  name: "Sidenotes",
  textTransform(_ctx, source) {
    const prefix = crypto.createHash("sha1").update(source).digest("hex").slice(0, 7)
    const noteContent = String.raw`(?:[^\[\]\n]|\[[^\]\n]+\]\([^)]+\))+`
    const notePattern = new RegExp(
      String.raw`(?:\[([^\]\n]+)\]\^\[(${noteContent})\]|\^\[(${noteContent})\]|\+\[(${noteContent})\])`,
      "g",
    )
    let number = 0
    return source.replace(notePattern, (_match, anchor, anchoredNote, plainNote, marginNote) => {
      number += 1
      const note = anchoredNote ?? plainNote ?? marginNote
      const kind = marginNote === undefined ? "numbered" : "margin"
      return render(kind, anchor ?? "", note, `sn-${prefix}-${number}`, number)
    })
  },
  externalResources() {
    return {
      js: [
        {
          loadTime: "afterDOMReady",
          contentType: "inline",
          script: String.raw`
const sidenoteDesktop = window.matchMedia("(min-width: 72rem)")
const sidenoteReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

const clearSidenoteTarget = () => {
  document
    .querySelectorAll(".sidenote.is-targeted")
    .forEach((item) => item.classList.remove("is-targeted"))
  document.querySelectorAll(".sidenote-ref.is-targeted").forEach((item) => {
    item.classList.remove("is-targeted")
    item.setAttribute("aria-pressed", "false")
  })
}

const syncSidenotes = () => {
  document.querySelectorAll(".sidenote-ref").forEach((button) => {
    const note = document.getElementById(button.getAttribute("aria-controls"))
    if (!note) return
    const expanded = sidenoteDesktop.matches || note.classList.contains("is-open")
    button.setAttribute("aria-expanded", String(expanded))
  })
}

const activateSidenote = (button) => {
  const note = document.getElementById(button.getAttribute("aria-controls"))
  if (!note) return

  const open = sidenoteDesktop.matches || !note.classList.contains("is-open")
  clearSidenoteTarget()

  if (!sidenoteDesktop.matches) {
    note.classList.toggle("is-open", open)
  }
  button.setAttribute("aria-expanded", String(open))

  if (!open) return
  button.classList.add("is-targeted")
  button.setAttribute("aria-pressed", "true")
  note.classList.add("is-targeted")
  note.scrollIntoView({
    behavior: sidenoteReducedMotion.matches ? "auto" : "smooth",
    block: "nearest",
  })
}

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.(".sidenote-ref")
  if (button) activateSidenote(button)
})
document.addEventListener("nav", syncSidenotes)
document.addEventListener("render", syncSidenotes)
sidenoteDesktop.addEventListener?.("change", syncSidenotes)
syncSidenotes()
`,
        },
      ],
    }
  },
})
