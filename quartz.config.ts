import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Sleepless in Debugging",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    baseUrl: "sleeplessindebugging.blog",
    ignorePatterns: [
      "private",
      "templates",
      ".obsidian",
      "4archives",
      "journal",
      "public",
      "boilerplates",
      "inbox",
      "highlights/Archive",
      "**/__order__.md",
    ],
    defaultDateType: "created",
    theme: {
      fontOrigin: "local",
      cdnCaching: true,
      typography: {
        header: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
        body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
        code: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      },
      colors: {
        // Flexoki color palette - https://stephango.com/flexoki
        lightMode: {
          light: "#FFFCF0",      // paper (bg)
          lightgray: "#E6E4D9",  // base-100 (ui)
          gray: "#6F6E69",       // base-600 (tx-2)
          darkgray: "#1C1B1A",   // base-950 (tx)
          dark: "#100F0F",       // black
          secondary: "#205EA6",  // blue-600 (links)
          tertiary: "#24837B",   // cyan-600 (hover)
          highlight: "#F2F0E5",  // base-50
          textHighlight: "#D0A215", // yellow-400
        },
        darkMode: {
          light: "#100F0F",      // black (bg)
          lightgray: "#282726",  // base-900 (ui)
          gray: "#575653",       // base-700 (tx-3)
          darkgray: "#CECDC3",   // base-200 (tx)
          dark: "#FFFCF0",       // paper
          secondary: "#4385BE",  // blue-400 (links)
          tertiary: "#3AA99F",   // cyan-400 (hover)
          highlight: "#1C1B1A",  // base-950
          textHighlight: "#AD8301", // yellow-600
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.Sidenotes(),
      Plugin.HardLineBreaks(),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage({
        sort(f1, f2) {
          return (
            (f2.dates?.created ?? new Date()).getTime() -
            (f1.dates?.created ?? new Date()).getTime()
          )
        },
      }),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: false,
        enableRSS: false,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      // Plugin.CustomOgImages(),
    ],
  },
}

export default config
