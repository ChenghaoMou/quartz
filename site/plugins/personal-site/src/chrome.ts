import { jsx, jsxs } from "preact/jsx-runtime"
import type { FullSlug, QuartzComponent, QuartzComponentConstructor } from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils"
import { appearanceScript, PullSwitch } from "./appearance.js"

const DitherSigil = () =>
  jsx("span", {
    class: "site-sigil",
    "aria-hidden": "true",
    children: Array.from({ length: 9 }, (_, index) => jsx("i", {}, String(index))),
  })

export const SiteChrome: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData }) => {
    const slug = (typeof fileData.slug === "string" ? fileData.slug : "index") as FullSlug

    return jsxs("div", {
      class: "site-chrome",
      children: [
        jsxs("a", {
          class: "site-brand",
          href: resolveRelative(slug, "index" as FullSlug),
          "aria-label": "Sleepless in Debugging, home",
          "aria-current": slug === "index" ? "page" : undefined,
          children: [
            jsx(DitherSigil, {}),
            jsxs("span", {
              class: "site-name",
              children: [
                jsx("strong", { children: "Sleepless" }),
                jsx("span", { children: "in Debugging" }),
              ],
            }),
          ],
        }),
        jsx("div", {
          class: "site-switch-mount",
          children: jsx(PullSwitch, { placement: "sidebar" }),
        }),
        jsx(PullSwitch, { placement: "compact" }),
      ],
    })
  }

  Component.beforeDOMLoaded = appearanceScript
  return Component
}
