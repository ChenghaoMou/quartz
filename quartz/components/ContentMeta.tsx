import { Date, getDate } from "./Date"
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import readingTime from "reading-time"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { JSX } from "preact"
import style from "./styles/contentMeta.scss"
// @ts-ignore
import sidenotesScript from "./scripts/sidenotesToggle.inline"
import sidenotesStyle from "./styles/sidenotesToggle.scss"

interface ContentMetaOptions {
  /**
   * Whether to display reading time
   */
  showReadingTime: boolean
  showComma: boolean
  showSidenotesToggle: boolean
}

const defaultOptions: ContentMetaOptions = {
  showReadingTime: true,
  showComma: true,
  showSidenotesToggle: true,
}

export default ((opts?: Partial<ContentMetaOptions>) => {
  // Merge options with defaults
  const options: ContentMetaOptions = { ...defaultOptions, ...opts }

  function ContentMetadata({ cfg, fileData, displayClass }: QuartzComponentProps) {
    const text = fileData.text

    if (text) {
      const segments: (string | JSX.Element)[] = []

      if (fileData.dates) {
        segments.push(<Date date={getDate(cfg, fileData)!} locale={cfg.locale} />)
      }

      // Display reading time if enabled
      if (options.showReadingTime) {
        const { minutes, words: _words } = readingTime(text)
        const displayedTime = i18n(cfg.locale).components.contentMeta.readingTime({
          minutes: Math.ceil(minutes),
        })
        segments.push(<span>{displayedTime}</span>)
      }

      return (
        <div class={classNames(displayClass, "content-meta-row")}>
          <p show-comma={options.showComma} class="content-meta">
            {segments}
          </p>
          {options.showSidenotesToggle && (
            <button
              class="sidenotes-toggle"
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
          )}
        </div>
      )
    } else {
      return null
    }
  }

  ContentMetadata.css = style + sidenotesStyle
  ContentMetadata.afterDOMLoaded = sidenotesScript

  return ContentMetadata
}) satisfies QuartzComponentConstructor
