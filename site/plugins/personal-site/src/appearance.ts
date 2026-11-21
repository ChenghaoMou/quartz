import { jsx, jsxs } from "preact/jsx-runtime"
import type { QuartzComponent, QuartzComponentConstructor } from "@quartz-community/types"
import { ComputerIcon, HugeIcon, Moon02Icon, Sun01Icon } from "./icons.js"

export const appearanceScript = String.raw`
(() => {
  const key = "appearance"
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const modes = ["light", "system", "dark"]
  const names = { light: "Light", system: "System", dark: "Dark" }
  const stored = localStorage.getItem(key)
  const initial = modes.includes(stored) ? stored : "system"
  const apply = (mode, announce = false, source = "system") => {
    const resolved = mode === "system" ? (media.matches ? "dark" : "light") : mode
    document.documentElement.dataset.appearance = mode
    document.documentElement.setAttribute("saved-theme", resolved)
    document.body?.classList.remove("theme-dark", "theme-light")
    document.body?.classList.add("theme-" + resolved)
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const next = modes[(modes.indexOf(mode) + 1) % modes.length]
      button.dataset.mode = mode
      button.setAttribute("aria-label", "Colour scheme: " + names[mode] + ". Switch to " + names[next] + ".")
      button.setAttribute("title", names[mode] + " colour scheme · switch to " + names[next])
    })
    if (announce) {
      document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: resolved, source } }))
    }
  }
  apply(initial)
  const cycle = () => {
    const current = document.documentElement.dataset.appearance || "system"
    const next = modes[(modes.indexOf(current) + 1) % modes.length]
    localStorage.setItem(key, next)
    apply(next, true, "user")
  }
  const initialise = () => {
    apply(document.documentElement.dataset.appearance || initial)
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      if (button.dataset.ready) return
      button.dataset.ready = "true"
      button.addEventListener("click", cycle)
      window.addCleanup?.(() => {
        button.removeEventListener("click", cycle)
        delete button.dataset.ready
      })
    })
  }
  media.addEventListener("change", () => {
    if ((document.documentElement.dataset.appearance || "system") === "system") {
      apply("system", true, "system")
    }
  })
  document.addEventListener("nav", initialise)
  document.addEventListener("render", initialise)
  if (document.readyState !== "loading") initialise()
})()
`

const modeIcons = [
  ["light", Sun01Icon],
  ["system", ComputerIcon],
  ["dark", Moon02Icon],
] as const

export function ThemeToggleButton() {
  return jsxs("button", {
    class: "theme-toggle",
    type: "button",
    "data-theme-toggle": true,
    "data-mode": "system",
    "aria-label": "Colour scheme: System. Switch to Dark.",
    title: "System colour scheme · switch to Dark",
    children: modeIcons.map(([mode, icon]) =>
      jsx(HugeIcon, { class: `theme-icon theme-icon-${mode}`, icon, size: 18 }),
    ),
  })
}

export const ThemeToggle: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = () => jsx(ThemeToggleButton, {})
  Component.beforeDOMLoaded = appearanceScript
  return Component
}
