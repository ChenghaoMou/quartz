import { readFileSync } from "node:fs"
import type { QuartzComponent, QuartzComponentConstructor } from "@quartz-community/types"

const parkBreezeScript = readFileSync(
  new URL("./client/park-breeze.bundle.js", import.meta.url),
  "utf8",
)

// Renders nothing; its script animates the Herbert Park picture behind the footer.
export const ParkBreeze: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = () => null
  Component.afterDOMLoaded = parkBreezeScript
  return Component
}
