// @ts-ignore
import script from "./scripts/sidenotesToggle.inline"
import styles from "./styles/sidenotesToggle.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const SidenotesToggle: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <button
      class={classNames(displayClass, "sidenotes-toggle")}
      id="sidenotes-toggle"
      aria-label="Toggle sidenotes visibility"
      style="display: none;"
    >
      {/* Icon when sidenotes are visible (panels with right panel filled) */}
      <svg
        class="showIcon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>Hide Sidenotes</title>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="15" y1="3" x2="15" y2="21" />
        <rect x="15" y="3" width="6" height="18" rx="0" fill="currentColor" opacity="0.3" />
      </svg>
      {/* Icon when sidenotes are hidden (panels with right panel empty) */}
      <svg
        class="hideIcon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <title>Show Sidenotes</title>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    </button>
  )
}

SidenotesToggle.afterDOMLoaded = script
SidenotesToggle.css = styles

export default (() => SidenotesToggle) satisfies QuartzComponentConstructor