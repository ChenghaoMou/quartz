import { jsx } from "preact/jsx-runtime"
import type { IconSvgObject } from "@hugeicons/core-free-icons/types"

export { default as ComputerIcon } from "@hugeicons/core-free-icons/ComputerIcon"
export { default as Moon02Icon } from "@hugeicons/core-free-icons/Moon02Icon"
export { default as Sun01Icon } from "@hugeicons/core-free-icons/Sun01Icon"
export { default as VolumeHighIcon } from "@hugeicons/core-free-icons/VolumeHighIcon"
export { default as VolumeMute01Icon } from "@hugeicons/core-free-icons/VolumeMute01Icon"

export type HugeIconData = IconSvgObject

type HugeIconProps = {
  icon: HugeIconData
  class?: string
  size?: number
  strokeWidth?: number
}

type HugeIconPathsProps = {
  icon: HugeIconData
  strokeWidth?: number
  vectorEffect?: "non-scaling-stroke"
}

export function HugeIconPaths({ icon, strokeWidth = 1.5, vectorEffect }: HugeIconPathsProps) {
  return icon.map(([tag, attributes], index) =>
    jsx(tag, {
      ...attributes,
      key: attributes.key ?? String(index),
      strokeWidth,
      vectorEffect,
    }),
  )
}

export function HugeIcon({ icon, class: className, size = 20, strokeWidth = 1.5 }: HugeIconProps) {
  return jsx("svg", {
    class: className,
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    "aria-hidden": "true",
    focusable: "false",
    children: jsx(HugeIconPaths, { icon, strokeWidth }),
  })
}
