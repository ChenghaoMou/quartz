import { readFileSync } from "node:fs"
import { jsx, jsxs } from "preact/jsx-runtime"
import type { QuartzComponent, QuartzComponentConstructor } from "@quartz-community/types"
import { HugeIcon, VolumeHighIcon, VolumeMute01Icon } from "./icons.js"

const interactionSoundScript = readFileSync(
  new URL("./client/interaction-sounds.bundle.js", import.meta.url),
  "utf8",
)

export const InteractionSounds: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = () =>
    jsxs("button", {
      class: "interaction-sounds",
      type: "button",
      "data-sound-toggle": "true",
      "data-sound-enabled": "true",
      "aria-label": "Interaction sounds",
      "aria-pressed": "true",
      title: "Mute interaction sounds",
      children: [
        jsx(HugeIcon, {
          class: "sound-icon sound-icon-on",
          icon: VolumeHighIcon,
          size: 18,
        }),
        jsx(HugeIcon, {
          class: "sound-icon sound-icon-off",
          icon: VolumeMute01Icon,
          size: 18,
        }),
      ],
    })

  Component.afterDOMLoaded = interactionSoundScript
  return Component
}
