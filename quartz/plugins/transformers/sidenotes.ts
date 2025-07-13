import { QuartzTransformerPlugin } from "../types"
import { JSResource } from "../../util/resources"
// @ts-ignore
import sidenoteScript from "../../components/scripts/sidenotes.inline"

export interface Options {
  enableSidenotes: boolean
}

const defaultOptions: Options = {
  enableSidenotes: true,
}

const sidenoteBlockRegex = new RegExp(/^> *\[\!([\w-]+)\|aside-(l|r)\]([+-]?)(.*?)(?:\n|$)((?:> .*(?:\n|$))*)/gm)

export const Sidenotes: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "Sidenotes",
    textTransform(_ctx, src) {
      if (!opts.enableSidenotes) {
        return src
      }

      // Transform sidenote callouts to HTML at text level to avoid conflicts with other plugins
      return src.replace(sidenoteBlockRegex, (match, typeString, position, collapseChar, titleText, content) => {
        console.log("SIDENOTES PLUGIN: Processing sidenote", { typeString, position, collapseChar, titleText })
        const isCollapsible = collapseChar === "+" || collapseChar === "-"
        const defaultState = collapseChar === "-" ? "collapsed" : "expanded"
        const titleContent = titleText.trim() || typeString.charAt(0).toUpperCase() + typeString.slice(1)
        
        // Process the content - remove > prefixes
        const processedContent = content
          .split('\n')
          .map(line => line.replace(/^> ?/, ''))
          .filter(line => line.trim() !== '')
          .join('\n')
        
        const classNames = ["sidenote", `sidenote-${position}`, typeString.toLowerCase()]
        if (isCollapsible) {
          classNames.push("is-collapsible")
        }
        if (defaultState === "collapsed") {
          classNames.push("is-collapsed")
        }

        const toggleIcon = isCollapsible ? `<div class="sidenote-fold-icon"></div>` : ""
        
        // Use HTML comment markers to prevent further markdown processing
        const html = `<!-- SIDENOTE_START -->
<div class="${classNames.join(" ")}" data-sidenote="${typeString}" data-sidenote-position="${position}" data-sidenote-fold="${isCollapsible}">
  <div class="sidenote-title">
    <div class="sidenote-icon"></div>
    <div class="sidenote-title-inner">${titleContent}</div>
    ${toggleIcon}
  </div>
  <div class="sidenote-content">
    <div class="sidenote-content-inner">
      ${processedContent}
    </div>
  </div>
</div>
<!-- SIDENOTE_END -->`
        
        return html
      })
    },
    externalResources() {
      if (!opts.enableSidenotes) {
        return { js: [], css: [] }
      }

      const js: JSResource[] = [{
        script: sidenoteScript,
        loadTime: "afterDOMReady",
        contentType: "inline",
      }]

      return { js, css: [] }
    },
  }
}