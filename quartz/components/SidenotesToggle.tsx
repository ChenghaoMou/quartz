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
      <span class="hideText">Hide Sidenotes</span>
      <span class="showText">Show Sidenotes</span>
    </button>
  )
}

SidenotesToggle.afterDOMLoaded = script
SidenotesToggle.css = styles

export default (() => SidenotesToggle) satisfies QuartzComponentConstructor