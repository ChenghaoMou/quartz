import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import type { IconSvgObject } from "@hugeicons/core-free-icons/types"
import { bind, play, setEnabled, setVolume } from "cuelume"

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"
const STORAGE_KEY = "interaction-sounds-enabled"
const VOLUME = 0.35

const hoverSelectors = [
  ".site-brand",
  ".home-links a",
  ".breadcrumb-container a",
  ".breadcrumbs a",
  "footer a",
]

const toggleSelectors = [".search-button", ".toc-header", ".sidenote-ref"]

let soundsEnabled = readEnabledPreference()

function readEnabledPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "false"
  } catch {
    return true
  }
}

function writeEnabledPreference(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // Storage can be unavailable in strict privacy contexts. Keep the session preference.
  }
}

function toSvgAttribute(name: string): string {
  if (name === "className") return "class"
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

function createHugeIcon(icon: IconSvgObject, className: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg")
  svg.setAttribute("class", className)
  svg.setAttribute("viewBox", "0 0 24 24")
  svg.setAttribute("width", "24")
  svg.setAttribute("height", "24")
  svg.setAttribute("fill", "none")
  svg.setAttribute("aria-hidden", "true")
  svg.setAttribute("focusable", "false")
  svg.dataset.hugeicon = "true"

  for (const [tag, attributes] of icon) {
    const child = document.createElementNS(SVG_NAMESPACE, tag)
    for (const [name, value] of Object.entries(attributes)) {
      if (name === "key") continue
      child.setAttribute(toSvgAttribute(name), String(name === "strokeWidth" ? 1.5 : value))
    }
    svg.append(child)
  }

  return svg
}

function queryIncludingRoot(root: ParentNode, selector: string): Element[] {
  const matches = root instanceof Element && root.matches(selector) ? [root] : []
  return matches.concat(Array.from(root.querySelectorAll(selector)))
}

function replaceControlIcon(
  root: ParentNode,
  controlSelector: string,
  iconSelector: string,
  icon: IconSvgObject,
  className: string,
) {
  for (const control of queryIncludingRoot(root, controlSelector)) {
    const current = control.querySelector(iconSelector)
    if (!(current instanceof SVGElement) || current.dataset.hugeicon === "true") continue
    current.replaceWith(createHugeIcon(icon, className))
  }
}

function markInteractions(root: ParentNode) {
  for (const selector of hoverSelectors) {
    for (const element of queryIncludingRoot(root, selector)) {
      element.setAttribute("data-cuelume-hover", "tick")
    }
  }

  for (const selector of toggleSelectors) {
    for (const element of queryIncludingRoot(root, selector)) {
      element.setAttribute("data-cuelume-toggle", "toggle")
    }
  }
}

function updateSoundControls() {
  for (const button of document.querySelectorAll<HTMLElement>("[data-sound-toggle]")) {
    button.dataset.soundEnabled = String(soundsEnabled)
    button.setAttribute("aria-pressed", String(soundsEnabled))
    button.setAttribute(
      "title",
      soundsEnabled ? "Mute interaction sounds" : "Enable interaction sounds",
    )
  }
}

function enhance(root: ParentNode = document) {
  replaceControlIcon(root, ".search-button", "svg", Search01Icon, "hugeicon hugeicon-search")
  replaceControlIcon(root, ".toc-header", "svg.fold", ArrowDown01Icon, "fold hugeicon hugeicon-toc")
  markInteractions(root)
  updateSoundControls()
}

function toggleSounds() {
  if (soundsEnabled) {
    play("droplet")
    soundsEnabled = false
    setEnabled(false)
  } else {
    soundsEnabled = true
    setEnabled(true)
    play("ready")
  }

  writeEnabledPreference(soundsEnabled)
  updateSoundControls()
}

setVolume(VOLUME)
setEnabled(soundsEnabled)
bind()

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return
  if (event.target.closest("[data-sound-toggle]")) toggleSounds()
})

document.addEventListener("themechange", (event) => {
  const detail = (event as CustomEvent<{ source?: string }>).detail
  if (detail?.source === "user") play("toggle")
})

document.addEventListener("nav", () => enhance())
document.addEventListener("render", () => enhance())

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) enhance(node)
    }
  }
})

observer.observe(document.documentElement, { childList: true, subtree: true })
enhance()
