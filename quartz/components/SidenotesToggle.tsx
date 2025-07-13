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
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="hideIcon"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <title>Hide sidenotes</title>
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M19.5 15.6857L19.5 4.5H4.5V18.75L5.25 19.5L13.7205 19.5V19.5H15.2205V19.5H15.6857L19.5 15.6857ZM15.2205 17.8439L17.8437 15.2206H15.2205V17.8439ZM18 13.7206L18 6L6 6L6 18L13.7205 18V13.7206H18Z"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="showIcon"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <title>Show sidenotes</title>
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M19.5 15.6857L19.5 4.5H4.5V18.75L5.25 19.5L13.7205 19.5V19.5H15.2205V19.5H15.6857L19.5 15.6857ZM15.2205 17.8439L17.8437 15.2206H15.2205V17.8439ZM18 13.7206L18 6L6 6L6 18L13.7205 18V13.7206H18Z"
          opacity="0.5"
        />
      </svg>
    </button>
  )
}

SidenotesToggle.afterDOMLoaded = script
SidenotesToggle.css = styles

export default (() => SidenotesToggle) satisfies QuartzComponentConstructor