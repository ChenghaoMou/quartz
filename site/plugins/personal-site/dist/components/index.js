import { jsx, jsxs } from "preact/jsx-runtime"
import { formatDate, resolveRelative } from "@quartz-community/utils"

const appearanceScript = String.raw`
(() => {
  const key = "appearance"
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const modes = ["system", "light", "dark"]
  const stored = localStorage.getItem(key)
  const initial = modes.includes(stored) ? stored : "system"
  const apply = (mode, announce = false) => {
    const resolved = mode === "system" ? (media.matches ? "dark" : "light") : mode
    document.documentElement.dataset.appearance = mode
    document.documentElement.setAttribute("saved-theme", resolved)
    document.body?.classList.remove("theme-dark", "theme-light")
    document.body?.classList.add("theme-" + resolved)
    document.querySelectorAll("[data-appearance-toggle]").forEach((button) => {
      button.dataset.mode = mode
      button.setAttribute("aria-label", "Appearance: " + mode + ". Activate for next mode.")
      button.querySelector(".appearance-label").textContent = mode
    })
    if (announce) document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: resolved } }))
  }
  apply(initial)
  const initialise = () => {
    apply(document.documentElement.dataset.appearance || initial)
    document.querySelectorAll("[data-appearance-toggle]").forEach((button) => {
      if (button.dataset.ready) return
      button.dataset.ready = "true"
      const click = () => {
        const current = document.documentElement.dataset.appearance || "system"
        const next = modes[(modes.indexOf(current) + 1) % modes.length]
        localStorage.setItem(key, next)
        apply(next, true)
      }
      button.addEventListener("click", click)
      window.addCleanup?.(() => button.removeEventListener("click", click))
    })
  }
  media.addEventListener("change", () => {
    if ((document.documentElement.dataset.appearance || "system") === "system") apply("system", true)
  })
  document.addEventListener("nav", initialise)
  document.addEventListener("render", initialise)
  if (document.readyState !== "loading") initialise()
})()
`

const Geometry = () =>
  jsxs("svg", {
    class: "hero-geometry",
    viewBox: "0 0 620 420",
    role: "img",
    "aria-label": "A field of dithered circles, lines, and intersecting planes",
    children: [
      jsx("defs", {
        children: jsxs("pattern", {
          id: "dither-dots",
          width: "8",
          height: "8",
          patternUnits: "userSpaceOnUse",
          children: [
            jsx("circle", { cx: "1.4", cy: "1.4", r: "1.25" }),
            jsx("circle", { cx: "5.4", cy: "5.4", r: ".65" }),
          ],
        }),
      }),
      jsx("rect", {
        class: "plane plane-a",
        x: "74",
        y: "44",
        width: "330",
        height: "240",
        rx: "2",
        transform: "rotate(-7 239 164)",
      }),
      jsx("circle", { class: "orb orb-a", cx: "405", cy: "168", r: "118" }),
      jsx("circle", {
        class: "orb orb-b",
        cx: "405",
        cy: "168",
        r: "82",
        fill: "url(#dither-dots)",
      }),
      jsx("path", { class: "axis", d: "M21 315L592 86M56 366L559 366" }),
      jsx("rect", {
        class: "plane plane-b",
        x: "115",
        y: "248",
        width: "245",
        height: "112",
        transform: "skewX(-17)",
      }),
      jsx("circle", { class: "point", cx: "556", cy: "366", r: "9" }),
    ],
  })

export const SiteChrome = () => {
  const Component = ({ fileData }) => {
    const slug = fileData.slug
    return jsxs("div", {
      class: "site-chrome",
      children: [
        jsx("a", {
          class: "site-mark",
          href: resolveRelative(slug, "index"),
          "aria-label": "Sleepless in Debugging, home",
          children: "S/D",
        }),
        jsxs("nav", {
          class: "site-nav",
          "aria-label": "Primary navigation",
          children: [
            jsx("a", { href: resolveRelative(slug, "writing/index"), children: "Writing" }),
            jsx("a", { href: resolveRelative(slug, "tags/index"), children: "Topics" }),
            jsx("a", { href: resolveRelative(slug, "about"), children: "About" }),
          ],
        }),
        jsxs("button", {
          class: "appearance-toggle",
          type: "button",
          "data-appearance-toggle": true,
          "aria-label": "Appearance: system. Activate for next mode.",
          children: [
            jsx("span", { class: "appearance-symbol", "aria-hidden": "true", children: "◐" }),
            jsx("span", { class: "appearance-label", children: "system" }),
          ],
        }),
      ],
    })
  }
  Component.beforeDOMLoaded = appearanceScript
  return Component
}

export const HomeHero = () => {
  const Component = ({ fileData }) => {
    if (fileData.slug !== "index") return null
    return jsxs("section", {
      class: "home-hero",
      "aria-labelledby": "home-title",
      children: [
        jsxs("div", {
          class: "home-intro",
          children: [
            jsx("p", { class: "eyebrow", children: "A personal space for thinking in public" }),
            jsx("h1", { id: "home-title", children: "Sleepless in Debugging" }),
            jsx("p", {
              class: "dek",
              children: "Essays when an idea has settled. Notes while it is still moving.",
            }),
          ],
        }),
        jsx(Geometry, {}),
      ],
    })
  }
  return Component
}

function pageDate(page) {
  return page.dates?.published ?? page.dates?.created ?? page.dates?.modified
}

export const HomeFeed = (options = {}) => {
  const limit = options.limit ?? 24
  const Component = ({ allFiles, fileData, cfg }) => {
    if (fileData.slug !== "index") return null
    const pages = allFiles
      .filter((page) => ["essay", "note"].includes(page.frontmatter?.type))
      .filter((page) => page.frontmatter?.publish === true && page.unlisted !== true)
      .sort((a, b) => (pageDate(b)?.getTime?.() ?? 0) - (pageDate(a)?.getTime?.() ?? 0))
      .slice(0, limit)
    return jsxs("section", {
      class: "home-feed",
      "aria-labelledby": "latest-writing",
      children: [
        jsxs("div", {
          class: "feed-heading",
          children: [
            jsx("h2", { id: "latest-writing", children: "Latest writing" }),
            jsx("span", { children: `${pages.length} pieces` }),
          ],
        }),
        pages.length === 0
          ? jsx("p", {
              class: "empty-feed",
              children: "The first public piece is still being written.",
            })
          : jsx("ol", {
              class: "feed-list",
              children: pages.map((page, index) => {
                const fm = page.frontmatter ?? {}
                const date = pageDate(page)
                return jsxs(
                  "li",
                  {
                    class: "feed-item",
                    children: [
                      jsx("span", {
                        class: "feed-index",
                        "aria-hidden": "true",
                        children: String(index + 1).padStart(2, "0"),
                      }),
                      jsxs("div", {
                        class: "feed-copy",
                        children: [
                          jsxs("div", {
                            class: "feed-meta",
                            children: [
                              jsx("span", { class: `kind kind-${fm.type}`, children: fm.type }),
                              fm.status
                                ? jsx("span", { class: "maturity", children: fm.status })
                                : null,
                              date
                                ? jsx("time", {
                                    dateTime: date.toISOString(),
                                    children: formatDate(date, cfg.locale),
                                  })
                                : null,
                            ],
                          }),
                          jsx("h3", {
                            children: jsx("a", {
                              class: "internal",
                              href: resolveRelative(fileData.slug, page.slug),
                              children: fm.title ?? "Untitled",
                            }),
                          }),
                          fm.description ? jsx("p", { children: fm.description }) : null,
                        ],
                      }),
                      jsx("span", { class: "feed-arrow", "aria-hidden": "true", children: "↗" }),
                    ],
                  },
                  page.slug,
                )
              }),
            }),
      ],
    })
  }
  return Component
}

export const NoteStatus = () => {
  const Component = ({ fileData }) => {
    const fm = fileData.frontmatter ?? {}
    if (fileData.slug === "index" || fm.type !== "note" || !fm.status) return null
    const copy = {
      draft: "An early sketch; the edges are still rough.",
      "in-progress": "A working note that may change as the idea develops.",
      evergreen: "A maintained note, revisited when the idea evolves.",
    }[fm.status]
    return jsxs("aside", {
      class: "note-status",
      children: [jsx("span", { children: fm.status }), jsx("p", { children: copy })],
    })
  }
  return Component
}
